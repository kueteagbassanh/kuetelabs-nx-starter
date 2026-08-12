import { type EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { SUPABASE_CONFIG, type SupabaseConfig } from './supabase.config';

/** Register in an app's `appConfig`: `provideSupabase({ url, anonKey })`. */
export function provideSupabase(config: SupabaseConfig): EnvironmentProviders {
  return makeEnvironmentProviders([{ provide: SUPABASE_CONFIG, useValue: config }]);
}
