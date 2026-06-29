import { TrustDisclaimer, Badge } from "@expat-atlas/ui";

export default function TrustPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <Badge variant="official">Trust model</Badge>
      <h1 className="mt-4 font-display text-4xl text-navy-950">
        Source-backed, not guru-based
      </h1>
      <p className="mt-6 text-lg text-navy-800/80">
        Every important claim about visas, residency, property, or costs should
        trace to an official source, a last-verified date, and a confidence level.
      </p>
      <ul className="mt-8 space-y-4 text-navy-800/80">
        <li>
          <strong>Official source links</strong> — government, embassy, immigration
          authority where possible
        </li>
        <li>
          <strong>Last verified date</strong> — or clearly labeled &quot;needs
          verification&quot;
        </li>
        <li>
          <strong>Confidence badges</strong> — low / medium / high planning confidence
        </li>
        <li>
          <strong>Report outdated info</strong> — user reports queue for admin review
        </li>
        <li>
          <strong>No fake partners</strong> — verified partners only after manual review
        </li>
      </ul>
      <p className="mt-8 text-sm text-navy-800/70">
        See <code className="rounded bg-sand-100 px-1">SOURCE_VERIFICATION_SYSTEM.md</code>{" "}
        in the repo for the full technical model.
      </p>
      <TrustDisclaimer className="mt-8" />
    </div>
  );
}
