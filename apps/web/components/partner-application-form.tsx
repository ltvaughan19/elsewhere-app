"use client";

import { useState } from "react";
import { TrustDisclaimer } from "@expat-atlas/ui";
import { partnerApplicationSchema } from "@expat-atlas/validation";

export function PartnerApplicationForm() {
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = partnerApplicationSchema.safeParse({
      businessName: fd.get("businessName"),
      contactName: fd.get("contactName"),
      email: fd.get("email"),
      phone: fd.get("phone") || undefined,
      website: fd.get("website") || "",
      countriesServed: String(fd.get("countriesServed"))
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      serviceCategory: fd.get("serviceCategory"),
      description: fd.get("description"),
      consentToVerification: fd.get("consent") === "on",
    });

    if (!parsed.success) {
      setStatus("error");
      setMessage(parsed.error.issues[0]?.message ?? "Check your form fields.");
      return;
    }

    setStatus("sent");
    setMessage(
      "Application received (demo). In production this queues to admin review — no partner is verified until manual approval.",
    );
    e.currentTarget.reset();
  };

  return (
    <form onSubmit={submit} className="mt-8 space-y-4">
      {[
        ["businessName", "Business name", "text"],
        ["contactName", "Contact name", "text"],
        ["email", "Email", "email"],
        ["phone", "Phone (optional)", "tel"],
        ["website", "Website (optional)", "url"],
        ["countriesServed", "Countries served (comma-separated)", "text"],
        ["serviceCategory", "Service category", "text"],
      ].map(([name, label, type]) => (
        <div key={name}>
          <label htmlFor={name} className="text-sm font-medium text-navy-900">
            {label}
          </label>
          <input
            id={name}
            name={name}
            type={type}
            required={name !== "phone" && name !== "website"}
            className="mt-1 w-full rounded-xl border border-sand-200 px-4 py-3"
          />
        </div>
      ))}
      <div>
        <label htmlFor="description" className="text-sm font-medium text-navy-900">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          required
          rows={4}
          className="mt-1 w-full rounded-xl border border-sand-200 px-4 py-3"
          placeholder="What services do you offer expats? (min 20 characters)"
        />
      </div>
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="consent" required className="mt-1" />
        <span>
          I consent to verification review and understand listings are not verified until approved.
        </span>
      </label>
      {message ? (
        <p className={status === "error" ? "text-sm text-red-700" : "text-sm text-jungle-700"}>
          {message}
        </p>
      ) : null}
      <button
        type="submit"
        className="rounded-full bg-jungle-600 px-6 py-3 text-sm font-medium text-white"
      >
        Submit application
      </button>
      <TrustDisclaimer />
    </form>
  );
}
