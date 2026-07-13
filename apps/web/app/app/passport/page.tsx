import { PassportChecklist } from "@/components/passport-checklist";

export default function AppPassportPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-3xl text-navy-950">Passport checklist</h1>
      <p className="mt-2 text-sm text-navy-800/70">
        Progress saved on this device.
      </p>
      <div className="mt-8">
        <PassportChecklist />
      </div>
    </div>
  );
}
