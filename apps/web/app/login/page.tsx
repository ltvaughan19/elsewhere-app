"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { safeNextPath } from "@/lib/auth/safe-next-path";
import { setTrustedDevicePreference } from "@/lib/auth/trusted-device";
import { OAuthButtons } from "@/components/oauth-buttons";
import { TrustedDeviceControl } from "@/components/trusted-device-control";
import { useAuthSession } from "@/components/auth-session-provider";

export default function LoginPage() {
  const router = useRouter();
  const { status } = useAuthSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(false);
  const [nextPath, setNextPath] = useState<string | null>(null);

  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    setNextPath(search.get("next"));
    if (search.get("error") === "auth") {
      setError("That sign-in or recovery link is invalid or has expired. Request a new link and try again.");
    }
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;
    const destination = safeNextPath(
      new URLSearchParams(window.location.search).get("next"),
    );
    // Avoid hammering /admin while a staff gate is resolving — one replace + refresh.
    const timer = window.setTimeout(() => {
      router.replace(destination);
      router.refresh();
    }, 150);
    return () => window.clearTimeout(timer);
  }, [router, status]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const supabase = createClient();
      setTrustedDevicePreference(rememberDevice);
      const { error: signError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (signError) {
        setError("That email and password combination was not recognized. Check both fields and try again.");
        return;
      }
      const destination = safeNextPath(
        nextPath,
      );
      router.push(destination);
      router.refresh();
    } catch {
      setError("Elsewhere could not reach the account service. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl px-5 py-12 sm:px-6 sm:py-16 lg:grid-cols-[minmax(0,1fr)_25rem] lg:items-center lg:gap-20">
      <section className="hidden max-w-xl lg:block">
        <p className="elsewhere-eyebrow">Your private workspace</p>
        <h2 className="mt-5 font-display text-5xl leading-[1.04] text-cream">
          Pick up the move without starting over.
        </h2>
        <p className="mt-6 max-w-lg text-base leading-7 text-muted">
          Your account keeps plan answers, saved countries, and preparation tasks connected across devices.
        </p>
        <dl className="mt-10 divide-y divide-sand-200 border-y border-sand-200 text-sm">
          <div className="grid grid-cols-[8rem_1fr] gap-6 py-4">
            <dt className="text-soft">Stored for you</dt>
            <dd className="text-muted">Your planning profile, progress, and saved research</dd>
          </div>
          <div className="grid grid-cols-[8rem_1fr] gap-6 py-4">
            <dt className="text-soft">Never assumed</dt>
            <dd className="text-muted">That a planning estimate is legal, tax, or immigration advice</dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="login-heading" className="w-full max-w-md justify-self-center lg:justify-self-end">
        <p className="elsewhere-eyebrow lg:hidden">Your private workspace</p>
        <h1 id="login-heading" className="mt-3 font-display text-5xl leading-none text-cream">Log in</h1>
        <p className="mt-4 text-base leading-7 text-muted">
          Continue your plan and saved country research. Your account stores planning
          work — it is not a government, immigration, or legal service.
        </p>

        <TrustedDeviceControl checked={rememberDevice} onChange={setRememberDevice} />

        <OAuthButtons
          nextPath={nextPath}
          rememberDevice={rememberDevice}
          onError={setError}
        />

        <form onSubmit={submit} className="mt-8" aria-describedby={error ? "login-error" : undefined}>
          <div>
            <label htmlFor="email" className="text-sm font-medium text-cream">Email address</label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="mt-2 min-h-12 w-full rounded-md border border-sand-300 bg-void-card px-4 text-cream placeholder:text-soft"
            />
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between gap-5">
              <label htmlFor="password" className="text-sm font-medium text-cream">Password</label>
              <Link href="/forgot-password" className="inline-flex min-h-11 items-center text-xs font-medium text-accent-cool hover:text-cream">
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 min-h-12 w-full rounded-md border border-sand-300 bg-void-card px-4 text-cream"
            />
          </div>

          {error ? (
            <p id="login-error" role="alert" className="mt-4 border-l-2 border-danger pl-3 text-sm leading-6 text-danger">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={busy}
            className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-md bg-accent-sand px-5 text-sm font-medium text-accent-ink transition-colors duration-150 hover:bg-accent-sand-hover disabled:cursor-wait disabled:opacity-60"
          >
            {busy ? "Signing in…" : "Log in"}
          </button>
        </form>

        <p className="mt-6 text-sm text-muted">
          New to Elsewhere?{" "}
          <Link href="/signup" className="inline-flex min-h-11 items-center font-medium text-accent-cool hover:text-cream">
            Create an account
          </Link>
        </p>
        <p className="mt-8 border-t border-sand-200 pt-5 text-xs leading-5 text-soft">
          Elsewhere does not sell your planning profile. Read the{" "}
          <Link href="/privacy" className="text-accent-cool underline underline-offset-4">privacy policy</Link>.
        </p>
      </section>
    </div>
  );
}
