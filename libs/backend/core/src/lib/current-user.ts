import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { AppPermission, AppRole } from '@kuetelabs/shared/domain';

export interface AuthenticatedUser {
  id: string;
  email: string | null;
  roles: AppRole[];
  permissions: AppPermission[];
}

/**
 * Request shape after SupabaseAuthGuard has run. An explicit type rather than a
 * `declare module 'express'` augmentation: ambient augmentation resolves
 * inconsistently across the webpack build and ts-jest, and this is checkable.
 */
export type AuthenticatedRequest = Request & { user?: AuthenticatedUser };

/** `@CurrentUser() user: AuthenticatedUser` — populated by SupabaseAuthGuard. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser | undefined =>
    context.switchToHttp().getRequest<AuthenticatedRequest>().user,
);
