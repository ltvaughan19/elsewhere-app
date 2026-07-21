"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { Factor } from "@supabase/supabase-js";
import { MfaChallengeForm } from "@/components/mfa-challenge-form";
import {
  isValidTotpCode,
  normalizeTotpCode,
  totpQrDataUrl,
  verifiedTotpFactorSummaries,
} from "@/lib/auth/mfa";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type Enrollment = {
  factorId: string;
  qrCode: string;
  secret: string;
};

function formatFactorDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function AccountSecurity() {
  const router = useRouter();
  const [factors, setFactors] = useState<Factor[]>([]);
  const [currentLevel, setCurrentLevel] = useState<string | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [enrollmentCode, setEnrollmentCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadSecurity = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setError("Account security is unavailable until Supabase is configured.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const [factorResult, assuranceResult] = await Promise.all([
      supabase.auth.mfa.listFactors(),
      supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
    ]);
    if (factorResult.error || assuranceResult.error) {
      setError("Elsewhere could not load account security. Refresh and try again.");
      setLoading(false);
      return;
    }

    setFactors(factorResult.data.all);
    setCurrentLevel(assuranceResult.data.currentLevel);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadSecurity();
  }, [loadSecurity]);

  const startEnrollment = async () => {
    setError("");
    setNotice("");
    setBusy(true);
    try {
      const { data, error: enrollError } = await createClient().auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Elsewhere authenticator",
      });
      if (enrollError) throw enrollError;
      setEnrollment({
        factorId: data.id,
        qrCode: data.totp.qr_code,
        secret: data.totp.secret,
      });
      setEnrollmentCode("");
      await loadSecurity();
    } catch {
      setError("A new authenticator could not be started. Remove any abandoned setup and try again.");
    } finally {
      setBusy(false);
    }
  };

  const finishEnrollment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setNotice("");
    if (!enrollment || !isValidTotpCode(enrollmentCode)) {
      setError("Enter the current 6-digit code from the authenticator app.");
      return;
    }

    setBusy(true);
    try {
      const supabase = createClient();
      const challenge = await supabase.auth.mfa.challenge({
        factorId: enrollment.factorId,
      });
      if (challenge.error) throw challenge.error;
      const verification = await supabase.auth.mfa.verify({
        factorId: enrollment.factorId,
        challengeId: challenge.data.id,
        code: enrollmentCode,
      });
      if (verification.error) throw verification.error;

      setEnrollment(null);
      setEnrollmentCode("");
      setNotice("Authenticator verified. This session is now at AAL2.");
      await loadSecurity();
      router.refresh();
    } catch {
      setError("That code could not be verified. Wait for a fresh code and try again.");
    } finally {
      setBusy(false);
    }
  };

  const unenroll = async (factor: Factor) => {
    const verifiedNeedsStepUp = factor.status === "verified" && currentLevel !== "aal2";
    if (verifiedNeedsStepUp) {
      setError("Verify a current authenticator code before removing a verified factor.");
      return;
    }
    if (!window.confirm(`Remove ${factor.friendly_name || "this authenticator"}?`)) return;

    setError("");
    setNotice("");
    setBusy(true);
    try {
      const supabase = createClient();
      const { error: unenrollError } = await supabase.auth.mfa.unenroll({
        factorId: factor.id,
      });
      if (unenrollError) throw unenrollError;
      await supabase.auth.refreshSession();
      if (enrollment?.factorId === factor.id) setEnrollment(null);
      setNotice("Authenticator removed.");
      await loadSecurity();
      router.refresh();
    } catch {
      setError("That authenticator could not be removed. Verify your session and try again.");
    } finally {
      setBusy(false);
    }
  };

  const verifiedFactors = verifiedTotpFactorSummaries(factors);

  return (
    <section aria-labelledby="account-security-heading" className="mt-10 rounded-xl border border-sand-200 bg-white p-6 text-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-navy-800/60">Account security</p>
          <h2 id="account-security-heading" className="mt-1 font-display text-2xl text-navy-950">Authenticator app MFA</h2>
          <p className="mt-2 max-w-xl text-navy-800/70">
            Add a time-based one-time password to protect sensitive account and staff publishing actions.
          </p>
        </div>
        <span className={`w-fit rounded-full border px-3 py-1 text-xs font-medium ${currentLevel === "aal2" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
          {currentLevel === "aal2" ? "AAL2 verified" : "AAL1 session"}
        </span>
      </div>

      {error ? <p role="alert" className="mt-4 border-l-2 border-red-300 pl-3 text-red-700">{error}</p> : null}
      {notice ? <p role="status" className="mt-4 border-l-2 border-emerald-300 pl-3 text-emerald-700">{notice}</p> : null}

      <div className="mt-6">
        <h3 className="font-medium text-navy-950">Existing factors</h3>
        {loading ? (
          <p className="mt-3 text-navy-800/60">Loading account security...</p>
        ) : factors.length === 0 ? (
          <p className="mt-3 rounded-lg border border-dashed border-sand-300 px-4 py-5 text-navy-800/70">
            No authenticator factors are enrolled. Add one before attempting staff publication.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-sand-200 rounded-lg border border-sand-200">
            {factors.map((factor, index) => {
              const needsStepUp = factor.status === "verified" && currentLevel !== "aal2";
              return (
                <li key={factor.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-navy-950">{factor.friendly_name || `Authenticator ${index + 1}`}</p>
                    <p className="mt-1 text-xs text-navy-800/60">
                      {factor.factor_type.toUpperCase()} / {factor.status} / added {formatFactorDate(factor.created_at)}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={busy || needsStepUp}
                    onClick={() => void unenroll(factor)}
                    title={needsStepUp ? "Verify MFA before removing this factor" : undefined}
                    className="min-h-10 rounded-full border border-red-200 px-4 text-xs font-medium text-red-800 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    Remove
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {currentLevel === "aal1" && verifiedFactors.length > 0 ? (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <h3 className="font-medium text-navy-950">Verify this session</h3>
          <p className="mt-1 text-xs text-navy-800/70">Step up to AAL2 before removing verified factors or using staff publish actions.</p>
          <MfaChallengeForm factors={verifiedFactors} tone="light" onVerified={async () => {
            setNotice("Session verified at AAL2.");
            await loadSecurity();
            router.refresh();
          }} />
        </div>
      ) : null}

      {enrollment ? (
        <div className="mt-6 rounded-xl border border-sand-300 bg-sand-50 p-5">
          <h3 className="font-medium text-navy-950">Finish authenticator setup</h3>
          <p className="mt-2 text-navy-800/70">Scan the QR code, or enter the manual secret in your authenticator app. Then verify one current code.</p>
          <div className="mt-5 grid gap-5 sm:grid-cols-[220px_minmax(0,1fr)] sm:items-start">
            <Image src={totpQrDataUrl(enrollment.qrCode)} alt="QR code for the new Elsewhere authenticator factor" width={220} height={220} unoptimized className="rounded-lg border border-sand-200 bg-white" />
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-navy-800/60">Manual secret</p>
              <code className="mt-2 block break-all rounded-lg border border-sand-200 bg-white p-3 text-sm text-navy-950">{enrollment.secret}</code>
              <p className="mt-2 text-xs text-navy-800/60">Treat this secret like a password. Do not paste it into support messages.</p>
            </div>
          </div>
          <form onSubmit={finishEnrollment} className="mt-5">
            <label htmlFor="mfa-enrollment-code" className="font-medium text-navy-950">6-digit authenticator code</label>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row">
              <input id="mfa-enrollment-code" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={enrollmentCode} onChange={(event) => setEnrollmentCode(normalizeTotpCode(event.target.value))} className="min-h-12 flex-1 rounded-xl border border-sand-300 bg-white px-4 font-mono text-lg tracking-[0.3em] text-navy-950" />
              <button type="submit" disabled={busy} className="min-h-12 rounded-full bg-navy-950 px-5 font-medium text-white disabled:cursor-wait disabled:opacity-50">{busy ? "Verifying..." : "Verify authenticator"}</button>
            </div>
          </form>
        </div>
      ) : (
        <button type="button" disabled={busy || loading} onClick={() => void startEnrollment()} className="mt-6 min-h-11 rounded-full bg-navy-950 px-5 font-medium text-white disabled:cursor-wait disabled:opacity-50">
          {busy ? "Starting..." : "Add authenticator"}
        </button>
      )}
    </section>
  );
}
