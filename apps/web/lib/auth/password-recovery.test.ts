import { describe, expect, it, vi } from "vitest";
import {
  requestPasswordRecovery,
  shouldRedirectInvalidRecovery,
  updateRecoveredPassword,
  type PasswordRecoveryAuth,
} from "./password-recovery";

function authMock(overrides: Partial<PasswordRecoveryAuth> = {}): PasswordRecoveryAuth {
  return {
    resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
    updateUser: vi.fn().mockResolvedValue({ error: null }),
    ...overrides,
  };
}

describe("password recovery", () => {
  it("requests a reset with normalized email and the exact callback", async () => {
    const auth = authMock();
    await expect(
      requestPasswordRecovery(auth, "  Planner@Example.COM ", "https://elsewhereplan.com"),
    ).resolves.toBe(true);
    expect(auth.resetPasswordForEmail).toHaveBeenCalledWith("planner@example.com", {
      redirectTo: "https://elsewhereplan.com/auth/callback?next=/reset-password",
    });
  });

  it("reports provider failure and preserves network failures for the form boundary", async () => {
    const rejected = authMock({
      resetPasswordForEmail: vi.fn().mockResolvedValue({ error: { message: "rejected" } }),
    });
    await expect(requestPasswordRecovery(rejected, "a@b.com", "https://example.com")).resolves.toBe(false);

    const unavailable = authMock({
      resetPasswordForEmail: vi.fn().mockRejectedValue(new Error("offline")),
    });
    await expect(requestPasswordRecovery(unavailable, "a@b.com", "https://example.com")).rejects.toThrow("offline");
  });

  it("updates the password only through the authenticated provider session", async () => {
    const auth = authMock();
    await expect(updateRecoveredPassword(auth, "a-long-new-password")).resolves.toBe(true);
    expect(auth.updateUser).toHaveBeenCalledWith({ password: "a-long-new-password" });

    const expired = authMock({
      updateUser: vi.fn().mockResolvedValue({ error: { message: "expired" } }),
    });
    await expect(updateRecoveredPassword(expired, "a-long-new-password")).resolves.toBe(false);
  });

  it("fails the reset route closed without an authenticated subject", () => {
    expect(shouldRedirectInvalidRecovery("/reset-password", null)).toBe(true);
    expect(shouldRedirectInvalidRecovery("/reset-password", "user-id")).toBe(false);
    expect(shouldRedirectInvalidRecovery("/forgot-password", null)).toBe(false);
  });
});
