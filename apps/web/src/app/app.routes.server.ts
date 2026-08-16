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
    // Posts live in the database, so there is nothing to prerender at build time:
    // a build-time render would freeze the feed as it stood when the image was
    // built, and a new post would never appear. Server rendering keeps the HTML
    // complete for crawlers while staying current.
    //
    // The store holds an Angular pending task open around each query, which is what
    // makes this render wait for the rows instead of serializing an empty shell.
    // Both the exact path and the subtree: `blog/**` covers the posts, and without
    // the bare `blog` entry the index would fall through to the prerender rule below.
    path: 'blog',
    renderMode: RenderMode.Server,
  },
  {
    path: 'blog/**',
    renderMode: RenderMode.Server,
  },
  {
    // Behind authenticatedGuard, same trap as auth/**.
    path: 'dashboard/blog',
    renderMode: RenderMode.Client,
  },
  {
    path: 'dashboard/blog/**',
    renderMode: RenderMode.Client,
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
