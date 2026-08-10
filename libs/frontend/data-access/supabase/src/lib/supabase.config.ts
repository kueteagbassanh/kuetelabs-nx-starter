import { InjectionToken } from '@angular/core';

export interface SupabaseConfig {
  url: string;
  /** The anon key. Public by design — safety comes from RLS, not from hiding it. */
  anonKey: string;
}

export const SUPABASE_CONFIG = new InjectionToken<SupabaseConfig>('SUPABASE_CONFIG');
