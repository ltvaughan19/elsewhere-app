import Link from "next/link";
import { TrustDisclaimer } from "@expat-atlas/ui";

export function MarketingStub({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-sm font-medium uppercase tracking-wide text-jungle-600">
        Elsewhere
      </p>
      <h1 className="mt-2 font-display text-4xl text-navy-950">{title}</h1>
      <p className="mt-4 text-lg text-navy-800/80">{description}</p>
      {children}
      <div className="mt-10 rounded-xl border border-sand-200 bg-sand-100 p-6">
        <p className="text-sm font-medium text-navy-900">Coming in Phase 1</p>
        <p className="mt-2 text-sm text-navy-800/70">
          This route is scaffolded. Full content ships in the next implementation
          pass.
        </p>
        <Link href="/" className="mt-4 inline-block text-sm text-jungle-600">
          ← Back to home
        </Link>
      </div>
      <TrustDisclaimer className="mt-8" />
    </div>
  );
}
