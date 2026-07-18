"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { connectLocalPlanIdentity, loadPlan, upsertCloudPlan } from "@/lib/plan-store";
import { createClient } from "@/lib/supabase/client";
import { setTrustedDevicePreference } from "@/lib/auth/trusted-device";
import { OAuthButtons } from "@/components/oauth-buttons";
import { TrustedDeviceControl } from "@/components/trusted-device-control";

export function SignupForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [hasLocalPlan, setHasLocalPlan] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(false);

  useEffect(() => {
    setHasLocalPlan(Boolean(loadPlan()?.onboardingCompleted));
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const cleaned = email.trim().toLowerCase();
    if (password.length < 12) {
      setError("Use at least 12 characters for your password.");
      return;
    }

    setError("");
    setNotice("");
    setBusy(true);
    try {
      const supabase = createClient();
      setTrustedDevicePreference(rememberDevice);
      const { data, error: signError } = await supabase.auth.signUp({
        email: cleaned,
        password,
        options: {
          data: { display_name: name.trim() || null },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/app/onboarding`,
        },
      });
      if (signError) {
        setError("Elsewhere could not create the account with those details. Review the fields and try again.");
        return;
      }

      const connectedPlan = connectLocalPlanIdentity(cleaned, name);
      if (data.session) {
        await upsertCloudPlan(connectedPlan);
        router.push("/app/onboarding");
        router.refresh();
        return;
      }
      setNotice("Your account was created. Check your inbox to confirm the email address, then continue to your plan.");
    } catch {
      setError("Elsewhere could not reach the account service. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl px-5 py-12 sm:px-6 sm:py-16 lg:grid-cols-[minmax(0,1fr)_25rem] lg:items-center lg:gap-20">
      <section className="hidden max-w-xl lg:block">
        <p className="elsewhere-eyebrow">A plan you can return to</p>
        <h2 className="mt-5 font-display text-5xl leading-[1.04] text-cream">
          Keep the decisions connected from first idea to arrival.
        </h2>
        <p className="mt-6 max-w-lg text-base leading-7 text-muted">
          An account connects your answers, country research, saved items, and preparation tasks across devices.
        </p>
        <p className="mt-10 border-l-2 border-accent-sand pl-5 text-sm leading-6 text-muted">
          Elsewhere separates planning estimates from reviewed country guidance and never presents itself as a government or professional adviser.
        </p>
      </section>

      <section aria-labelledby="signup-heading" className="w-full max-w-md justify-self-center lg:justify-self-end">
        <p className="elsewhere-eyebrow lg:hidden">A plan you can return to</p>
        <h1 id="signup-heading" className="mt-3 font-display text-5xl leading-none text-cream">Create your account</h1>
        <p className="mt-4 text-base leading-7 text-muted">Save your planning profile and continue on any device.</p>

        {hasLocalPlan ? (
          <p className="mt-5 border-l-2 border-accent-cool pl-4 text-sm leading-6 text-muted">
            A plan already exists on this device. Creating an account will let you keep it connected.{" "}
            <Link href="/app/dashboard" className="font-medium text-accent-cool hover:text-cream">View it first</Link>.
          </p>
        ) : null}

        {notice ? (
          <div role="status" className="mt-8 border-y border-sand-200 py-6">
            <p className="text-lg font-medium text-cream">Confirm your email</p>
            <p className="mt-2 text-sm leading-6 text-muted">{notice}</p>
            <Link href="/login" className="mt-4 inline-flex min-h-11 items-center text-sm font-medium text-accent-cool hover:text-cream">
              Continue to login <span aria-hidden="true" className="ml-2">&rarr;</span>
            </Link>
          </div>
        ) : (
          <>
            <TrustedDeviceControl checked={rememberDevice} onChange={setRememberDevice} />
            <OAuthButtons
              nextPath="/app/onboarding"
              rememberDevice={rememberDevice}
              onError={setError}
            />
            <form onSubmit={submit} className="mt-8">
            <div>
              <label htmlFor="name" className="text-sm font-medium text-cream">Name <span className="font-normal text-soft">(optional)</span></label>
              <input
                id="name"
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-2 min-h-12 w-full rounded-md border border-sand-300 bg-void-card px-4 text-cream"
              />
            </div>

            <div className="mt-5">
              <label htmlFor="email" className="text-sm font-medium text-cream">Email address</label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 min-h-12 w-full rounded-md border border-sand-300 bg-void-card px-4 text-cream"
              />
            </div>
            <div className="mt-5">
              <label htmlFor="password" className="text-sm font-medium text-cream">Password</label>
              <input
                id="password"
                type="password"
                required
                minLength={12}
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                aria-describedby="signup-password-guidance"
                className="mt-2 min-h-12 w-full rounded-md border border-sand-300 bg-void-card px-4 text-cream"
              />
              <p id="signup-password-guidance" className="mt-2 text-xs leading-5 text-soft">
                Use at least 12 characters. Password managers and pasted passwords are supported.
              </p>
            </div>

            {error ? <p role="alert" className="mt-4 border-l-2 border-danger pl-3 text-sm leading-6 text-danger">{error}</p> : null}

            <button
              type="submit"
              disabled={busy}
              className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-md bg-accent-sand px-5 text-sm font-medium text-accent-ink hover:bg-accent-sand-hover disabled:cursor-wait disabled:opacity-60"
            >
              {busy ? "Creating account…" : "Create account"}
            </button>
            </form>
          </>
        )}

        <p className="mt-6 text-sm text-muted">
          Already started?{" "}
          <Link href="/login" className="inline-flex min-h-11 items-center font-medium text-accent-cool hover:text-cream">Log in</Link>
        </p>
        <p className="mt-6 border-t border-sand-200 pt-5 text-xs leading-5 text-soft">
          By creating an account, you agree to the <Link href="/terms" className="text-accent-cool underline underline-offset-4">terms</Link> and acknowledge the <Link href="/privacy" className="text-accent-cool underline underline-offset-4">privacy policy</Link>.
          Your account stores planning work — it is not a government, immigration, or legal service.
        </p>
      </section>
    </div>
  );
}
