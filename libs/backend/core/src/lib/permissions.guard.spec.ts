import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from './permissions.guard';
import type { AppPermission } from '@kuetelabs/shared/domain';

function contextWith(permissions: AppPermission[] | undefined) {
  return {
    switchToHttp: () => ({
      getRequest: () => (permissions ? { user: { id: 'u1', permissions } } : {}),
    }),
    getHandler: () => undefined,
    getClass: () => undefined,
  } as never;
}

function guardRequiring(required: AppPermission[] | undefined) {
  const reflector = { getAllAndOverride: () => required } as unknown as Reflector;
  return new PermissionsGuard(reflector);
}

describe('PermissionsGuard', () => {
  it('allows a route with no permission metadata', () => {
    expect(guardRequiring(undefined).canActivate(contextWith([]))).toBe(true);
  });

  it('allows when the user holds every required permission', () => {
    const guard = guardRequiring(['users.read', 'roles.read']);
    expect(guard.canActivate(contextWith(['users.read', 'roles.read', 'audit.read']))).toBe(true);
  });

  it('denies when one required permission is missing', () => {
    const guard = guardRequiring(['users.read', 'roles.assign']);
    expect(() => guard.canActivate(contextWith(['users.read']))).toThrow(ForbiddenException);
  });

  it('denies an unauthenticated request rather than treating it as unrestricted', () => {
    // request.user is absent when SupabaseAuthGuard has not run — must fail closed.
    const guard = guardRequiring(['users.read']);
    expect(() => guard.canActivate(contextWith(undefined))).toThrow(ForbiddenException);
  });

  it('names the missing permissions so the client can act on the error', () => {
    const guard = guardRequiring(['roles.assign']);
    expect(() => guard.canActivate(contextWith([]))).toThrow(/roles\.assign/);
  });
});
