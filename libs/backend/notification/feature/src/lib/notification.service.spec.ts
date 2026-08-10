import type { SupabaseAdminService } from '@kuetelabs/backend/supabase';
import { NotificationService } from './notification.service';

function serviceWith(insertError: { message: string } | null = null) {
  const inserted: Record<string, unknown>[] = [];

  const client = {
    from: () => ({
      insert: (row: Record<string, unknown>) => {
        inserted.push(row);
        return Promise.resolve({ error: insertError });
      },
    }),
  };

  const supabase = {
    withAdmin: <T>(_operation: string, fn: (c: unknown) => Promise<T>) => fn(client),
  } as unknown as SupabaseAdminService;

  return { service: new NotificationService(supabase), inserted };
}

describe('NotificationService', () => {
  it('maps the DTO onto the row shape', async () => {
    const { service, inserted } = serviceWith();

    await service.notify({
      userId: 'user-1',
      type: 'role.granted',
      title: 'You were granted the admin role',
      body: 'Sign out and back in.',
      actionUrl: '/users',
    });

    expect(inserted[0]).toEqual(
      expect.objectContaining({
        user_id: 'user-1',
        type: 'role.granted',
        title: 'You were granted the admin role',
        body: 'Sign out and back in.',
        action_url: '/users',
      }),
    );
  });

  it('defaults optional fields to null rather than undefined', async () => {
    const { service, inserted } = serviceWith();

    await service.notify({ userId: 'user-1', type: 'system', title: 'Heads up' });

    expect(inserted[0]).toEqual(
      expect.objectContaining({ body: null, action_url: null, metadata: {} }),
    );
  });

  it('does not throw when the insert fails', async () => {
    // A failed notification must never roll back the operation that triggered it.
    const { service } = serviceWith({ message: 'db unavailable' });

    await expect(
      service.notify({ userId: 'user-1', type: 'system', title: 'Heads up' }),
    ).resolves.toBeUndefined();
  });

  it('fans out to every recipient', async () => {
    const { service, inserted } = serviceWith();

    await service.notifyMany(['a', 'b', 'c'], { type: 'system', title: 'Maintenance tonight' });

    expect(inserted.map((row) => row['user_id'])).toEqual(['a', 'b', 'c']);
  });
});
