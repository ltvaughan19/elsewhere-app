import { createClient } from "@supabase/supabase-js";
import "server-only";
import type { Database } from "./database.types";
import { getSupabaseUrl } from "./config";

/** Service-role client for trusted server routes only (newsletter insert, admin). */
export function createAdminClient() {
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error("Missing SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient<Database>(getSupabaseUrl(), key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
