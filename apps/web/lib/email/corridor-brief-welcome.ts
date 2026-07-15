/** Branded Corridor Brief emails — HTML + plain text for Resend. */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://elsewhereplan.com";

export function corridorBriefWelcomeEmail() {
  const subject = "You’re on the Corridor Brief";

  const text = [
    "Elsewhere — Corridor Brief",
    "",
    "You’re in.",
    "",
    "We’ll email you when verified research notes change for our corridors",
    "(Philippines, Thailand, Mexico) — not a daily newsletter.",
    "",
    "Next step: take the Fit Quiz and get a clear research path.",
    `${APP_URL}/app/onboarding`,
    "",
    "This is general planning information only — not legal, immigration,",
    "tax, or financial advice. Verify with official sources before you act.",
    "",
    "Questions: hello@elsewhereplan.com",
    "Unsubscribe: reply with STOP, or use the link in future Brief mailings.",
    "",
    "— Elsewhere",
    APP_URL,
  ].join("\n");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#07090d;color:#f4f1ea;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#07090d;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#0e1218;border:1px solid rgba(244,241,234,0.12);border-radius:16px;overflow:hidden;">
          <tr>
            <td style="padding:28px 28px 12px;font-family:Georgia,'Times New Roman',serif;font-size:28px;letter-spacing:0.02em;color:#f4f1ea;">
              Elsewhere
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 8px;font-family:system-ui,-apple-system,Segoe UI,sans-serif;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#c8b48a;">
              Corridor Brief
            </td>
          </tr>
          <tr>
            <td style="height:1px;background:rgba(244,241,234,0.1);"></td>
          </tr>
          <tr>
            <td style="padding:28px 28px 8px;font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.25;color:#f4f1ea;">
              You’re in. We’ll write when it matters.
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 20px;font-family:system-ui,-apple-system,Segoe UI,sans-serif;font-size:16px;line-height:1.6;color:rgba(244,241,234,0.72);font-weight:300;">
              The Corridor Brief is a free, occasional update when sourced research notes change for Philippines, Thailand, or Mexico — so you don’t have to refresh forty tabs.
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 28px;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:#141922;border:1px solid rgba(244,241,234,0.1);border-radius:12px;">
                <tr>
                  <td style="padding:18px 20px;font-family:system-ui,-apple-system,Segoe UI,sans-serif;font-size:14px;line-height:1.55;color:rgba(244,241,234,0.78);">
                    <strong style="color:#f4f1ea;font-weight:500;">What you’ll get</strong><br />
                    Short, sourced notes — what changed, confidence level, and what to research next. Not legal advice. Not a hype drip.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:0 28px 32px;">
              <a href="${APP_URL}/app/onboarding" style="display:inline-block;background:#c8b48a;color:#12141a;text-decoration:none;font-family:system-ui,-apple-system,Segoe UI,sans-serif;font-size:15px;font-weight:600;padding:14px 28px;border-radius:999px;">
                Start Fit Quiz
              </a>
              <div style="height:12px;"></div>
              <a href="${APP_URL}" style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;font-size:13px;color:#7eb8c9;text-decoration:none;">
                Open Elsewhere
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 28px;font-family:system-ui,-apple-system,Segoe UI,sans-serif;font-size:12px;line-height:1.55;color:rgba(244,241,234,0.45);">
              General planning only — not legal, immigration, tax, insurance, medical, or investment advice. Verify with official sources and licensed professionals before you act.
              <br /><br />
              Questions: <a href="mailto:hello@elsewhereplan.com" style="color:#7eb8c9;">hello@elsewhereplan.com</a>
              · Unsubscribe: reply with STOP, or use the link in future Briefs.
            </td>
          </tr>
        </table>
        <p style="margin:20px 0 0;font-family:system-ui,-apple-system,Segoe UI,sans-serif;font-size:11px;color:rgba(244,241,234,0.35);">
          © Elsewhere · ${APP_URL.replace(/^https?:\/\//, "")}
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, text, html };
}
