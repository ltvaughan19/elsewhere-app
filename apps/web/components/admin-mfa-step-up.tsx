"use client";

import { useRouter } from "next/navigation";
import type { MfaFactorSummary } from "@/lib/auth/mfa";
import { MfaChallengeForm } from "@/components/mfa-challenge-form";

export function AdminMfaStepUp({
  factors,
}: {
  factors: readonly MfaFactorSummary[];
}) {
  const router = useRouter();

  return (
    <section aria-labelledby="admin-mfa-step-up-heading" className="mb-6 rounded-2xl border border-warning/35 bg-warning/10 p-5">
      <p className="elsewhere-eyebrow">Security step-up</p>
      <h2 id="admin-mfa-step-up-heading" className="mt-1 font-display text-2xl text-cream">
        Verify before publishing
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        Your account has a verified authenticator, but this session is still AAL1. Enter a current code to reach AAL2. Review and publish gates remain unchanged.
      </p>
      <MfaChallengeForm
        factors={factors}
        onVerified={() => {
          router.refresh();
        }}
      />
    </section>
  );
}
