import Link from "next/link";
import { PartnerApplicationForm } from "@/components/partner-application-form";

export default function BecomePartnerPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-display text-4xl text-navy-950">Become a partner</h1>
      <p className="mt-4 text-navy-800/80">
        Apply to join the Elsewhere partner network. All applications are manually reviewed.
        No partner is shown as verified until approval.
      </p>
      <PartnerApplicationForm />
      <Link href="/partners" className="mt-6 inline-block text-sm text-jungle-600">
        View partner policy →
      </Link>
    </div>
  );
}
