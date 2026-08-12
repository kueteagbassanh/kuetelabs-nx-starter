import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import {
  DASHBOARD_MENU_CONFIG,
  type NavigationGroup,
  type NavigationItem,
  type SidebarConfig,
} from './navigation.model';

interface SidebarState {
  config: SidebarConfig;
}

function findItem(groups: NavigationGroup[], label: string): NavigationItem | undefined {
  for (const group of groups) {
    const found = group.items.find((item) => item.label === label);
    if (found) {
      return found;
    }
  }
  return undefined;
}

/**
 * Runtime state of the dashboard navigation.
 *
 * Seeded from the DASHBOARD_MENU_CONFIG the app provides, then cloned — badges are
 * mutated at runtime and the injected config is shared, so writing through it would
 * leak one app's state into another's provider value.
 */
export const SidebarStore = signalStore(
  { providedIn: 'root' },
  withState(() => ({ config: structuredClone(inject(DASHBOARD_MENU_CONFIG)) }) as SidebarState),
  withMethods((store) => {
    const mutate = (change: (config: SidebarConfig) => void): void => {
      const next = structuredClone(store.config());
      change(next);
      patchState(store, { config: next });
    };

    return {
      /** Sets the badge on a navigation item, searched by label across all groups. */
      updateBadge(itemLabel: string, badge: string | undefined): void {
        mutate((config) => {
          const item = findItem(config.groups, itemLabel);
          if (item) {
            item.badge = badge;
          }
        });
      },

      /** Sets several badges at once: `{ Inbox: '12', Alerts: undefined }`. */
      updateBadges(badges: Record<string, string | undefined>): void {
        mutate((config) => {
          for (const [label, badge] of Object.entries(badges)) {
            const item = findItem(config.groups, label);
            if (item) {
              item.badge = badge;
            }
          }
        });
      },

      clearBadge(itemLabel: string): void {
        mutate((config) => {
          const item = findItem(config.groups, itemLabel);
          if (item) {
            item.badge = undefined;
          }
        });
      },

      clearAllBadges(): void {
        mutate((config) => {
          for (const group of config.groups) {
            for (const item of group.items) {
              item.badge = undefined;
            }
          }
        });
      },
    };
  }),
);
