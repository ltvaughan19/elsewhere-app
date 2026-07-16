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

async function addToResendAudience(email: string): Promise<"ok" | "skip" | "fail"> {
  const resendKey = process.env.RESEND_API_KEY?.trim();
  const audienceId = process.env.RESEND_AUDIENCE_ID?.trim();
  if (!resendKey || !audienceId) return "skip";

  try {
    const res = await fetch(`https://api.resend.com/audiences/${audienceId}/contacts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, unsubscribed: false }),
    });
    // 409 = already exists — treat as success
    if (res.ok || res.status === 409) return "ok";
    console.error("[newsletter] resend audience", res.status, await res.text().catch(() => ""));
    return "fail";
  } catch (err) {
    console.error("[newsletter] resend audience exception", err);
    return "fail";
  }
}

async function sendWelcomeEmail(email: string): Promise<"ok" | "skip" | "fail"> {
  const resendKey = process.env.RESEND_API_KEY?.trim();
  const from =
    process.env.RESEND_FROM_EMAIL?.trim() || "Elsewhere <hello@elsewhereplan.com>";
  if (!resendKey) return "skip";

  const { corridorBriefWelcomeEmail } = await import(
    "@/lib/email/corridor-brief-welcome"
  );
  const { subject, text, html } = corridorBriefWelcomeEmail();

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [email],
        subject,
        text,
        html,
      }),
    });
    if (!res.ok) {
      console.error("[newsletter] welcome send", res.status, await res.text().catch(() => ""));
      return "fail";
    }
    return "ok";
  } catch (err) {
    console.error("[newsletter] welcome exception", err);
    return "fail";
  }
}

/**
 * Corridor Brief opt-in.
 * Always tries Supabase consent log + Resend audience + welcome email when configured.
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
  const modes: string[] = [];

  if (
    (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY) &&
    process.env.NEXT_PUBLIC_SUPABASE_URL
  ) {
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
      modes.push("supabase");
    } catch (err) {
      console.error("[newsletter] supabase exception", err);
      return NextResponse.json({ ok: false, error: "supabase_error" }, { status: 502 });
    }
  }

  const audience = await addToResendAudience(email);
  if (audience === "ok") modes.push("resend_audience");
  if (audience === "fail") {
    return NextResponse.json({ ok: false, error: "resend_audience_failed", modes }, { status: 502 });
  }

  const welcome = await sendWelcomeEmail(email);
  if (welcome === "ok") modes.push("welcome_email");
  // Welcome failure is soft if we already stored consent
  if (welcome === "fail" && modes.length === 0) {
    return NextResponse.json({ ok: false, error: "welcome_failed" }, { status: 502 });
  }

  const webhook =
    process.env.NEWSLETTER_WEBHOOK?.trim() ||
    process.env.WAITLIST_WEBHOOK?.trim();
  if (webhook) {
    try {
      await fetch(webhook, {
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
      modes.push("webhook");
    } catch {
      /* non-blocking */
    }
  }

  if (modes.length === 0) {
    return NextResponse.json({ ok: true, mode: "accepted_no_provider" });
  }

  return NextResponse.json({ ok: true, modes });
}
