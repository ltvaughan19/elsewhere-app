import { PassportChecklist } from "@/components/passport-checklist";

export default function PassportChecklistPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-display text-4xl text-navy-950">First passport checklist</h1>
      <p className="mt-4 text-navy-800/80">
        A step-by-step path for first-time U.S. passport applicants. Track progress
        here — we do not store passport documents in this app.
      </p>
      <div className="mt-10">
        <PassportChecklist />
      </div>
    </div>
  );
}
