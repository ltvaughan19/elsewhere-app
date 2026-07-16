import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./database.types";
import { getSupabasePublishableKey, getSupabaseUrl } from "./config";
import { applyTrustedDeviceLifetime, TRUSTED_DEVICE_COOKIE } from "@/lib/auth/trusted-device";

export async function createClient() {
  const cookieStore = await cookies();
  const trustedDevice = cookieStore.get(TRUSTED_DEVICE_COOKIE)?.value;

  return createServerClient<Database>(
    getSupabaseUrl(),
    getSupabasePublishableKey(),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(
                name,
                value,
                applyTrustedDeviceLifetime(options, trustedDevice),
              ),
            );
          } catch {
            // Server Components cannot write cookies; middleware refreshes them.
          }
        },
      },
    },
  );
}
