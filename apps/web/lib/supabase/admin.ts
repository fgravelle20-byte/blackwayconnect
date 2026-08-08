import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role client (server only). Untyped until `supabase gen types` is wired.
 * Do NOT pass an empty Database generic — it collapses row types to `never`.
 */
export function createAdminSupabaseClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing SUPABASE URL or SERVICE_ROLE_KEY");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const createAdminClient = createAdminSupabaseClient;
