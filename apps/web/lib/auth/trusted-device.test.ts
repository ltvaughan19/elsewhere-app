import { describe, expect, it } from "vitest";
import { applyTrustedDeviceLifetime, trustedDeviceMode } from "./trusted-device";

describe("trusted device cookie policy", () => {
  it("keeps legacy and explicitly trusted sessions persistent", () => {
    expect(trustedDeviceMode(undefined)).toBe("persistent");
    expect(trustedDeviceMode("1")).toBe("persistent");
    expect(applyTrustedDeviceLifetime({ maxAge: 600, path: "/" }, "1")).toEqual({
      maxAge: 600,
      path: "/",
    });
  });

  it("turns auth cookies into browser-session cookies on shared devices", () => {
    expect(trustedDeviceMode("0")).toBe("session");
    expect(
      applyTrustedDeviceLifetime(
        { expires: new Date("2030-01-01T00:00:00Z"), maxAge: 600, path: "/" },
        "0",
      ),
    ).toEqual({ path: "/" });
  });

  it("never weakens deletion cookies", () => {
    expect(applyTrustedDeviceLifetime({ maxAge: 0, path: "/" }, "0")).toEqual({
      maxAge: 0,
      path: "/",
    });
  });
});
