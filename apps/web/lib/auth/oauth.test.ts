import { describe, expect, it } from "vitest";
import { enabledOAuthProviders, oauthCallbackUrl } from "./oauth";

describe("social sign-in policy", () => {
  it("only exposes configured Elsewhere providers", () => {
    expect(enabledOAuthProviders({ google: true, apple: false, github: true })).toEqual([
      "google",
    ]);
    expect(enabledOAuthProviders({ google: true, apple: true })).toEqual([
      "google",
      "apple",
    ]);
  });

  it("keeps callback destinations on a safe internal path", () => {
    expect(oauthCallbackUrl("https://elsewhereplan.com", "//attacker.test")).toBe(
      "https://elsewhereplan.com/auth/callback?next=%2Fapp%2Fdashboard",
    );
    expect(oauthCallbackUrl("https://elsewhereplan.com", "/compare?country=mexico")).toBe(
      "https://elsewhereplan.com/auth/callback?next=%2Fcompare%3Fcountry%3Dmexico",
    );
  });
});
