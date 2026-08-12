import { z } from 'zod';
import type { Database } from '@kuetelabs/shared/database-types';

/**
 * The RBAC contract shared by the Angular apps and the NestJS API. Roles and
 * permissions are derived from the generated database enums, so a migration that
 * adds a permission breaks compilation everywhere it needs handling.
 */
export type AppRole = Database['public']['Enums']['app_role'];
export type AppPermission = Database['public']['Enums']['app_permission'];

export const APP_ROLES = ['admin', 'manager', 'support', 'member'] as const satisfies readonly AppRole[];

export const APP_PERMISSIONS = [
  'users.read',
  'users.invite',
  'users.update',
  'users.disable',
  'roles.read',
  'roles.assign',
  'audit.read',
] as const satisfies readonly AppPermission[];

export const appRoleSchema = z.enum(APP_ROLES);
export const appPermissionSchema = z.enum(APP_PERMISSIONS);

/** Claims the custom access token hook adds to the JWT. */
export const jwtClaimsSchema = z.object({
  app_roles: z.array(appRoleSchema).default([]),
  app_permissions: z.array(appPermissionSchema).default([]),
});
export type JwtRbacClaims = z.infer<typeof jwtClaimsSchema>;

// ---------------------------------------------------------------- API payloads

export const inviteUserSchema = z.object({
  email: z.email(),
  fullName: z.string().trim().min(1).max(120).optional(),
  roles: z.array(appRoleSchema).default([]),
});
export type InviteUserDto = z.infer<typeof inviteUserSchema>;

export const grantRoleSchema = z.object({
  userId: z.uuid(),
  role: appRoleSchema,
});
export type GrantRoleDto = z.infer<typeof grantRoleSchema>;

export const revokeRoleSchema = grantRoleSchema;
export type RevokeRoleDto = z.infer<typeof revokeRoleSchema>;

export const setUserDisabledSchema = z.object({
  userId: z.uuid(),
  disabled: z.boolean(),
});
export type SetUserDisabledDto = z.infer<typeof setUserDisabledSchema>;

export const listUsersQuerySchema = z.object({
  search: z.string().trim().max(200).optional(),
  role: appRoleSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  offset: z.coerce.number().int().min(0).default(0),
});
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;

// ---------------------------------------------------------------- API responses

/** A user as the admin UI sees them. Deliberately not the raw profiles row. */
export interface ManagedUser {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  disabled: boolean;
  roles: AppRole[];
  createdAt: string;
}

export interface ManagedUserPage {
  users: ManagedUser[];
  total: number;
}

export interface RolePermissionMatrix {
  roles: AppRole[];
  permissions: AppPermission[];
  /** `granted[role]` lists the permissions that role holds. */
  granted: Record<AppRole, AppPermission[]>;
}
