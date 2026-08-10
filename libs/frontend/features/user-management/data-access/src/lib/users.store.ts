import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { setAllEntities, updateEntity, withEntities } from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { EMPTY, from, pipe } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs/operators';
import type { AppRole, ManagedUser, RolePermissionMatrix } from '@kuetelabs/shared/domain';
import { UserAdminApi } from './user-admin.api';

interface UsersState {
  total: number;
  matrix: RolePermissionMatrix | null;
  loading: boolean;
  error: string | null;
  search: string;
}

const initialState: UsersState = {
  total: 0,
  matrix: null,
  loading: false,
  error: null,
  search: '',
};

function messageOf(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'error' in error) {
    const body = (error as { error?: { message?: string | string[] } }).error;
    if (body?.message) {
      return Array.isArray(body.message) ? body.message.join(', ') : body.message;
    }
  }
  return error instanceof Error ? error.message : 'Request failed';
}

/**
 * State for the user administration screens.
 *
 * Components read the signals and call the methods; nothing here touches HTTP or
 * Supabase directly, and no component does either. Users are held as entities so a
 * single-row patch (a role toggle) is an O(1) update rather than a list rebuild.
 */
export const UsersStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withEntities<ManagedUser>(),
  withComputed(({ entities, loading }) => ({
    isEmpty: computed(() => !loading() && entities().length === 0),
  })),
  withMethods((store, api = inject(UserAdminApi)) => {
    /**
     * Debounced so typing in the search box issues one request, and switchMap so a
     * slow earlier response can never overwrite a newer one. catchError sits inside
     * switchMap to keep the outer stream alive after a failure.
     */
    const runSearch = rxMethod<string>(
      pipe(
        debounceTime(250),
        distinctUntilChanged(),
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap((term) =>
          from(api.listUsers({ search: term || undefined })).pipe(
            tap((page) =>
              patchState(store, setAllEntities(page.users), {
                total: page.total,
                loading: false,
              }),
            ),
            catchError((error: unknown) => {
              patchState(store, { error: messageOf(error), loading: false });
              return EMPTY;
            }),
          ),
        ),
      ),
    );

    const reload = (): void => {
      // rxMethod returns a subscription ref; the callers here don't need it.
      runSearch(store.search());
    };

    return {
      reload,

      setSearch(term: string): void {
        patchState(store, { search: term });
        runSearch(term);
      },

      async loadMatrix(): Promise<void> {
        patchState(store, { loading: true, error: null });
        try {
          patchState(store, { matrix: await api.roleMatrix() });
        } catch (error) {
          patchState(store, { error: messageOf(error) });
        } finally {
          patchState(store, { loading: false });
        }
      },

      async toggleRole(user: ManagedUser, role: AppRole): Promise<void> {
        const hasRole = user.roles.includes(role);
        patchState(store, { error: null });

        // Optimistic: the server is the authority, so a failure reloads from it.
        patchState(
          store,
          updateEntity({
            id: user.id,
            changes: (current) => ({
              roles: hasRole
                ? current.roles.filter((r) => r !== role)
                : [...current.roles, role],
            }),
          }),
        );

        try {
          const dto = { userId: user.id, role };
          await (hasRole ? api.revokeRole(dto) : api.grantRole(dto));
        } catch (error) {
          patchState(store, { error: messageOf(error) });
          reload();
        }
      },

      async setDisabled(user: ManagedUser, disabled: boolean): Promise<void> {
        patchState(store, { error: null });
        patchState(store, updateEntity({ id: user.id, changes: { disabled } }));
        try {
          await api.setDisabled({ userId: user.id, disabled });
        } catch (error) {
          patchState(store, { error: messageOf(error) });
          reload();
        }
      },

      async invite(email: string, roles: AppRole[]): Promise<boolean> {
        patchState(store, { error: null });
        try {
          await api.invite({ email, roles });
          reload();
          return true;
        } catch (error) {
          patchState(store, { error: messageOf(error) });
          return false;
        }
      },
    };
  }),
);
