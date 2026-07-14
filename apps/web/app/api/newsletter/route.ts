import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type NewsletterBody = {
  email?: string;
  source?: string;
  intent?: "free_brief" | "waitlist_legacy";
};

function normalizeEmail(raw: unknown): string {
  return String(raw ?? "")
    .trim()
    .toLowerCase();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Corridor Brief opt-in.
 * Pipeline:
 * 1. Supabase email_subscribers (preferred when service role exists)
 * 2. NEWSLETTER_WEBHOOK / WAITLIST_WEBHOOK
 * 3. Resend Audience
 * 4. Accept without provider (dev)
 */
export async function POST(request: Request) {
  let body: NewsletterBody = {};
  try {
    body = (await request.json()) as NewsletterBody;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const email = normalizeEmail(body.email);
  if (!isValidEmail(email)) {
    return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
  }

  const source = (body.source ?? "elsewhere-web").slice(0, 80);

  if (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const admin = createAdminClient();
      const { error } = await admin.from("email_subscribers").upsert(
        {
          email,
          source,
          free_brief: true,
          consent_at: new Date().toISOString(),
          unsubscribed_at: null,
        },
        { onConflict: "email" },
      );
      if (error) {
        console.error("[newsletter] supabase error", error.message);
        return NextResponse.json({ ok: false, error: "supabase_failed" }, { status: 502 });
      }
      return NextResponse.json({ ok: true, mode: "supabase" });
    } catch (err) {
      console.error("[newsletter] supabase exception", err);
      return NextResponse.json({ ok: false, error: "supabase_error" }, { status: 502 });
    }
  }

  const webhook =
    process.env.NEWSLETTER_WEBHOOK?.trim() ||
    process.env.WAITLIST_WEBHOOK?.trim();

  if (webhook) {
    try {
      const res = await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          source,
          intent: body.intent ?? "free_brief",
          product: "corridor_brief",
          at: new Date().toISOString(),
        }),
      });
      if (!res.ok) {
        return NextResponse.json({ ok: false, error: "webhook_failed" }, { status: 502 });
      }
      return NextResponse.json({ ok: true, mode: "webhook" });
    } catch {
      return NextResponse.json({ ok: false, error: "webhook_error" }, { status: 502 });
    }
  }

  const resendKey = process.env.RESEND_API_KEY?.trim();
  const audienceId = process.env.RESEND_AUDIENCE_ID?.trim();
  if (resendKey && audienceId) {
    try {
      const res = await fetch(`https://api.resend.com/audiences/${audienceId}/contacts`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, unsubscribed: false }),
      });
      if (!res.ok) {
        return NextResponse.json({ ok: false, error: "resend_failed" }, { status: 502 });
      }
      return NextResponse.json({ ok: true, mode: "resend_audience" });
    } catch {
      return NextResponse.json({ ok: false, error: "resend_error" }, { status: 502 });
    }
  }

  return NextResponse.json({ ok: true, mode: "accepted_no_provider" });
}
