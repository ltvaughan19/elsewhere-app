"use client";

import { useState } from "react";
import type { MfaFactorSummary } from "@/lib/auth/mfa";
import { isValidTotpCode, normalizeTotpCode } from "@/lib/auth/mfa";
import { createClient } from "@/lib/supabase/client";

type MfaChallengeFormProps = {
  factors: readonly MfaFactorSummary[];
  onVerified: () => void | Promise<void>;
  tone?: "light" | "dark";
};

const toneStyles = {
  light: {
    label: "text-navy-950",
    input: "border-sand-300 bg-white text-navy-950",
    help: "text-navy-800/70",
    error: "text-red-700",
    success: "text-emerald-700",
    button: "bg-navy-950 text-white hover:bg-navy-800",
  },
  dark: {
    label: "text-cream",
    input: "border-sand-300 bg-void-card text-cream",
    help: "text-soft",
    error: "text-danger",
    success: "text-success",
    button: "bg-accent-sand text-accent-ink hover:bg-accent-sand-hover",
  },
} as const;

export function MfaChallengeForm({
  factors,
  onVerified,
  tone = "dark",
}: MfaChallengeFormProps) {
  const styles = toneStyles[tone];
  const [factorId, setFactorId] = useState(factors[0]?.id ?? "");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  const verify = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (!factorId || !isValidTotpCode(code)) {
      setError("Enter the current 6-digit code from your authenticator app.");
      return;
    }

    setBusy(true);
    try {
      const supabase = createClient();
      const challenge = await supabase.auth.mfa.challenge({ factorId });
      if (challenge.error) throw challenge.error;
      const verification = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.data.id,
        code,
      });
      if (verification.error) throw verification.error;

      setCode("");
      setSuccess("Identity verified. This session is now ready for MFA-protected actions.");
      await onVerified();
    } catch {
      setError("That code could not be verified. Wait for a fresh code and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={verify} className="mt-4 space-y-4">
      {factors.length > 1 ? (
        <div>
          <label htmlFor="mfa-step-up-factor" className={`text-sm font-medium ${styles.label}`}>
            Authenticator
          </label>
          <select
            id="mfa-step-up-factor"
            value={factorId}
            onChange={(event) => setFactorId(event.target.value)}
            className={`mt-2 min-h-11 w-full rounded-xl border px-3 ${styles.input}`}
          >
            {factors.map((factor, index) => (
              <option key={factor.id} value={factor.id}>
                {factor.friendly_name || `Authenticator ${index + 1}`}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      <div>
        <label htmlFor="mfa-step-up-code" className={`text-sm font-medium ${styles.label}`}>
          6-digit authenticator code
        </label>
        <input
          id="mfa-step-up-code"
          name="totp_code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          maxLength={6}
          required
          value={code}
          onChange={(event) => setCode(normalizeTotpCode(event.target.value))}
          className={`mt-2 min-h-12 w-full rounded-xl border px-4 font-mono text-lg tracking-[0.3em] ${styles.input}`}
        />
        <p className={`mt-2 text-xs ${styles.help}`}>Codes rotate every 30 seconds.</p>
      </div>
      {error ? <p role="alert" className={`text-sm ${styles.error}`}>{error}</p> : null}
      {success ? <p role="status" className={`text-sm ${styles.success}`}>{success}</p> : null}
      <button type="submit" disabled={busy || factors.length === 0} className={`inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-medium disabled:cursor-wait disabled:opacity-50 ${styles.button}`}>
        {busy ? "Verifying..." : "Verify and continue"}
      </button>
    </form>
  );
}
