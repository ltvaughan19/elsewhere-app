import { test, expect } from "@playwright/test";

test("marketing home loads with Fit Quiz CTA", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#loader")).toBeHidden({ timeout: 15000 });
  await expect(page.locator("h1")).toContainText("one calm path");
  await expect(
    page.getByRole("link", { name: "Start Fit Quiz" }).first(),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Log in" }).first()).toBeVisible();
});

test("product hub loads at /start", async ({ page }) => {
  await page.goto("/start");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Your move plan",
  );
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

test("country directory exposes the three launch portals", async ({ page }) => {
  await page.goto("/countries");
  await expect(
    page.getByRole("heading", { name: "One portal for the whole move." }),
  ).toBeVisible();
  for (const country of ["Philippines", "Thailand", "Mexico"]) {
    await expect(
      page.getByRole("link", { name: `Open the ${country} country portal` }),
    ).toBeVisible();
  }
});

test("country preview withholds unreviewed guidance", async ({ page }) => {
  await page.goto("/countries/philippines");
  await expect(
    page.getByRole("heading", { name: "Philippines", level: 1 }),
  ).toBeVisible();
  await expect(page.getByText("Portal preview").first()).toBeVisible();
  await expect(
    page.getByText("This page exposes structure only.", { exact: false }),
  ).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex/,
  );
  await expect(page.locator("#report-outdated")).toHaveCount(0);
});

test("country guide contents works without mobile overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/countries/philippines");

  const contents = page.getByRole("button", { name: /Contents/ });
  await expect(contents).toBeVisible();
  await contents.click();
  await expect(contents).toHaveAttribute("aria-expanded", "true");
  await expect(
    page.locator("#country-portal-mobile-contents a"),
  ).toHaveCount(11);
  await expect(
    page.getByRole("link", { name: /Entry and legal stay/ }).last(),
  ).toBeVisible();

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);
});

test("editorial workspace rejects ordinary visitors", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login\?next=%2Fadmin/);
});

test("signup form enforces account requirements without creating a user", async ({ page }) => {
  await page.goto("/signup");
  await expect(page.getByLabel("Email")).toHaveAttribute("type", "email");
  await expect(page.getByLabel("Password")).toHaveAttribute("minlength", "8");
  await expect(page.getByLabel("Password")).toHaveAttribute(
    "autocomplete",
    "new-password",
  );
  await expect(page.getByRole("link", { name: "Log in" }).last()).toHaveAttribute(
    "href",
    "/login",
  );
});

test("fit quiz guest flow reaches path", async ({ page }) => {
  await page.goto("/app/onboarding");
  await expect(page.getByText("Build your Elsewhere profile")).toBeVisible();
  // Advance through all steps with defaults
  const next = page.getByRole("button", { name: "Next", exact: true });
  for (let i = 0; i < 9; i++) {
    await next.click();
  }
  await page.getByRole("button", { name: /See my path|Saving/ }).click();
  await expect(page).toHaveURL(/\/app\/path/, { timeout: 15000 });
  await expect(page.getByText("Your research path")).toBeVisible();
  await expect(page.getByText("Needs verification").first()).toBeVisible();
});
