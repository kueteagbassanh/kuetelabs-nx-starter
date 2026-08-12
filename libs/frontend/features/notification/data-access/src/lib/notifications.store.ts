import { DestroyRef, computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals';
import {
  removeEntity,
  setAllEntities,
  updateAllEntities,
  updateEntity,
  upsertEntity,
  withEntities,
} from '@ngrx/signals/entities';
import type { AppNotification } from '@kuetelabs/shared/domain';
import type { Database } from '@kuetelabs/shared/database-types';
import { AuthStore, injectSupabaseClient } from '@kuetelabs/frontend/data-access/supabase';

type NotificationRow = Database['public']['Tables']['notifications']['Row'];

interface NotificationsState {
  loading: boolean;
  error: string | null;
  /** Set when a row arrives over Realtime, so the UI can toast exactly once. */
  lastArrival: AppNotification | null;
}

const initialState: NotificationsState = { loading: false, error: null, lastArrival: null };

/** Maps the row to the shape the UI consumes — DTOs don't leak table columns. */
function toNotification(row: NotificationRow): AppNotification {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    actionUrl: row.action_url,
    read: row.read_at !== null,
    createdAt: row.created_at,
  };
}

/** How many notifications the bell holds; older ones live on the full page. */
const PAGE_SIZE = 20;

/**
 * The signed-in user's notifications.
 *
 * Reads and "mark as read" go straight to Supabase under RLS — both are the user's
 * own rows, so there is nothing for the API to add. Creation is the opposite case:
 * it needs service_role and lives in the API.
 *
 * Live updates come from a Realtime subscription, which RLS filters server-side.
 */
export const NotificationsStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withEntities<AppNotification>(),
  withComputed(({ entities }) => ({
    unreadCount: computed(() => entities().filter((n) => !n.read).length),
    hasUnread: computed(() => entities().some((n) => !n.read)),
  })),
  withMethods((store, supabase = injectSupabaseClient(), auth = inject(AuthStore)) => {
    const load = async (): Promise<void> => {
      const userId = auth.user()?.id;
      if (!userId) {
        return;
      }

      patchState(store, { loading: true, error: null });
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);

      if (error) {
        patchState(store, { error: error.message, loading: false });
        return;
      }
      patchState(store, setAllEntities((data ?? []).map(toNotification)), { loading: false });
    };

    return {
      load,

      /** Called by the Realtime subscription; also used by tests. */
      receive(row: NotificationRow): void {
        const notification = toNotification(row);
        patchState(store, upsertEntity(notification), { lastArrival: notification });
      },

      acknowledgeArrival(): void {
        patchState(store, { lastArrival: null });
      },

      async markRead(id: number): Promise<void> {
        // Optimistic: the badge should drop the instant it is clicked.
        patchState(store, updateEntity({ id, changes: { read: true } }));

        const { error } = await supabase
          .from('notifications')
          .update({ read_at: new Date().toISOString() })
          .eq('id', id);

        if (error) {
          patchState(store, { error: error.message });
          await load();
        }
      },

      async markAllRead(): Promise<void> {
        const unread = store.entities().filter((n) => !n.read);
        if (unread.length === 0) {
          return;
        }

        patchState(store, updateAllEntities({ read: true }));

        const { error } = await supabase
          .from('notifications')
          .update({ read_at: new Date().toISOString() })
          .is('read_at', null);

        if (error) {
          patchState(store, { error: error.message });
          await load();
        }
      },

      async dismiss(id: number): Promise<void> {
        patchState(store, removeEntity(id));
        const { error } = await supabase.from('notifications').delete().eq('id', id);
        if (error) {
          patchState(store, { error: error.message });
          await load();
        }
      },
    };
  }),
  withHooks({
    onInit(store, supabase = injectSupabaseClient(), auth = inject(AuthStore), destroyRef = inject(DestroyRef)) {
      const channel = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications' },
          (payload) => store.receive(payload.new as NotificationRow),
        )
        .subscribe();

      // Load once a session exists — on a cold start the user arrives after auth.
      if (auth.isAuthenticated()) {
        void store.load();
      }

      destroyRef.onDestroy(() => {
        void supabase.removeChannel(channel);
      });
    },
  }),
);
