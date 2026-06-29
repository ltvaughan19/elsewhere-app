import { TrustDisclaimer } from "@expat-atlas/ui";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 prose prose-navy">
      <h1 className="font-display text-4xl text-navy-950">Privacy Policy</h1>
      <p className="text-sm text-navy-800/70">Last updated: June 2026 · Draft for MVP</p>
      <div className="mt-8 space-y-4 text-navy-800/80">
        <p>
          Expat Atlas collects account information, planning preferences, and usage
          analytics to provide relocation planning tools. We do not store passport
          scans, government ID images, or sensitive legal documents in the MVP.
        </p>
        <p>
          You may request account deletion and data export. Contact details will be
          published before public launch.
        </p>
        <p>
          We use analytics (e.g. PostHog) to understand product usage. Affiliate and
          sponsored links are disclosed in the product.
        </p>
      </div>
      <TrustDisclaimer className="mt-8" />
    </div>
  );
}
