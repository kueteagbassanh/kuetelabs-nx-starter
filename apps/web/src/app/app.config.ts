import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import {
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
} from '@angular/router';
import { appRoutes } from './app.routes';
import {
  provideClientHydration,
  withEventReplay,
} from '@angular/platform-browser';
import { provideHttpClient, withFetch } from '@angular/common/http';
import {
  AUTH_NAVIGATION,
  provideSupabase,
} from '@kuetelabs/frontend/data-access/supabase';
import { provideAuthPages } from '@kuetelabs/frontend/features/auth/feature';
import { provideErrorPages } from '@kuetelabs/frontend/layouts/error-layout';
import { provideHlmSidebarConfig } from '@kuetelabs/frontend/ui/components/sidebar';
import { environment } from '../environments/environment';
import {
  DASHBOARD_MENU_CONFIG,
  type SidebarConfig,
} from '@kuetelabs/frontend/layouts/dashboard-layout';
import {
  provideDocsLayout,
  type DocsNavConfig,
} from '@kuetelabs/frontend/layouts/docs-layout';
import { provideLandingLayout } from '@kuetelabs/frontend/layouts/landing-layout';
import { landingConfig } from './landing.config';

// Paths are absolute route paths: the sidebar hands them to routerLink and the
// pager matches them against the router URL.
const docsNavigation: DocsNavConfig = {
  sections: [
    {
      label: 'Getting started',
      items: [
        { label: 'Introduction', path: '/docs/introduction' },
        { label: 'Installation', path: '/docs/installation' },
      ],
    },
    {
      label: 'Reference',
      collapsible: true,
      items: [
        { label: 'Angular docs', path: 'https://angular.dev', external: true },
      ],
    },
  ],
};

const dashboardMenu: SidebarConfig = {
  groups: [
    {
      label: 'Application',
      items: [
        {
          label: 'Dashboard',
          url: '/dashboard',
          icon: 'lucideHouse',
          isActive: true,
        },
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
            {
              label: 'Project Structure',
              url: '/docs/structure',
              isActive: true,
            },
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
    // `anchorScrolling` is what makes the header's `/#features` style links work.
    provideRouter(
      appRoutes,
      withComponentInputBinding(),
      withInMemoryScrolling({
        anchorScrolling: 'enabled',
        scrollPositionRestoration: 'enabled',
      }),
    ),
    provideHttpClient(withFetch()),
    provideSupabase({
      url: environment.supabaseUrl,
      anonKey: environment.supabaseAnonKey,
    }),
    // Same pages as admin, different policy: the public app allows self-signup.
    provideAuthPages({
      appName: environment.appName,
      redirectAfterLogin: '/',
      signupEnabled: true,
      oauthProviders: [],
    }),
    // The dashboard shell is mounted at /dashboard here (admin keeps it at ''),
    // so /forbidden lives inside it — without this override permissionGuard would
    // redirect to /forbidden and fall through to the 404.
    {
      provide: AUTH_NAVIGATION,
      useValue: {
        loginPath: '/auth/login',
        forbiddenPath: '/dashboard/forbidden',
        afterLoginPath: '/',
      },
    },
    // Copy and destinations for every screen under /error, plus the app-level 404.
    provideErrorPages({
      appName: environment.appName,
      homePath: '/',
      loginPath: '/auth/login',
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
    // Same idea for the public shell: all marketing copy comes from this object.
    provideLandingLayout(landingConfig),
    // Returns an array of providers, so it is spread rather than pushed.
    ...provideDocsLayout({
      title: environment.appName,
      homePath: '/docs',
      repositoryUrl: 'https://github.com/kueteagbassanh/kuetelabs-nx-starter',
      editBaseUrl:
        'https://github.com/kueteagbassanh/kuetelabs-nx-starter/edit/main/apps/web/src/app/pages',
      editFileExtension: '.ts',
      navigation: docsNavigation,
    }),
  ],
};
