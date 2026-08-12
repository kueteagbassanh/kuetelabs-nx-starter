import { InjectionToken, Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  type GrantRoleDto,
  type InviteUserDto,
  type ListUsersQuery,
  type ManagedUserPage,
  type RolePermissionMatrix,
  type SetUserDisabledDto,
} from '@kuetelabs/shared/domain';
import { AuthStore } from '@kuetelabs/frontend/data-access/supabase';

/** Base URL of the NestJS API, e.g. `http://localhost:3000/api`. */
export const USER_ADMIN_API_URL = new InjectionToken<string>('USER_ADMIN_API_URL');

/**
 * Client for the privileged admin endpoints.
 *
 * These operations are service_role work, so they go through the API rather than
 * Supabase directly — user_roles has no client write policy at all.
 */
@Injectable({ providedIn: 'root' })
export class UserAdminApi {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthStore);
  private readonly baseUrl = inject(USER_ADMIN_API_URL);

  private async authHeaders(): Promise<Record<string, string>> {
    const token = this.auth.session()?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async listUsers(query: Partial<ListUsersQuery> = {}): Promise<ManagedUserPage> {
    const params = Object.fromEntries(
      Object.entries(query).filter(([, value]) => value !== undefined && value !== ''),
    ) as Record<string, string | number>;

    return firstValueFrom(
      this.http.get<ManagedUserPage>(`${this.baseUrl}/admin/users`, {
        params,
        headers: await this.authHeaders(),
      }),
    );
  }

  async roleMatrix(): Promise<RolePermissionMatrix> {
    return firstValueFrom(
      this.http.get<RolePermissionMatrix>(`${this.baseUrl}/admin/users/role-matrix`, {
        headers: await this.authHeaders(),
      }),
    );
  }

  async invite(dto: InviteUserDto): Promise<{ userId: string }> {
    return firstValueFrom(
      this.http.post<{ userId: string }>(`${this.baseUrl}/admin/users/invite`, dto, {
        headers: await this.authHeaders(),
      }),
    );
  }

  async grantRole(dto: GrantRoleDto): Promise<void> {
    await firstValueFrom(
      this.http.post(`${this.baseUrl}/admin/users/roles/grant`, dto, {
        headers: await this.authHeaders(),
      }),
    );
  }

  async revokeRole(dto: GrantRoleDto): Promise<void> {
    await firstValueFrom(
      this.http.post(`${this.baseUrl}/admin/users/roles/revoke`, dto, {
        headers: await this.authHeaders(),
      }),
    );
  }

  async setDisabled(dto: SetUserDisabledDto): Promise<void> {
    await firstValueFrom(
      this.http.patch(`${this.baseUrl}/admin/users/disabled`, dto, {
        headers: await this.authHeaders(),
      }),
    );
  }
}
