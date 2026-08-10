import { InjectionToken } from '@angular/core';

export interface SupabaseConfig {
  url: string;
  /** The anon key. Public by design — safety comes from RLS, not from hiding it. */
  anonKey: string;
}

export const SUPABASE_CONFIG = new InjectionToken<SupabaseConfig>('SUPABASE_CONFIG');

/**
 * Whether Supabase credentials are present.
 *
 * Lets an app skip mounting features that need a backend, so a freshly cloned
 * starter still runs before anyone pastes an anon key. Injecting SUPABASE_CLIENT
 * without configuration throws by design — this is how callers avoid doing so.
 */
export function isSupabaseConfigured(config: SupabaseConfig | null | undefined): boolean {
  return Boolean(config?.url && config?.anonKey);
}
