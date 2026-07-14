"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { TrustDisclaimer } from "@expat-atlas/ui";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const supabase = createClient();
      const { error: signError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (signError) {
        setError(signError.message);
        return;
      }
      router.push("/app/dashboard");
      router.refresh();
    } catch {
      setError("Could not reach auth. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <h1 className="font-display text-4xl text-navy-950">Log in</h1>
      <p className="mt-4 text-navy-800/80">
        Same account for the app and Corridor Digest. Planning estimates only —
        not legal advice.
      </p>
      <form onSubmit={submit} className="mt-8 space-y-4">
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
            placeholder="you@example.com"
            className="mt-1 w-full rounded-xl border border-sand-200 px-4 py-3"
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
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-xl border border-sand-200 px-4 py-3"
          />
        </div>
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-jungle-600 py-3 font-medium text-white disabled:opacity-60"
        >
          {busy ? "Signing in…" : "Log in"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm">
        <Link href="/signup" className="text-jungle-600">
          Create account
        </Link>
      </p>
      <TrustDisclaimer className="mt-8" />
    </div>
  );
}
