"use client";

import { useState, type FormEvent } from "react";

const NEWSLETTER_KEY = "elsewhere-newsletter-emails";

type NewsletterFormProps = {
  /** Extra source tag for analytics / ESP */
  source?: string;
  className?: string;
};

/**
 * Free Corridor Brief opt-in → POST /api/newsletter.
 * Paid full digest is Explorer+ (see docs/plans/EMAIL_AND_SUPABASE.md).
 */
export function NewsletterForm({
  source = "product-hub",
  className,
}: NewsletterFormProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "invalid">(
    "idle",
  );

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setStatus("invalid");
      return;
    }
    setStatus("saving");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmed,
          source,
          intent: "free_brief",
        }),
      });
      if (!res.ok) {
        setStatus("invalid");
        return;
      }
      try {
        const raw = localStorage.getItem(NEWSLETTER_KEY);
        const list: string[] = raw ? (JSON.parse(raw) as string[]) : [];
        if (!list.includes(trimmed)) list.push(trimmed);
        localStorage.setItem(NEWSLETTER_KEY, JSON.stringify(list));
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
    <form
      onSubmit={onSubmit}
      className={className ?? "mx-auto mt-8 max-w-md text-left"}
    >
      <label htmlFor="newsletter-email" className="sr-only">
        Email
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id="newsletter-email"
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
          {status === "saving" ? "Saving…" : "Join Corridor Brief"}
        </button>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-navy-800">
        {status === "saved"
          ? "You’re subscribed. Check your inbox for a welcome from Elsewhere."
          : status === "invalid"
            ? "Enter a valid email and try again."
            : "Free updates when sourced corridor notes change. Fuller digest with Explorer."}
      </p>
    </form>
  );
}
