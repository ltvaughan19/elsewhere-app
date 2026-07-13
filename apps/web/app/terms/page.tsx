import { TrustDisclaimer } from "@expat-atlas/ui";

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-4xl text-navy-950">Terms of Use</h1>
      <p className="mt-2 text-sm text-navy-800/70">Last updated: June 2026 · Draft for MVP</p>
      <div className="mt-8 space-y-4 text-navy-800/80">
        <p>
          Elsewhere provides general planning information only. We do not provide
          legal, immigration, tax, insurance, medical, investment, or real estate
          advice.
        </p>
        <p>
          You are responsible for verifying all decisions with official government
          sources and licensed professionals before acting.
        </p>
        <p>
          Planning estimates, country scores, and visa overviews may be outdated or
          incomplete. Use the report-outdated feature when you find errors.
        </p>
      </div>
      <TrustDisclaimer className="mt-8" />
    </div>
  );
}
