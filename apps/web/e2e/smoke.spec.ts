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
