"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { requestPasswordRecovery } from "@/lib/auth/password-recovery";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("error") === "invalid_recovery_session") {
      setError("That recovery link is invalid or has expired. Request a new link below.");
    }
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const supabase = createClient();
      const sentSuccessfully = await requestPasswordRecovery(
        supabase.auth,
        email,
        window.location.origin,
      );
      if (!sentSuccessfully) {
        setError("Elsewhere could not send the recovery email. Check the address and try again.");
        return;
      }
      setSent(true);
    } catch {
      setError("Elsewhere could not reach the account service. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto min-h-[calc(100vh-4rem)] max-w-md px-5 py-16 sm:px-6 sm:py-24">
      <p className="elsewhere-eyebrow">Account recovery</p>
      <h1 className="mt-3 font-display text-5xl leading-none text-cream">Reset your password</h1>
      {sent ? (
        <div role="status" className="mt-8 border-y border-sand-200 py-6">
          <p className="text-lg font-medium text-cream">Check your email</p>
          <p className="mt-2 text-sm leading-6 text-muted">
            If an Elsewhere account exists for {email}, the recovery link is on its way. The message may take a few minutes.
          </p>
          <Link href="/login" className="mt-5 inline-flex min-h-11 items-center text-sm font-medium text-accent-cool hover:text-cream">
            Return to login <span aria-hidden="true" className="ml-2">&rarr;</span>
          </Link>
        </div>
      ) : (
        <>
          <p className="mt-4 text-base leading-7 text-muted">
            Enter the email address for your account. We will send a secure link to choose a new password.
          </p>
          <form onSubmit={submit} className="mt-8">
            <label htmlFor="recovery-email" className="text-sm font-medium text-cream">Email address</label>
            <input
              id="recovery-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 min-h-12 w-full rounded-md border border-sand-300 bg-void-card px-4 text-cream"
            />
            {error ? <p role="alert" className="mt-4 border-l-2 border-danger pl-3 text-sm leading-6 text-danger">{error}</p> : null}
            <button
              type="submit"
              disabled={busy}
              className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-md bg-accent-sand px-5 text-sm font-medium text-accent-ink hover:bg-accent-sand-hover disabled:cursor-wait disabled:opacity-60"
            >
              {busy ? "Sending…" : "Send recovery link"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
