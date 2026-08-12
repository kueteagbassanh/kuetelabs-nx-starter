import { InjectionToken, inject } from '@angular/core';
import { type SupabaseClient, createClient } from '@supabase/supabase-js';
import type { Database } from '@kuetelabs/shared/database-types';
import { SUPABASE_CONFIG } from './supabase.config';

export type AppSupabaseClient = SupabaseClient<Database>;

/**
 * The one place `createClient` is called. Feature libs inject this token and never
 * import @supabase/supabase-js, so swapping the client, adding retries, or faking it
 * in tests is a change to this file alone.
 */
export const SUPABASE_CLIENT = new InjectionToken<AppSupabaseClient>('SUPABASE_CLIENT', {
  providedIn: 'root',
  factory: () => {
    const config = inject(SUPABASE_CONFIG);
    if (!config.url || !config.anonKey) {
      throw new Error(
        'Supabase is not configured: set supabaseUrl / supabaseAnonKey in the app environment ' +
          '(run `npx supabase start` locally and paste the printed anon key).',
      );
    }
    return createClient<Database>(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  },
});

export function injectSupabaseClient(): AppSupabaseClient {
  return inject(SUPABASE_CLIENT);
}
