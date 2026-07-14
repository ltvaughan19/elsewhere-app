import { test, expect } from "@playwright/test";

test("home page loads with Elsewhere brand and Fit Quiz CTA", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByText("Elsewhere").first()).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "one calm path",
  );
  await expect(
    page.getByRole("link", { name: "Start Fit Quiz" }).first(),
  ).toBeVisible();
});

test("budget calculator computes runway", async ({ page }) => {
  await page.goto("/budget-calculator");
  await expect(page.getByText("Your runway")).toBeVisible();
  await expect(page.getByText("months")).toBeVisible();
});

test("compare page renders country picker", async ({ page }) => {
  await page.goto("/compare");
  await expect(
    page.getByRole("heading", { name: "Compare countries" }),
  ).toBeVisible();
  await expect(page.getByText("Side-by-side comparison")).toBeVisible();
});

test("visa compass shows seed cards", async ({ page }) => {
  await page.goto("/visa-compass");
  await expect(
    page.getByRole("heading", { name: "Visa Compass" }),
  ).toBeVisible();
  await expect(page.getByText("Needs verification").first()).toBeVisible();
});

test("pricing page shows tiers", async ({ page }) => {
  await page.goto("/pricing");
  await expect(page.getByRole("heading", { name: "Pricing" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Free" })).toBeVisible();
});

test("404 page for unknown country slug", async ({ page }) => {
  await page.goto("/countries/not-a-real-country");
  await expect(page.getByText("Page not found")).toBeVisible();
});

test("signup flow reaches onboarding", async ({ page }) => {
  await page.goto("/signup");
  await page.getByLabel("Email").fill("test@example.com");
  await page.getByRole("button", { name: "Continue to readiness quiz" }).click();
  await expect(page).toHaveURL(/\/app\/onboarding/);
  await expect(page.getByText("Build your Elsewhere profile")).toBeVisible();
});

test("fit quiz guest flow reaches path", async ({ page }) => {
  await page.goto("/app/onboarding");
  await expect(page.getByText("Build your Elsewhere profile")).toBeVisible();
  // Advance through all steps with defaults
  const next = page.getByRole("button", { name: "Next" });
  for (let i = 0; i < 9; i++) {
    await next.click();
  }
  await page.getByRole("button", { name: "See my path" }).click();
  await expect(page).toHaveURL(/\/app\/path/);
  await expect(page.getByText("Your research path")).toBeVisible();
  await expect(page.getByText("Needs verification").first()).toBeVisible();
});
