import { test, expect } from "@playwright/test";

test("home page loads with primary CTA", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Step-by-Step Plan",
  );
  await expect(
    page.getByRole("link", { name: "Build My Expat Plan" }).first(),
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
