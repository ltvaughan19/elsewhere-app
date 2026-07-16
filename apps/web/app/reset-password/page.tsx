"use client";

import Link from "next/link";
import { useState } from "react";
import { updateRecoveredPassword } from "@/lib/auth/password-recovery";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (password.length < 12) {
      setError("Use at least 12 characters for your new password.");
      return;
    }
    if (password !== confirmation) {
      setError("The passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      const supabase = createClient();
      const updated = await updateRecoveredPassword(supabase.auth, password);
      if (!updated) {
        setError("This recovery link is invalid or has expired. Request a new one and try again.");
        return;
      }
      setComplete(true);
    } catch {
      setError("Elsewhere could not reach the account service. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto min-h-[calc(100vh-4rem)] max-w-md px-5 py-16 sm:px-6 sm:py-24">
      <p className="elsewhere-eyebrow">Account recovery</p>
      <h1 className="mt-3 font-display text-5xl leading-none text-cream">Choose a new password</h1>
      {complete ? (
        <div role="status" className="mt-8 border-y border-sand-200 py-6">
          <p className="text-lg font-medium text-cream">Your password has been updated</p>
          <Link href="/app/dashboard" className="mt-5 inline-flex min-h-11 items-center text-sm font-medium text-accent-cool hover:text-cream">
            Continue to your plan <span aria-hidden="true" className="ml-2">&rarr;</span>
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-8">
          <label htmlFor="new-password" className="text-sm font-medium text-cream">New password</label>
          <input
            id="new-password"
            type="password"
            required
            minLength={12}
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-describedby="password-guidance"
            className="mt-2 min-h-12 w-full rounded-md border border-sand-300 bg-void-card px-4 text-cream"
          />
          <p id="password-guidance" className="mt-2 text-xs leading-5 text-soft">Use at least 12 characters. Password managers and pasted passwords are supported.</p>

          <label htmlFor="confirm-password" className="mt-5 block text-sm font-medium text-cream">Confirm new password</label>
          <input
            id="confirm-password"
            type="password"
            required
            minLength={12}
            autoComplete="new-password"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            className="mt-2 min-h-12 w-full rounded-md border border-sand-300 bg-void-card px-4 text-cream"
          />
          {error ? <p role="alert" className="mt-4 border-l-2 border-danger pl-3 text-sm leading-6 text-danger">{error}</p> : null}
          <button
            type="submit"
            disabled={busy}
            className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-md bg-accent-sand px-5 text-sm font-medium text-accent-ink hover:bg-accent-sand-hover disabled:cursor-wait disabled:opacity-60"
          >
            {busy ? "Updating…" : "Update password"}
          </button>
        </form>
      )}
    </div>
  );
}
