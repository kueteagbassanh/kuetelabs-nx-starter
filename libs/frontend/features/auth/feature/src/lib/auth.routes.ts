import type { Routes } from '@angular/router';
import { supabaseConfiguredGuard } from '@kuetelabs/frontend/data-access/supabase';

/**
 * Auth screens, mounted by each app under its own path:
 *
 *   { path: 'auth', component: AuthContainer, children: authRoutes }
 *
 * AuthContainer comes from the layout lib, so the chrome stays a layout concern and
 * these pages stay a feature. Copy, redirect target, signup availability, and OAuth
 * providers come from AUTH_PAGES_CONFIG, which each app provides.
 */
export const authRoutes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  {
    path: 'setup',
    loadComponent: () => import('./pages/setup-page').then((m) => m.AuthSetupPage),
  },
  {
    path: '',
    // Every page below needs a Supabase client; without credentials the guard
    // diverts to /auth/setup rather than letting the injector throw.
    canActivateChild: [supabaseConfiguredGuard()],
    children: [
      {
        path: 'login',
        loadComponent: () => import('./pages/login-page').then((m) => m.LoginPage),
      },
      {
        path: 'signup',
        loadComponent: () => import('./pages/signup-page').then((m) => m.SignupPage),
      },
      {
        path: 'forgot-password',
        loadComponent: () =>
          import('./pages/forgot-password-page').then((m) => m.ForgotPasswordPage),
      },
      {
        path: 'reset-password',
        loadComponent: () => import('./pages/reset-password-page').then((m) => m.ResetPasswordPage),
      },
      {
        path: 'callback',
        loadComponent: () => import('./pages/callback-page').then((m) => m.CallbackPage),
      },
    ],
  },
];
