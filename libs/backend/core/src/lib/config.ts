import { z } from 'zod';

/**
 * Server configuration. Validated at boot so a missing key fails immediately and
 * loudly, rather than at the first request that needs it.
 */
export const serverConfigSchema = z.object({
  SUPABASE_URL: z.url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  /** Bypasses RLS. Server-only — never expose to any frontend or shared lib. */
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  PORT: z.coerce.number().int().default(3000),
});

export type ServerConfig = z.infer<typeof serverConfigSchema>;

export function loadServerConfig(env: NodeJS.ProcessEnv = process.env): ServerConfig {
  const result = serverConfigSchema.safeParse(env);
  if (!result.success) {
    const missing = result.error.issues.map((issue) => issue.path.join('.')).join(', ');
    throw new Error(`Invalid server configuration: ${missing}. See .env.example.`);
  }
  return result.data;
}
