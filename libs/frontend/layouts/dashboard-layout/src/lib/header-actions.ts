import { InjectionToken, type Type } from '@angular/core';

/**
 * Components rendered in the dashboard header, right-aligned.
 *
 * A token rather than content projection because the layout is a *routed*
 * component — there is no parent template to project into. Apps provide what they
 * need (`{ provide: DASHBOARD_HEADER_ACTIONS, useValue: [NotificationBell] }`),
 * which keeps the layout from depending on any feature: `web` has no Supabase
 * configured, and must not inherit a header that requires it.
 */
export const DASHBOARD_HEADER_ACTIONS = new InjectionToken<Type<unknown>[]>(
  'DASHBOARD_HEADER_ACTIONS',
  { providedIn: 'root', factory: () => [] },
);
