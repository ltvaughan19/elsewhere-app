import Link from "next/link";
import { TrustDisclaimer } from "@expat-atlas/ui";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-4xl text-navy-950">About Expat Atlas</h1>
      <p className="mt-6 text-lg text-navy-800/80">
        Expat Atlas is a guided relocation and long-stay planning system for people
        who want to live abroad but feel overwhelmed by visas, money, housing, and
        scattered research.
      </p>
      <p className="mt-4 text-navy-800/80">
        We are building the structure first: country comparison, readiness scoring,
        source-backed information, budget tools, and partner slots that only activate
        when providers are verified. We do not fake trust before it exists.
      </p>
      <p className="mt-4 text-navy-800/80">
        Our promise: <strong>Stop researching forever. Build a real plan to live abroad.</strong>
      </p>
      <Link href="/trust" className="mt-8 inline-block text-jungle-600">
        How we handle trust and sourcing →
      </Link>
      <TrustDisclaimer className="mt-8" />
    </div>
  );
}
