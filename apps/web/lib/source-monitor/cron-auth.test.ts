import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

let auth: typeof import("./cron-auth");

function token(payload: Record<string, unknown>): string {
  return `header.${Buffer.from(JSON.stringify(payload)).toString("base64url")}.signature`;
}

beforeAll(async () => {
  auth = await import("./cron-auth");
});

describe("source monitor cron authorization", () => {
  it("requires a high-entropy cron secret and exact bearer authorization", () => {
    const secret = "a".repeat(48);
    expect(auth.isCronSecretConfigured("short")).toBe(false);
    expect(auth.isCronSecretConfigured(secret)).toBe(true);
    expect(
      auth.hasValidCronAuthorization(
        new Request("https://elsewhereplan.com/api/cron/source-monitor", {
          headers: { authorization: `Bearer ${secret}` },
        }),
        secret,
      ),
    ).toBe(true);
    expect(
      auth.hasValidCronAuthorization(
        new Request("https://elsewhereplan.com/api/cron/source-monitor", {
          headers: { authorization: `Bearer ${secret}x` },
        }),
        secret,
      ),
    ).toBe(false);
  });

  it("accepts only an unexpired narrow worker JWT", () => {
    const now = 2_000_000_000;
    expect(
      auth.isNarrowSourceMonitorWorkerJwt(
        token({ role: "source_monitor_worker", exp: now + 3600 }),
        now,
      ),
    ).toBe(true);
    expect(
      auth.isNarrowSourceMonitorWorkerJwt(
        token({ role: "service_role", exp: now + 3600 }),
        now,
      ),
    ).toBe(false);
    expect(
      auth.isNarrowSourceMonitorWorkerJwt(
        token({ role: "source_monitor_worker", exp: now + 30 }),
        now,
      ),
    ).toBe(false);
  });
});
