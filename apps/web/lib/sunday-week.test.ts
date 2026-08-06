import { describe, expect, it } from "vitest";
import { isoWeekKey } from "./sunday-week";

describe("isoWeekKey", () => {
  it("returns a stable YYYY-Www key", () => {
    expect(isoWeekKey(new Date("2026-08-05T12:00:00Z"))).toMatch(/^2026-W\d{2}$/);
  });

  it("keeps Monday and the following Sunday in the same week", () => {
    const monday = isoWeekKey(new Date("2026-08-03T12:00:00Z"));
    const sunday = isoWeekKey(new Date("2026-08-09T12:00:00Z"));
    expect(monday).toBe(sunday);
  });
});
