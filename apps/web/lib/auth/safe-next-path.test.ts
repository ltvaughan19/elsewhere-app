import { describe, expect, it } from "vitest";
import { safeNextPath } from "./safe-next-path";

describe("safeNextPath", () => {
  it("allows same-origin application paths", () => {
    expect(safeNextPath("/app/dashboard")).toBe("/app/dashboard");
    expect(safeNextPath("/reset-password")).toBe("/reset-password");
  });

  it("rejects protocol-relative redirects", () => {
    expect(safeNextPath("//attacker.example/path")).toBe("/app/dashboard");
    expect(safeNextPath("/\\attacker.example/path")).toBe("/app/dashboard");
    expect(safeNextPath("/%5Cattacker.example/path")).toBe("/app/dashboard");
  });

  it("rejects absolute and malformed redirects", () => {
    expect(safeNextPath("https://attacker.example")).toBe("/app/dashboard");
    expect(safeNextPath("app/dashboard")).toBe("/app/dashboard");
    expect(safeNextPath("/app/dashboard\nSet-Cookie:test")).toBe("/app/dashboard");
  });

  it("uses a caller-provided fallback", () => {
    expect(safeNextPath(null, "/login")).toBe("/login");
  });
});
