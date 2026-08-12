import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { isSupabaseConfigured, provideSupabase } from '@kuetelabs/frontend/data-access/supabase';
import { USER_ADMIN_API_URL } from '@kuetelabs/frontend/features/user-management/data-access';
import { environment } from '../environments/environment';
import { provideIcons } from '@ng-icons/core';
import {
  lucideBell,
  lucideCreditCard,
  lucideDatabase,
  lucideFlag,
  lucideGauge,
  lucideScrollText,
  lucideSettings,
  lucideShieldCheck,
  lucideUsers,
} from '@ng-icons/lucide';
import { provideHlmSidebarConfig } from '@kuetelabs/frontend/ui/components/sidebar';
import {
  DASHBOARD_HEADER_ACTIONS,
  DASHBOARD_MENU_CONFIG,
  type SidebarConfig,
} from '@kuetelabs/frontend/layouts/dashboard-layout';
import { NotificationBell } from '@kuetelabs/frontend/features/notification/feature';
import { provideAuthPages } from '@kuetelabs/frontend/features/auth/feature';
import { provideErrorPages } from '@kuetelabs/frontend/layouts/error-layout';
import { appRoutes } from './app.routes';

/**
 * Admin navigation. The dashboard layout is shared with `web`; only this config
 * differs — which is the point of DASHBOARD_MENU_CONFIG being an injection token.
 */
/**
 * Features that talk to Supabase are only mounted once credentials exist, so a
 * freshly cloned starter still boots: the notification bell subscribes to Realtime
 * on construction, and mounting it unconfigured takes the whole shell down.
 */
const supabaseReady = isSupabaseConfigured({
  url: environment.supabaseUrl,
  anonKey: environment.supabaseAnonKey,
});

const adminMenu: SidebarConfig = {
  groups: [
    {
      label: 'Operations',
      items: [
        { label: 'Overview', url: '/', icon: 'lucideGauge', isActive: true },
        { label: 'Users', url: '/users', icon: 'lucideUsers', badge: '1.2k' },
        { label: 'Roles', url: '/roles', icon: 'lucideShieldCheck' },
        { label: 'Audit log', url: '/audit', icon: 'lucideScrollText' },
        // Hidden until Supabase is configured — the page needs a backend.
        ...(supabaseReady
          ? [{ label: 'Notifications', url: '/notifications', icon: 'lucideBell' }]
          : []),
      ],
    },
    {
      label: 'Platform',
      items: [
        { label: 'Feature flags', url: '/flags', icon: 'lucideFlag' },
        { label: 'Billing', url: '/billing', icon: 'lucideCreditCard' },
        { label: 'Storage', url: '/storage', icon: 'lucideDatabase' },
      ],
    },
    {
      label: 'Configuration',
      collapsible: true,
      defaultOpen: true,
      items: [{ label: 'Settings', url: '/settings', icon: 'lucideSettings' }],
    },
  ],
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(appRoutes, withComponentInputBinding()),
    provideHttpClient(withFetch()),
    // Admin is invite-only: no self-service signup, and OAuth stays off until the
    // provider credentials are configured in supabase/config.toml.
    provideAuthPages({
      appName: 'Admin',
      redirectAfterLogin: '/',
      signupEnabled: false,
      oauthProviders: [],
    }),
    provideSupabase({ url: environment.supabaseUrl, anonKey: environment.supabaseAnonKey }),
    // Copy and destinations for every screen under /error, plus the app-level 404.
    provideErrorPages({
      appName: 'Admin',
      homePath: '/',
      loginPath: '/auth/login',
    }),
    { provide: USER_ADMIN_API_URL, useValue: environment.apiUrl },
    // Icons provided here merge with the layout's own set, so each app brings
    // the icons its navigation needs without touching the shared layout lib.
    provideIcons({
      lucideBell,
      lucideGauge,
      lucideUsers,
      lucideShieldCheck,
      lucideScrollText,
      lucideFlag,
      lucideCreditCard,
      lucideDatabase,
      lucideSettings,
    }),
    provideHlmSidebarConfig({
      closeMobileSidebarOnMenuButtonClick: true,
      sidebarWidth: '16rem',
      sidebarWidthMobile: '18rem',
      sidebarWidthIcon: '3rem',
      sidebarCookieName: 'admin_sidebar_state',
      sidebarCookieMaxAge: 60 * 60 * 24 * 7,
      sidebarKeyboardShortcut: 'b',
      mobileBreakpoint: '768px',
    }),
    { provide: DASHBOARD_MENU_CONFIG, useValue: adminMenu },
    // Rendered in the dashboard header. The layout knows nothing about
    // notifications; it just renders whatever the app provides here.
    { provide: DASHBOARD_HEADER_ACTIONS, useValue: supabaseReady ? [NotificationBell] : [] },
  ],
};
