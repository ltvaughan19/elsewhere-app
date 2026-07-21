import type { Factor } from "@supabase/supabase-js";

export type MfaFactorSummary = Pick<
  Factor<"totp">,
  "id" | "friendly_name" | "status"
>;

export function normalizeTotpCode(value: string): string {
  return value.replace(/\D/g, "").slice(0, 6);
}

export function isValidTotpCode(value: string): boolean {
  return /^\d{6}$/.test(value);
}

export function totpQrDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function verifiedTotpFactorSummaries(
  factors: readonly Factor[],
): MfaFactorSummary[] {
  return factors.flatMap((factor) =>
    factor.factor_type === "totp" && factor.status === "verified"
      ? [
          {
            id: factor.id,
            friendly_name: factor.friendly_name,
            status: factor.status,
          },
        ]
      : [],
  );
}
