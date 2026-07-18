import { safeNextPath } from "./safe-next-path";

/**
 * Supported social login methods (product lock updated 2026-07-17):
 * Email/password + Google + Apple + Facebook (Meta ads funnel).
 * Do not add X / LinkedIn / GitHub / TikTok / Discord.
 * Buttons remain runtime-gated by Supabase Auth provider settings.
 * @see docs/plans/ONE_SITE_ONE_AUTH.md
 */
export type ElsewhereOAuthProvider = "google" | "apple" | "facebook";

const PROVIDER_ORDER = ["google", "apple", "facebook"] as const;

export const OAUTH_PROVIDER_LABELS: Record<ElsewhereOAuthProvider, string> = {
  google: "Google",
  apple: "Apple",
  facebook: "Facebook",
};

export function enabledOAuthProviders(
  external: Record<string, boolean> | null | undefined,
): ElsewhereOAuthProvider[] {
  if (!external) return [];
  return PROVIDER_ORDER.filter((provider) => external[provider] === true);
}

export function oauthCallbackUrl(origin: string, nextPath: string | null) {
  const callback = new URL("/auth/callback", origin);
  callback.searchParams.set("next", safeNextPath(nextPath));
  return callback.toString();
}
