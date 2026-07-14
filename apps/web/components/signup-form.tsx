"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { TrustDisclaimer } from "@expat-atlas/ui";
import { createDemoAccount, loadPlan } from "@/lib/plan-store";
import { createClient } from "@/lib/supabase/client";

export function SignupForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = email.trim().toLowerCase();
    if (!cleaned.includes("@")) {
      setError("Enter a valid email.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      const supabase = createClient();
      const { data, error: signError } = await supabase.auth.signUp({
        email: cleaned,
        password,
        options: {
          data: { display_name: name.trim() || null },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/app/onboarding`,
        },
      });
      if (signError) {
        setError(signError.message);
        return;
      }
      // Keep local demo plan for Fit Quiz until cloud sync exists.
      createDemoAccount(cleaned, name);
      if (data.session) {
        router.push("/app/onboarding");
        router.refresh();
        return;
      }
      setError(
        "Account created. If email confirmation is on, check your inbox, then log in.",
      );
    } catch {
      setError("Could not reach auth. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  const existing = typeof window !== "undefined" ? loadPlan() : null;

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <p className="text-sm font-medium uppercase tracking-wide text-jungle-600">
        Elsewhere
      </p>
      <h1 className="mt-2 font-display text-4xl text-navy-950">Create your account</h1>
      <p className="mt-4 text-navy-800/80">
        One account for Fit Quiz, your plan, and Corridor Digest when you upgrade.
      </p>
      {existing?.onboardingCompleted ? (
        <p className="mt-4 text-sm">
          You already have a local plan on this device.{" "}
          <Link href="/app/dashboard" className="text-jungle-600 underline">
            Go to dashboard
          </Link>
        </p>
      ) : null}
      <form onSubmit={submit} className="mt-8 space-y-4">
        <div>
          <label htmlFor="name" className="text-sm font-medium text-navy-900">
            Display name
          </label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-xl border border-sand-200 px-4 py-3"
            placeholder="Alex"
          />
        </div>
        <div>
          <label htmlFor="email" className="text-sm font-medium text-navy-900">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-xl border border-sand-200 px-4 py-3"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label htmlFor="password" className="text-sm font-medium text-navy-900">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-xl border border-sand-200 px-4 py-3"
            placeholder="At least 8 characters"
          />
        </div>
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-jungle-600 py-3 font-medium text-white disabled:opacity-60"
        >
          {busy ? "Creating…" : "Continue to readiness quiz"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-navy-800/70">
        Already started?{" "}
        <Link href="/login" className="text-jungle-600">
          Log in
        </Link>
      </p>
      <TrustDisclaimer className="mt-8" />
    </div>
  );
}
