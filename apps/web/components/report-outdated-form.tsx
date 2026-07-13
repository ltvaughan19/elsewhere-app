"use client";

import { useState } from "react";

export function ReportOutdatedForm({
  countrySlug,
  countryName,
}: {
  countrySlug: string;
  countryName: string;
}) {
  const [sent, setSent] = useState(false);

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSent(true);
  };

  if (sent) {
    return (
      <p className="mt-8 rounded-xl border border-jungle-600/30 bg-jungle-600/5 p-4 text-sm text-navy-900">
        Thank you — your report is queued for review (demo). We will not publish changes without source verification.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="mt-8 rounded-xl border border-sand-200 bg-sand-50 p-6">
      <h2 className="font-medium text-navy-950">Report outdated information</h2>
      <p className="mt-1 text-sm text-navy-800/70">
        For {countryName}. Include a link to an official source if possible.
      </p>
      <input type="hidden" name="countrySlug" value={countrySlug} />
      <textarea
        name="details"
        required
        rows={3}
        className="mt-4 w-full rounded-lg border border-sand-200 px-3 py-2 text-sm"
        placeholder="What seems outdated?"
      />
      <input
        type="email"
        name="email"
        placeholder="Email (optional)"
        className="mt-3 w-full rounded-lg border border-sand-200 px-3 py-2 text-sm"
      />
      <button
        type="submit"
        className="mt-4 rounded-full border border-navy-800/20 px-4 py-2 text-sm font-medium"
      >
        Submit report
      </button>
    </form>
  );
}
