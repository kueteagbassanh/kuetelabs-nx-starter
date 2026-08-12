import { SetMetadata } from '@nestjs/common';
import type { AppPermission } from '@kuetelabs/shared/domain';

export const PERMISSIONS_KEY = 'required_permissions';

/** `@RequirePermissions('roles.assign')` — enforced by PermissionsGuard. */
export const RequirePermissions = (...permissions: AppPermission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
