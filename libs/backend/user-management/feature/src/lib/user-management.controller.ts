import { Body, Controller, Get, Patch, Post, Query, UseGuards } from '@nestjs/common';
import {
  type AuthenticatedUser,
  CurrentUser,
  PermissionsGuard,
  RequirePermissions,
  SupabaseAuthGuard,
  ZodValidationPipe,
} from '@kuetelabs/backend/core';
import {
  type GrantRoleDto,
  type InviteUserDto,
  type ListUsersQuery,
  type SetUserDisabledDto,
  grantRoleSchema,
  inviteUserSchema,
  listUsersQuerySchema,
  revokeRoleSchema,
  setUserDisabledSchema,
} from '@kuetelabs/shared/domain';
import { UserManagementService } from './user-management.service';

/**
 * Admin surface for user and role management.
 *
 * Every route requires a verified Supabase JWT plus an explicit permission. The
 * permission check is here, on the server, in addition to RLS in the database —
 * the Angular guard and *libHasPermission are only about what gets rendered.
 */
@Controller('admin/users')
@UseGuards(SupabaseAuthGuard, PermissionsGuard)
export class UserManagementController {
  constructor(private readonly users: UserManagementService) {}

  @Get()
  @RequirePermissions('users.read')
  list(@Query(new ZodValidationPipe(listUsersQuerySchema)) query: ListUsersQuery) {
    return this.users.listUsers(query);
  }

  @Get('role-matrix')
  @RequirePermissions('roles.read')
  matrix() {
    return this.users.getMatrix();
  }

  @Post('invite')
  @RequirePermissions('users.invite')
  invite(
    @CurrentUser() actor: AuthenticatedUser,
    @Body(new ZodValidationPipe(inviteUserSchema)) dto: InviteUserDto,
  ) {
    return this.users.inviteUser(actor.id, dto);
  }

  @Post('roles/grant')
  @RequirePermissions('roles.assign')
  grant(
    @CurrentUser() actor: AuthenticatedUser,
    @Body(new ZodValidationPipe(grantRoleSchema)) dto: GrantRoleDto,
  ) {
    return this.users.grantRole(actor.id, dto);
  }

  @Post('roles/revoke')
  @RequirePermissions('roles.assign')
  revoke(
    @CurrentUser() actor: AuthenticatedUser,
    @Body(new ZodValidationPipe(revokeRoleSchema)) dto: GrantRoleDto,
  ) {
    return this.users.revokeRole(actor.id, dto);
  }

  @Patch('disabled')
  @RequirePermissions('users.disable')
  setDisabled(
    @CurrentUser() actor: AuthenticatedUser,
    @Body(new ZodValidationPipe(setUserDisabledSchema)) dto: SetUserDisabledDto,
  ) {
    return this.users.setDisabled(actor.id, dto);
  }
}
