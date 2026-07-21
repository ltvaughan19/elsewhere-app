import { describe, expect, it } from "vitest";
import {
  isValidTotpCode,
  normalizeTotpCode,
  totpQrDataUrl,
  verifiedTotpFactorSummaries,
} from "./mfa";

describe("TOTP helpers", () => {
  it("normalizes pasted codes to six digits", () => {
    expect(normalizeTotpCode("12 34-5678")).toBe("123456");
    expect(isValidTotpCode("123456")).toBe(true);
    expect(isValidTotpCode("12345")).toBe(false);
  });

  it("encodes Supabase SVG output as an image data URL", () => {
    expect(totpQrDataUrl("<svg><text>#</text></svg>")).toBe(
      "data:image/svg+xml;charset=utf-8,%3Csvg%3E%3Ctext%3E%23%3C%2Ftext%3E%3C%2Fsvg%3E",
    );
  });

  it("selects verified TOTP factors for staff step-up", () => {
    const factors = [
      { id: "verified", factor_type: "totp", status: "verified", created_at: "2026-07-21", updated_at: "2026-07-21" },
      { id: "pending", factor_type: "totp", status: "unverified", created_at: "2026-07-21", updated_at: "2026-07-21" },
      { id: "phone", factor_type: "phone", status: "verified", created_at: "2026-07-21", updated_at: "2026-07-21" },
    ] as const;

    expect(verifiedTotpFactorSummaries(factors)).toEqual([
      { id: "verified", friendly_name: undefined, status: "verified" },
    ]);
  });
});
