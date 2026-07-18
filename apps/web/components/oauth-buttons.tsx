"use client";

import { useEffect, useState } from "react";
import {
  enabledOAuthProviders,
  OAUTH_PROVIDER_LABELS,
  oauthCallbackUrl,
  type ElsewhereOAuthProvider,
} from "@/lib/auth/oauth";
import { setTrustedDevicePreference } from "@/lib/auth/trusted-device";
import { createClient } from "@/lib/supabase/client";
import {
  getSupabasePublishableKey,
  getSupabaseUrl,
  isSupabaseConfigured,
} from "@/lib/supabase/config";

interface OAuthButtonsProps {
  nextPath: string | null;
  rememberDevice: boolean;
  onError: (message: string) => void;
}

export function OAuthButtons({ nextPath, rememberDevice, onError }: OAuthButtonsProps) {
  const [providers, setProviders] = useState<ElsewhereOAuthProvider[]>([]);
  const [busy, setBusy] = useState<ElsewhereOAuthProvider | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const controller = new AbortController();
    void fetch(`${getSupabaseUrl()}/auth/v1/settings`, {
      headers: { apikey: getSupabasePublishableKey() },
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((settings: { external?: Record<string, boolean> } | null) => {
        if (!settings?.external) return;
        setProviders(enabledOAuthProviders(settings.external));
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  if (providers.length === 0) return null;

  const continueWith = async (provider: ElsewhereOAuthProvider) => {
    setBusy(provider);
    onError("");
    setTrustedDevicePreference(rememberDevice);
    const { error } = await createClient().auth.signInWithOAuth({
      provider,
      options: { redirectTo: oauthCallbackUrl(window.location.origin, nextPath) },
    });
    if (error) {
      setBusy(null);
      const label = OAUTH_PROVIDER_LABELS[provider];
      onError(`Elsewhere could not start ${label} sign-in. Try again or use email.`);
    }
  };

  return (
    <div className="mt-8">
      <div className="grid gap-3">
        {providers.map((provider) => {
          const label = OAUTH_PROVIDER_LABELS[provider];
          const mark =
            provider === "google" ? "G" : provider === "apple" ? "A" : "f";
          return (
            <button
              key={provider}
              type="button"
              disabled={busy !== null}
              onClick={() => void continueWith(provider)}
              className="inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-md border border-sand-300 bg-void-card px-5 text-sm font-medium text-cream transition-colors hover:bg-void-elevated disabled:cursor-wait disabled:opacity-60"
            >
              <span
                aria-hidden="true"
                className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-sand-300 font-medium"
              >
                {mark}
              </span>
              {busy === provider ? `Connecting to ${label}…` : `Continue with ${label}`}
            </button>
          );
        })}
      </div>
      <div
        className="my-6 flex items-center gap-3 text-xs uppercase tracking-[0.16em] text-soft"
        aria-hidden="true"
      >
        <span className="h-px flex-1 bg-sand-200" />
        <span>or use email</span>
        <span className="h-px flex-1 bg-sand-200" />
      </div>
    </div>
  );
}
