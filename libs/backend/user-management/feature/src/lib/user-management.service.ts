import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  type AppRole,
  type GrantRoleDto,
  type InviteUserDto,
  type ListUsersQuery,
  type ManagedUser,
  type ManagedUserPage,
  type RolePermissionMatrix,
  type SetUserDisabledDto,
  APP_PERMISSIONS,
  APP_ROLES,
} from '@kuetelabs/shared/domain';
import { SupabaseAdminService } from '@kuetelabs/backend/supabase';
import { NotificationService } from '@kuetelabs/backend/notification';

/**
 * Privileged user administration.
 *
 * Every mutation here needs the service_role key: `user_roles` has no client write
 * policy, so role changes are not expressible from a browser at all. Each one also
 * writes a `role_audit_log` row — a privilege change with no record is a gap.
 */
@Injectable()
export class UserManagementService {
  constructor(
    private readonly supabase: SupabaseAdminService,
    private readonly notifications: NotificationService,
  ) {}

  async listUsers(query: ListUsersQuery): Promise<ManagedUserPage> {
    return this.supabase.withAdmin('listUsers', async (client) => {
      let profiles = client
        .from('profiles')
        .select('id, email, full_name, avatar_url, disabled_at, created_at', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(query.offset, query.offset + query.limit - 1);

      if (query.search) {
        profiles = profiles.ilike('email', `%${query.search}%`);
      }

      const { data: rows, count, error } = await profiles;
      if (error) {
        throw new BadRequestException(error.message);
      }

      const ids = (rows ?? []).map((row) => row.id);
      const rolesByUser = await this.rolesFor(ids);

      const users: ManagedUser[] = (rows ?? []).map((row) => ({
        id: row.id,
        email: row.email,
        fullName: row.full_name,
        avatarUrl: row.avatar_url,
        disabled: row.disabled_at !== null,
        roles: rolesByUser.get(row.id) ?? [],
        createdAt: row.created_at,
      }));

      // Role filtering happens after the join because a user's roles live in a
      // separate table; for large datasets replace this with a view.
      const filtered = query.role ? users.filter((user) => user.roles.includes(query.role as AppRole)) : users;

      return { users: filtered, total: count ?? filtered.length };
    });
  }

  async getMatrix(): Promise<RolePermissionMatrix> {
    return this.supabase.withAdmin('getMatrix', async (client) => {
      const { data, error } = await client.from('role_permissions').select('role, permission');
      if (error) {
        throw new BadRequestException(error.message);
      }

      // reduce, not Object.fromEntries: fromEntries widens the keys to string, so
      // the cast to a Record keyed by AppRole was hiding a type hole.
      const granted = APP_ROLES.reduce<RolePermissionMatrix['granted']>(
        (map, role) => ({ ...map, [role]: [] }),
        {} as RolePermissionMatrix['granted'],
      );
      for (const row of data ?? []) {
        granted[row.role].push(row.permission);
      }

      return { roles: [...APP_ROLES], permissions: [...APP_PERMISSIONS], granted };
    });
  }

  async grantRole(actorId: string, dto: GrantRoleDto): Promise<void> {
    await this.assertUserExists(dto.userId);

    await this.supabase.withAdmin('grantRole', async (client) => {
      const { error } = await client
        .from('user_roles')
        .insert({ user_id: dto.userId, role: dto.role, granted_by: actorId });

      // Unique violation means the grant already exists — idempotent, not an error.
      if (error && error.code !== '23505') {
        throw new BadRequestException(error.message);
      }

      await this.audit(actorId, dto.userId, 'grant', dto.role);
    });

    await this.notifications.notify({
      userId: dto.userId,
      type: 'role.granted',
      title: `You were granted the ${dto.role} role`,
      body: 'Sign out and back in if the new permissions are not visible yet — they travel in your access token.',
      actionUrl: '/',
    });
  }

  async revokeRole(actorId: string, dto: GrantRoleDto): Promise<void> {
    await this.assertUserExists(dto.userId);

    if (actorId === dto.userId && dto.role === 'admin') {
      // Without this, an admin can lock everyone out of role management.
      await this.assertNotLastAdmin(dto.userId);
    }

    await this.supabase.withAdmin('revokeRole', async (client) => {
      const { error } = await client
        .from('user_roles')
        .delete()
        .eq('user_id', dto.userId)
        .eq('role', dto.role);

      if (error) {
        throw new BadRequestException(error.message);
      }

      await this.audit(actorId, dto.userId, 'revoke', dto.role);
    });

    await this.notifications.notify({
      userId: dto.userId,
      type: 'role.revoked',
      title: `Your ${dto.role} role was removed`,
      actionUrl: '/',
    });
  }

  async inviteUser(actorId: string, dto: InviteUserDto): Promise<{ userId: string }> {
    return this.supabase.withAdmin('inviteUser', async (client) => {
      const { data, error } = await client.auth.admin.inviteUserByEmail(dto.email, {
        data: dto.fullName ? { full_name: dto.fullName } : undefined,
      });

      if (error || !data.user) {
        throw new BadRequestException(error?.message ?? 'Invite failed');
      }

      for (const role of dto.roles) {
        await client
          .from('user_roles')
          .insert({ user_id: data.user.id, role, granted_by: actorId });
      }

      await this.audit(actorId, data.user.id, 'invite', null, { roles: dto.roles });

      await this.notifications.notify({
        userId: data.user.id,
        type: 'user.invited',
        title: 'Welcome — your account has been created',
        body: dto.roles.length > 0 ? `You start with: ${dto.roles.join(', ')}.` : undefined,
        actionUrl: '/',
      });

      return { userId: data.user.id };
    });
  }

  async setDisabled(actorId: string, dto: SetUserDisabledDto): Promise<void> {
    await this.assertUserExists(dto.userId);

    await this.supabase.withAdmin('setDisabled', async (client) => {
      const { error } = await client
        .from('profiles')
        .update({ disabled_at: dto.disabled ? new Date().toISOString() : null })
        .eq('id', dto.userId);

      if (error) {
        throw new BadRequestException(error.message);
      }

      // Disabling must also end live sessions: the existing JWT stays valid for its
      // full lifetime otherwise, so the user would keep their access until it expires.
      if (dto.disabled) {
        await client.auth.admin.signOut(dto.userId, 'global').catch(() => undefined);
      }

      await this.audit(actorId, dto.userId, dto.disabled ? 'disable' : 'enable');
    });

    // A disabled user has been signed out globally, so this is waiting for them
    // if the account is re-enabled.
    await this.notifications.notify({
      userId: dto.userId,
      type: dto.disabled ? 'user.disabled' : 'user.enabled',
      title: dto.disabled ? 'Your account was disabled' : 'Your account was re-enabled',
      actionUrl: '/',
    });
  }

  private async rolesFor(userIds: string[]): Promise<Map<string, AppRole[]>> {
    const map = new Map<string, AppRole[]>();
    if (userIds.length === 0) {
      return map;
    }

    return this.supabase.withAdmin('rolesFor', async (client) => {
      // One query for all users on the page — not one per user.
      const { data, error } = await client.from('user_roles').select('user_id, role').in('user_id', userIds);
      if (error) {
        throw new BadRequestException(error.message);
      }
      for (const row of data ?? []) {
        map.set(row.user_id, [...(map.get(row.user_id) ?? []), row.role]);
      }
      return map;
    });
  }

  private async assertUserExists(userId: string): Promise<void> {
    await this.supabase.withAdmin('assertUserExists', async (client) => {
      const { data, error } = await client.from('profiles').select('id').eq('id', userId).maybeSingle();
      if (error) {
        throw new BadRequestException(error.message);
      }
      if (!data) {
        throw new NotFoundException(`User ${userId} not found`);
      }
    });
  }

  private async assertNotLastAdmin(userId: string): Promise<void> {
    await this.supabase.withAdmin('assertNotLastAdmin', async (client) => {
      const { data, error } = await client.from('user_roles').select('user_id').eq('role', 'admin');
      if (error) {
        throw new BadRequestException(error.message);
      }
      const others = (data ?? []).filter((row) => row.user_id !== userId);
      if (others.length === 0) {
        throw new BadRequestException('Refusing to revoke the last admin role');
      }
    });
  }

  private async audit(
    actorId: string,
    subjectId: string,
    action: 'grant' | 'revoke' | 'invite' | 'disable' | 'enable',
    role: AppRole | null = null,
    metadata: Record<string, unknown> = {},
  ): Promise<void> {
    await this.supabase.withAdmin('audit', async (client) => {
      await client.from('role_audit_log').insert({
        actor_id: actorId,
        subject_id: subjectId,
        action,
        role,
        metadata: metadata as never,
      });
    });
  }
}
