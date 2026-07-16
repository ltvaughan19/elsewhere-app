import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { shouldRedirectInvalidRecovery } from "@/lib/auth/password-recovery";
import type { Database } from "./database.types";
import { applyTrustedDeviceLifetime, TRUSTED_DEVICE_COOKIE } from "@/lib/auth/trusted-device";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return supabaseResponse;
  }
  const trustedDevice = request.cookies.get(TRUSTED_DEVICE_COOKIE)?.value;

  const supabase = createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(
            name,
            value,
            applyTrustedDeviceLifetime(options, trustedDevice),
          ),
        );
      },
    },
  });

  // Refresh session — do not use getSession() for auth checks.
  const { data: claimsData } = await supabase.auth.getClaims();

  // Password changes require the authenticated recovery session established by
  // the callback route. Do not expose a functional reset form without it.
  if (
    shouldRedirectInvalidRecovery(
      request.nextUrl.pathname,
      claimsData?.claims?.sub,
    )
  ) {
    const recoveryUrl = request.nextUrl.clone();
    recoveryUrl.pathname = "/forgot-password";
    recoveryUrl.searchParams.set("error", "invalid_recovery_session");
    return NextResponse.redirect(recoveryUrl);
  }

  return supabaseResponse;
}
