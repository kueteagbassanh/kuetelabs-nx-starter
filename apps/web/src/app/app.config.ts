import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { appRoutes } from './app.routes';
import {
  provideClientHydration,
  withEventReplay,
} from '@angular/platform-browser';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideSupabase } from '@kuetelabs/frontend/data-access/supabase';
import { provideAuthPages } from '@kuetelabs/frontend/features/auth/feature';
import { provideHlmSidebarConfig } from '@kuetelabs/frontend/ui/components/sidebar';
import { environment } from '../environments/environment';
import {
  DASHBOARD_MENU_CONFIG,
  type SidebarConfig,
} from '@kuetelabs/frontend/layouts/dashboard-layout';



const dashboardMenu: SidebarConfig = {
  groups: [
    {
      label: 'Application',
      items: [
        { label: 'Dashboard', url: '/dashboard', icon: 'lucideHouse', isActive: true },
        { label: 'Inbox', url: '/inbox', icon: 'lucideInbox', badge: '12' },
        { label: 'Calendar', url: '/calendar', icon: 'lucideCalendar' },
        { label: 'Search', url: '/search', icon: 'lucideSearch' },
      ],
    },
    {
      label: 'Projects',
      action: {
        icon: 'lucidePlus',
        label: 'Add Project',
        dropdownItems: [
          { label: 'New Project', action: 'project:create' },
          { label: 'Import from GitHub', action: 'project:import' },
        ],
      },
      items: [
        {
          label: 'Design Engineering',
          url: '/projects/design',
          icon: 'lucideFrame',
          action: {
            icon: 'lucideEllipsis',
            label: 'More',
            dropdownItems: [
              { label: 'Edit Project', action: 'project:edit:design' },
              { label: 'Archive', action: 'project:archive:design' },
              { label: 'Delete Project', action: 'project:delete:design' },
            ],
          },
        },
        {
          label: 'Sales & Marketing',
          url: '/projects/sales',
          icon: 'lucideChartPie',
          badge: '3',
          action: {
            icon: 'lucideEllipsis',
            label: 'More',
            dropdownItems: [
              { label: 'Edit Project', action: 'project:edit:sales' },
              { label: 'Delete Project', action: 'project:delete:sales' },
            ],
          },
        },
        {
          label: 'Travel',
          url: '/projects/travel',
          icon: 'lucideMap',
        },
      ],
    },
    {
      label: 'Documentation',
      collapsible: true,
      defaultOpen: false,
      items: [
        {
          label: 'Getting Started',
          icon: 'lucideBookOpen',
          defaultOpen: true,
          children: [
            { label: 'Installation', url: '/docs/installation' },
            { label: 'Project Structure', url: '/docs/structure', isActive: true },
            { label: 'Configuration', url: '/docs/configuration' },
          ],
        },
        {
          label: 'API Reference',
          icon: 'lucideCode',
          defaultOpen: false,
          children: [
            { label: 'Components', url: '/docs/api/components' },
            { label: 'Services', url: '/docs/api/services' },
            { label: 'Directives', url: '/docs/api/directives' },
          ],
        },
      ],
    },
    {
      label: 'Settings',
      items: [
        {
          label: 'General',
          url: '/settings/general',
          icon: 'lucideSettings',
        },
        {
          label: 'Security',
          url: '/settings/security',
          icon: 'lucideShield',
          badge: '!',
        },
        {
          label: 'Notifications',
          url: '/settings/notifications',
          icon: 'lucideBell',
        },
      ],
    },
    {
      label: 'Help',
      collapsible: true,
      defaultOpen: true,
      items: [
        { label: 'Support', url: '/help/support', icon: 'lucideLifeBuoy' },
        { label: 'Feedback', url: '/help/feedback', icon: 'lucideSend' },
      ],
    },
  ],
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideClientHydration(withEventReplay()),
    provideBrowserGlobalErrorListeners(),
    provideRouter(appRoutes, withComponentInputBinding()),
    provideHttpClient(withFetch()),
    provideSupabase({ url: environment.supabaseUrl, anonKey: environment.supabaseAnonKey }),
    // Same pages as admin, different policy: the public app allows self-signup.
    provideAuthPages({
      appName: environment.appName,
      redirectAfterLogin: '/',
      signupEnabled: true,
      oauthProviders: [],
    }),
    provideHlmSidebarConfig({
      closeMobileSidebarOnMenuButtonClick: true,
      sidebarWidth: '16rem',
      sidebarWidthMobile: '18rem',
      sidebarWidthIcon: '3rem',
      sidebarCookieName: 'sidebar_state',
      sidebarCookieMaxAge: 60 * 60 * 24 * 7,
      sidebarKeyboardShortcut: 'b',
      mobileBreakpoint: '768px',
    }),
    // 🔥 Tell the layout engine to use this specific array for this app instance
    { provide: DASHBOARD_MENU_CONFIG, useValue: dashboardMenu },
  ],
};
