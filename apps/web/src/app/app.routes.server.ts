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
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
