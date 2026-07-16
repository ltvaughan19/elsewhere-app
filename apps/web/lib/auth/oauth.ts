import { safeNextPath } from "./safe-next-path";

export type ElsewhereOAuthProvider = "google" | "apple";

export function enabledOAuthProviders(
  external: Record<string, boolean> | null | undefined,
): ElsewhereOAuthProvider[] {
  if (!external) return [];
  return (["google", "apple"] as const).filter(
    (provider) => external[provider] === true,
  );
}

export function oauthCallbackUrl(origin: string, nextPath: string | null) {
  const callback = new URL("/auth/callback", origin);
  callback.searchParams.set("next", safeNextPath(nextPath));
  return callback.toString();
}
