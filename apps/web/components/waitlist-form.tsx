"use client";

import { useState, type FormEvent } from "react";

const WAITLIST_KEY = "elsewhere-waitlist-emails";

/**
 * Local waitlist capture until YOU provide an ESP webhook.
 * No network call yet — labeled honestly.
 */
export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "saved" | "invalid">("idle");

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed.includes("@") || !trimmed.includes(".")) {
      setStatus("invalid");
      return;
    }
    try {
      const raw = localStorage.getItem(WAITLIST_KEY);
      const list: string[] = raw ? (JSON.parse(raw) as string[]) : [];
      if (!list.includes(trimmed)) list.push(trimmed);
      localStorage.setItem(WAITLIST_KEY, JSON.stringify(list));
      setStatus("saved");
      setEmail("");
    } catch {
      setStatus("invalid");
    }
  };

  return (
    <form onSubmit={onSubmit} className="mx-auto mt-8 max-w-md text-left">
      <label htmlFor="waitlist-email" className="sr-only">
        Email
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id="waitlist-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@email.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setStatus("idle");
          }}
          className="flex-1 rounded-md border border-sand-200 bg-void-card px-4 py-3 text-sm text-cream placeholder:text-navy-800"
          required
        />
        <button
          type="submit"
          className="rounded-md bg-accent-sand px-5 py-3 text-sm font-medium text-accent-ink hover:bg-accent-sand-hover"
        >
          Join the waitlist
        </button>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-navy-800">
        {status === "saved"
          ? "Saved on this device for now. Email delivery connects when the waitlist webhook is ready."
          : status === "invalid"
            ? "Enter a valid email."
            : "Demo capture only until email provider is connected — no spam."}
      </p>
    </form>
  );
}
