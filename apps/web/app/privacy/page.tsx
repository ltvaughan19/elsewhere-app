import { TrustDisclaimer } from "@expat-atlas/ui";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 prose prose-navy">
      <h1 className="font-display text-4xl text-navy-950">Privacy Policy</h1>
      <p className="text-sm text-navy-800/70">Last updated: July 2026 · Draft for MVP</p>
      <div className="mt-8 space-y-4 text-navy-800/80">
        <p>
          Elsewhere (“we”) collects account information, planning preferences, and
          usage analytics to provide relocation planning tools. We do not store
          passport scans, government ID images, or sensitive legal documents in the
          MVP.
        </p>
        <p>
          <strong>Email / Corridor Brief.</strong> If you opt in to the Corridor Brief
          or related product emails, we store your email, opt-in time, and source
          (for example marketing home or product hub). We use this to send rare,
          research-related updates when sourced corridor notes change, and
          transactional messages related to your account. You can unsubscribe by
          following the link in future list mailings or by emailing{" "}
          <a href="mailto:hello@elsewhereplan.com">hello@elsewhereplan.com</a>. Paid
          digest access may be gated to Explorer (or higher) subscribers when billing
          is live.
        </p>
        <p>
          Processors we may use include Supabase (auth/database), Vercel (hosting),
          and Resend (email delivery). Data is stored for the purpose of operating
          Elsewhere and delivering the services you requested.
        </p>
        <p>
          You may request account deletion and data export. Contact{" "}
          <a href="mailto:hello@elsewhereplan.com">hello@elsewhereplan.com</a>.
        </p>
        <p>
          We may use analytics (e.g. PostHog) to understand product usage. Affiliate
          and sponsored links are disclosed in the product.
        </p>
      </div>
      <TrustDisclaimer className="mt-8" />
    </div>
  );
}
