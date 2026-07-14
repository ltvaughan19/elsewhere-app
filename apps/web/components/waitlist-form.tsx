"use client";

import { useState, type FormEvent } from "react";

const WAITLIST_KEY = "elsewhere-waitlist-emails";

/**
 * Waitlist capture → POST /api/waitlist (optional WAITLIST_WEBHOOK),
 * plus local mirror until email provider is connected.
 */
export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "invalid">(
    "idle",
  );

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed.includes("@") || !trimmed.includes(".")) {
      setStatus("invalid");
      return;
    }
    setStatus("saving");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      if (!res.ok) {
        setStatus("invalid");
        return;
      }
      try {
        const raw = localStorage.getItem(WAITLIST_KEY);
        const list: string[] = raw ? (JSON.parse(raw) as string[]) : [];
        if (!list.includes(trimmed)) list.push(trimmed);
        localStorage.setItem(WAITLIST_KEY, JSON.stringify(list));
      } catch {
        /* ignore */
      }
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
          disabled={status === "saving"}
        />
        <button
          type="submit"
          disabled={status === "saving"}
          className="rounded-md bg-accent-sand px-5 py-3 text-sm font-medium text-accent-ink hover:bg-accent-sand-hover disabled:opacity-60"
        >
          {status === "saving" ? "Saving…" : "Join the waitlist"}
        </button>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-navy-800">
        {status === "saved"
          ? "You’re on the list. We’ll only send milestones that matter."
          : status === "invalid"
            ? "Enter a valid email and try again."
            : "One list for landing + app. Set WAITLIST_WEBHOOK for email delivery."}
      </p>
    </form>
  );
}
