import {
  CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { type AppPermission, type AppRole, jwtClaimsSchema } from '@kuetelabs/shared/domain';
import { loadServerConfig } from './config';
import type { AuthenticatedRequest, AuthenticatedUser } from './current-user';

/**
 * Verifies the caller's Supabase JWT and populates `request.user`.
 *
 * The API does not issue tokens — Supabase Auth is the only identity authority, so
 * there is one session and no user table to keep in sync. Verification goes through
 * `auth.getUser(token)`, which validates the signature against the project's keys.
 */
@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  private readonly config = loadServerConfig();
  private readonly client = createClient(this.config.SUPABASE_URL, this.config.SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const header = request.headers.authorization;

    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const token = header.slice('Bearer '.length);
    const { data, error } = await this.client.auth.getUser(token);

    if (error || !data.user) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    // Claims were stamped by the custom_access_token_hook at token issue time.
    const claims = jwtClaimsSchema.parse({
      app_roles: (data.user.app_metadata?.['app_roles'] as AppRole[]) ?? decodeClaim(token, 'app_roles'),
      app_permissions:
        (data.user.app_metadata?.['app_permissions'] as AppPermission[]) ??
        decodeClaim(token, 'app_permissions'),
    });

    const user: AuthenticatedUser = {
      id: data.user.id,
      email: data.user.email ?? null,
      roles: claims.app_roles,
      permissions: claims.app_permissions,
    };
    request.user = user;
    return true;
  }
}

/**
 * Reads a claim from the already-verified token. Safe because `getUser` above has
 * validated the signature — this only avoids a second round trip for the claim.
 */
function decodeClaim(token: string, claim: string): unknown[] {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString('utf8'));
    return Array.isArray(payload[claim]) ? payload[claim] : [];
  } catch {
    return [];
  }
}
