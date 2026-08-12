/**
 * Development environment. Values are literals, not `process.env` — this file is
 * bundled into the browser, where `process` does not exist. Per-deploy values come
 * from environment.prod.ts via `fileReplacements` in project.json.
 */
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  supabaseUrl: 'http://127.0.0.1:54321',
  /**
   * Paste the anon key printed by `npx supabase start`. Public by design — RLS is
   * what protects the data, not the secrecy of this key.
   */
  supabaseAnonKey: '',
};
