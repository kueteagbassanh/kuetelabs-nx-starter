import { Injectable, Logger } from '@nestjs/common';
import { type SupabaseClient, createClient } from '@supabase/supabase-js';
import type { Database } from '@kuetelabs/shared/database-types';
import { loadServerConfig } from '@kuetelabs/backend/core';

export type AdminSupabaseClient = SupabaseClient<Database>;

/**
 * The only place the service_role key is read.
 *
 * This client bypasses RLS entirely, so it is deliberately not exposed as a raw
 * client to feature modules — they call intent-named methods on services that wrap
 * it. A leaked admin client is an RLS bypass in whatever code borrows it.
 */
@Injectable()
export class SupabaseAdminService {
  private readonly logger = new Logger(SupabaseAdminService.name);
  private readonly config = loadServerConfig();

  private readonly client: AdminSupabaseClient = createClient<Database>(
    this.config.SUPABASE_URL,
    this.config.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  /**
   * Escape hatch for repositories inside libs/backend. Kept internal on purpose:
   * feature modules should depend on a service that expresses intent, not on this.
   */
  protected get admin(): AdminSupabaseClient {
    return this.client;
  }

  /** Runs a callback with the admin client, logging failures with context. */
  async withAdmin<T>(operation: string, fn: (client: AdminSupabaseClient) => Promise<T>): Promise<T> {
    try {
      return await fn(this.client);
    } catch (error) {
      this.logger.error(`Admin operation failed: ${operation}`, error as Error);
      throw error;
    }
  }
}
