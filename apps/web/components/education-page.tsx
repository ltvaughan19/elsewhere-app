import Link from "next/link";
import { TrustDisclaimer } from "@expat-atlas/ui";

export function EducationPage({
  title,
  intro,
  sections,
}: {
  title: string;
  intro: string;
  sections: { heading: string; body: string }[];
}) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-sm font-medium uppercase tracking-wide text-jungle-600">
        Elsewhere
      </p>
      <h1 className="mt-2 font-display text-4xl text-navy-950">{title}</h1>
      <p className="mt-4 text-lg text-navy-800/80">{intro}</p>
      <div className="mt-10 space-y-8">
        {sections.map((s) => (
          <section key={s.heading}>
            <h2 className="font-display text-2xl text-navy-950">{s.heading}</h2>
            <p className="mt-3 text-navy-800/80">{s.body}</p>
          </section>
        ))}
      </div>
      <div className="mt-10 rounded-xl border border-sand-200 bg-sand-100 p-6">
        <p className="text-sm font-medium text-navy-900">What to do next</p>
        <p className="mt-2 text-sm text-navy-800/70">
          This is education only — not a booking or legal service.{" "}
          <Link href="/signup" className="text-jungle-600 underline">
            Build your plan
          </Link>{" "}
          to track next steps in your dashboard.
        </p>
      </div>
      <TrustDisclaimer className="mt-8" />
    </div>
  );
}
