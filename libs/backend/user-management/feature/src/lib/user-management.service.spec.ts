import { BadRequestException } from '@nestjs/common';
import type { SupabaseAdminService } from '@kuetelabs/backend/supabase';
import { UserManagementService } from './user-management.service';

/** Postgrest builders are thenable and also expose maybeSingle(); this mimics both. */
function result(data: unknown) {
  const promise = Promise.resolve({ data, error: null }) as Promise<unknown> & {
    maybeSingle?: () => Promise<unknown>;
  };
  promise.maybeSingle = () => Promise.resolve({ data, error: null });
  return promise;
}

function serviceWith(adminRows: { user_id: string }[]) {
  const inserts: Record<string, unknown>[] = [];

  const client = {
    from(table: string) {
      return {
        select: () => ({
          eq: (_column: string, value: unknown) =>
            table === 'profiles' ? result({ id: value }) : result(adminRows),
          in: () => result([]),
        }),
        delete: () => ({ eq: () => ({ eq: () => Promise.resolve({ error: null }) }) }),
        insert: (row: Record<string, unknown>) => {
          inserts.push({ table, ...row });
          return Promise.resolve({ error: null });
        },
      };
    },
  };

  const supabase = {
    withAdmin: <T>(_operation: string, fn: (c: unknown) => Promise<T>) => fn(client),
  } as unknown as SupabaseAdminService;

  return { service: new UserManagementService(supabase), inserts };
}

describe('UserManagementService', () => {
  describe('revokeRole', () => {
    it('refuses to remove the last admin', async () => {
      // Only this user holds admin, and they are revoking their own grant.
      const { service } = serviceWith([{ user_id: 'me' }]);

      await expect(service.revokeRole('me', { userId: 'me', role: 'admin' })).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.revokeRole('me', { userId: 'me', role: 'admin' })).rejects.toThrow(
        /last admin/i,
      );
    });

    it('allows self-revocation while another admin remains', async () => {
      const { service, inserts } = serviceWith([{ user_id: 'me' }, { user_id: 'someone-else' }]);

      await expect(
        service.revokeRole('me', { userId: 'me', role: 'admin' }),
      ).resolves.toBeUndefined();

      expect(inserts).toContainEqual(
        expect.objectContaining({ table: 'role_audit_log', action: 'revoke', role: 'admin' }),
      );
    });

    it('audits every revocation', async () => {
      const { service, inserts } = serviceWith([{ user_id: 'admin-1' }, { user_id: 'admin-2' }]);

      await service.revokeRole('actor', { userId: 'subject', role: 'support' });

      expect(inserts).toContainEqual(
        expect.objectContaining({
          table: 'role_audit_log',
          actor_id: 'actor',
          subject_id: 'subject',
          action: 'revoke',
        }),
      );
    });
  });

  describe('grantRole', () => {
    it('audits the grant', async () => {
      const { service, inserts } = serviceWith([]);

      await service.grantRole('actor', { userId: 'subject', role: 'manager' });

      expect(inserts).toContainEqual(
        expect.objectContaining({ table: 'user_roles', user_id: 'subject', role: 'manager' }),
      );
      expect(inserts).toContainEqual(
        expect.objectContaining({ table: 'role_audit_log', action: 'grant', role: 'manager' }),
      );
    });
  });
});
