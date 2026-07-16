"use client";

import { useState } from "react";

export function ReportOutdatedForm({
  countrySlug,
  countryName,
}: {
  countrySlug: string;
  countryName: string;
}) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [errorMessage, setErrorMessage] = useState("");

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setState("sending");
    setErrorMessage("");

    const form = event.currentTarget;
    const values = new FormData(form);
    try {
      const response = await fetch("/api/reports/outdated", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          countrySlug,
          details: values.get("details"),
          email: values.get("email"),
          sourceUrl: values.get("sourceUrl"),
          website: values.get("website"),
          pageUrl: window.location.href,
        }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(payload?.error ?? "submit_failed");
      }
      setState("sent");
      form.reset();
    } catch (error) {
      setState("error");
      setErrorMessage(
        error instanceof Error && error.message === "rate_limited"
          ? "You have sent several reports recently. Please wait a few minutes."
          : "We could not save this report. Please try again.",
      );
    }
  };

  if (state === "sent") {
    return (
      <p
        className="mt-8 rounded-xl border border-jungle-600/30 bg-jungle-600/5 p-4 text-sm text-navy-900"
        role="status"
      >
        Thank you. Your report is in the editorial review queue. Nothing changes
        publicly until the evidence is checked and a new release is approved.
      </p>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="mt-8 rounded-xl border border-sand-200 bg-sand-50 p-6"
    >
      <h2 className="font-medium text-navy-950">Report outdated information</h2>
      <p className="mt-1 text-sm text-navy-800">
        For {countryName}. Include an official source link when possible.
      </p>
      <div className="sr-only" aria-hidden="true">
        <label htmlFor={`website-${countrySlug}`}>Website</label>
        <input id={`website-${countrySlug}`} name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <label htmlFor={`details-${countrySlug}`} className="sr-only">
        What seems outdated?
      </label>
      <textarea
        id={`details-${countrySlug}`}
        name="details"
        required
        minLength={10}
        maxLength={5000}
        rows={4}
        className="mt-4 w-full rounded-lg border border-sand-200 px-3 py-2 text-sm"
        placeholder="What seems outdated, and what did you find instead?"
      />
      <label htmlFor={`source-${countrySlug}`} className="sr-only">
        Suggested official source URL
      </label>
      <input
        id={`source-${countrySlug}`}
        type="url"
        name="sourceUrl"
        inputMode="url"
        placeholder="Official source link (optional)"
        className="mt-3 w-full rounded-lg border border-sand-200 px-3 py-2 text-sm"
      />
      <label htmlFor={`email-${countrySlug}`} className="sr-only">
        Email
      </label>
      <input
        id={`email-${countrySlug}`}
        type="email"
        name="email"
        autoComplete="email"
        placeholder="Email for a follow-up (optional)"
        className="mt-3 w-full rounded-lg border border-sand-200 px-3 py-2 text-sm"
      />
      {state === "error" ? (
        <p className="mt-3 text-sm text-red-700" role="alert">
          {errorMessage}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={state === "sending"}
        className="mt-4 min-h-11 rounded-full border border-navy-800/20 px-4 py-2 text-sm font-medium disabled:opacity-60"
      >
        {state === "sending" ? "Submitting…" : "Submit report"}
      </button>
    </form>
  );
}
