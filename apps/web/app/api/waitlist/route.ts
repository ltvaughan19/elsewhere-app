// Waitlist → optional ESP webhook (Formspree / Make / Resend ingest, etc.)
// Set WAITLIST_WEBHOOK on the server. Body: { "email": "..." }

import { NextResponse } from "next/server";

export async function POST(request: Request) {
  let email = "";
  try {
    const body = (await request.json()) as { email?: string };
    email = (body.email ?? "").trim().toLowerCase();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  if (!email.includes("@") || !email.includes(".")) {
    return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
  }

  const webhook = process.env.WAITLIST_WEBHOOK;
  if (webhook) {
    try {
      const res = await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "elsewhere-web" }),
      });
      if (!res.ok) {
        return NextResponse.json(
          { ok: false, error: "webhook_failed" },
          { status: 502 },
        );
      }
      return NextResponse.json({ ok: true, mode: "webhook" });
    } catch {
      return NextResponse.json(
        { ok: false, error: "webhook_error" },
        { status: 502 },
      );
    }
  }

  // No webhook yet — accept so UX works; client may also mirror to localStorage
  return NextResponse.json({ ok: true, mode: "accepted_no_webhook" });
}
