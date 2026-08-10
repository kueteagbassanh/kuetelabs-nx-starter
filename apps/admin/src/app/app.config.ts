import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideSupabase } from '@kuetelabs/frontend/data-access/supabase';
import { USER_ADMIN_API_URL } from '@kuetelabs/frontend/features/user-management/data-access';
import { environment } from '../environments/environment';
import { provideIcons } from '@ng-icons/core';
import {
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
  DASHBOARD_MENU_CONFIG,
  type SidebarConfig,
} from '@kuetelabs/frontend/layouts/dashboard-layout';
import { appRoutes } from './app.routes';

/**
 * Admin navigation. The dashboard layout is shared with `web`; only this config
 * differs — which is the point of DASHBOARD_MENU_CONFIG being an injection token.
 */
const adminMenu: SidebarConfig = {
  groups: [
    {
      label: 'Operations',
      items: [
        { label: 'Overview', url: '/', icon: 'lucideGauge', isActive: true },
        { label: 'Users', url: '/users', icon: 'lucideUsers', badge: '1.2k' },
        { label: 'Roles', url: '/roles', icon: 'lucideShieldCheck' },
        { label: 'Audit log', url: '/audit', icon: 'lucideScrollText' },
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
    provideSupabase({ url: environment.supabaseUrl, anonKey: environment.supabaseAnonKey }),
    { provide: USER_ADMIN_API_URL, useValue: environment.apiUrl },
    // Icons provided here merge with the layout's own set, so each app brings
    // the icons its navigation needs without touching the shared layout lib.
    provideIcons({
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
  ],
};
