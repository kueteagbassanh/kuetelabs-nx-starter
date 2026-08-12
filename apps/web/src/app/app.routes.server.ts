import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    // Auth pages must never be prerendered: the markup would be a logged-out
    // shell served to everyone, and the Supabase client keeps its session in
    // localStorage, which does not exist on the server.
    path: 'auth/**',
    renderMode: RenderMode.Client,
  },
  {
    // Behind authenticatedGuard, so prerendering it would bake a logged-out render
    // and serve it to everyone — the same trap as auth/**. The /error/* screens
    // stay prerendered on purpose: they need no session.
    path: 'dashboard/forbidden',
    renderMode: RenderMode.Client,
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
