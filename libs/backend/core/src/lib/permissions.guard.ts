import { CanActivate, type ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AppPermission } from '@kuetelabs/shared/domain';
import type { AuthenticatedRequest } from './current-user';
import { PERMISSIONS_KEY } from './permissions.decorator';

/**
 * Enforces @RequirePermissions. Runs after SupabaseAuthGuard, which populates
 * request.user from the verified token.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<AppPermission[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required?.length) {
      return true;
    }

    const user = context.switchToHttp().getRequest<AuthenticatedRequest>().user;
    const missing = required.filter((permission) => !user?.permissions.includes(permission));

    if (missing.length > 0) {
      throw new ForbiddenException(`Missing permission(s): ${missing.join(', ')}`);
    }
    return true;
  }
}
