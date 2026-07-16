import { test, expect } from "@playwright/test";

test("marketing home loads with Fit Quiz CTA", async ({ page }) => {
  test.slow();
  await page.goto("/");
  const loader = page.locator("#loader");
  await expect(loader).toHaveClass(/\bis-done\b/, { timeout: 30000 });
  await expect(loader).toBeHidden({ timeout: 5000 });
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

test("planner keeps global research navigation calm and consistent", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/app/onboarding");

  const navigation = page.getByRole("navigation", {
    name: "Primary navigation",
  });
  await expect(navigation).toBeVisible();
  await expect(navigation.getByRole("link", { name: "Countries" })).toHaveAttribute(
    "href",
    "/countries",
  );
  await expect(navigation.getByRole("link", { name: "Compare" })).toHaveAttribute(
    "href",
    "/compare",
  );
  await expect(navigation.getByRole("link", { name: "Plan" })).toHaveAttribute(
    "href",
    "/app/dashboard",
  );
  await expect(page.getByText("Plan setup", { exact: true }).first()).toBeVisible();
});

test("planner mobile navigation opens as a drawer without overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/app/onboarding");

  const menu = page.getByRole("button", { name: "Menu, open navigation" });
  await expect(menu).toBeVisible();
  await menu.click();
  await expect(
    page.getByRole("button", { name: "Menu, close navigation", expanded: true }),
  ).toBeVisible();

  const drawer = page.getByRole("dialog", { name: "Elsewhere navigation" });
  await expect(drawer).toBeVisible();
  await expect(drawer.getByRole("button", { name: "Close navigation" })).toBeFocused();
  await expect(drawer.getByRole("link", { name: "Countries", exact: true })).toBeVisible();
  await expect(drawer.getByRole("link", { name: "Settings", exact: true })).toBeVisible();

  await page.keyboard.press("Shift+Tab");
  await expect(drawer.getByRole("link", { name: "Settings", exact: true })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(drawer.getByRole("button", { name: "Close navigation" })).toBeFocused();

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);

  await page.keyboard.press("Escape");
  await expect(drawer).toBeHidden();
  await expect(menu).toBeFocused();
});

test("mobile navigation resets when the layout crosses to desktop", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/app/onboarding");
  await page.getByRole("button", { name: "Menu, open navigation" }).click();
  await expect(page.getByRole("dialog", { name: "Elsewhere navigation" })).toBeVisible();

  await page.setViewportSize({ width: 1024, height: 768 });
  await expect(page.getByRole("dialog", { name: "Elsewhere navigation" })).toBeHidden();
  await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe("");
});

test("key product screens remain composed at every layout boundary", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "One cross-breakpoint pass is sufficient");

  for (const viewport of [
    { width: 375, height: 812 },
    { width: 768, height: 1024 },
    { width: 1024, height: 768 },
    { width: 1440, height: 900 },
  ]) {
    await page.setViewportSize(viewport);
    for (const path of ["/countries", "/login", "/app/onboarding"]) {
      await page.goto(path);
      const hasHorizontalOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth,
      );
      expect(hasHorizontalOverflow, `${path} overflowed at ${viewport.width}px`).toBe(false);
      await expect(page.locator("h1")).toBeVisible();
    }
  }
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

test("country preview comparison keeps the selected country", async ({ page }) => {
  await page.goto("/countries/mexico");
  await page.getByRole("link", { name: "Compare countries" }).first().click();
  await expect(page).toHaveURL(/\/compare\?country=mexico/);
  await expect(page.getByLabel("Country A")).toHaveValue("mexico");
  await expect(page.getByRole("heading", { name: "Mexico", level: 3 })).toBeVisible();
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
      page.getByRole("link", { name: `View guide: ${country}` }),
    ).toBeVisible();
  }
});

test("country preview withholds unreviewed guidance", async ({ page }) => {
  await page.goto("/countries/philippines");
  await expect(
    page.getByRole("heading", { name: "Philippines", level: 1 }),
  ).toBeVisible();
  await expect(page.getByText("Portal preview").first()).toBeVisible();
  await expect(page.getByText("Research outline available")).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex/,
  );
  await expect(page.locator("#report-outdated")).toHaveCount(0);
});

test("country preview stays concise without mobile overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/countries/philippines");

  await expect(page.getByRole("button", { name: /Contents/ })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Enter and stay" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Live well day to day" })).toBeVisible();

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);
});

test("country planning CTA carries its destination into setup", async ({ page }) => {
  await page.goto("/countries/philippines");
  await page.getByRole("link", { name: "Add Philippines to my plan" }).click();
  await expect(page).toHaveURL(/\/app\/onboarding\?destination=philippines/);
  await expect(page.getByRole("status")).toContainText(
    "Philippines is selected as your starting country",
  );
});

test("editorial workspace rejects ordinary visitors", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login\?next=%2Fadmin/);
});

test("signup form enforces account requirements without creating a user", async ({ page }) => {
  await page.goto("/signup");
  await expect(
    page.getByRole("checkbox", { name: "Keep me signed in on this trusted device" }),
  ).not.toBeChecked();
  await expect(page.getByLabel("Email")).toHaveAttribute("type", "email");
  await expect(page.getByLabel("Password")).toHaveAttribute("minlength", "12");
  await expect(page.getByLabel("Password")).toHaveAttribute(
    "autocomplete",
    "new-password",
  );
  await expect(page.getByRole("link", { name: "Log in" }).last()).toHaveAttribute(
    "href",
    "/login",
  );
});

test("login explains the trusted-device session choice", async ({ page }) => {
  await page.goto("/login");
  const trustedDevice = page.getByRole("checkbox", {
    name: "Keep me signed in on this trusted device",
  });
  await expect(trustedDevice).not.toBeChecked();
  await expect(page.getByText("Elsewhere does not set a persistent sign-in cookie.")).toBeVisible();
  await trustedDevice.check();
  await expect(trustedDevice).toBeChecked();
});

test("fit quiz guest flow reaches path", async ({ page }) => {
  await page.goto("/app/onboarding");
  await expect(page.getByText("Build your Elsewhere profile")).toBeVisible();
  // Advance through all steps with defaults
  const next = page.getByRole("button", { name: "Continue", exact: true });
  for (let i = 0; i < 9; i++) {
    await next.click();
  }
  await page.getByRole("button", { name: /See my path|Saving/ }).click();
  await expect(page).toHaveURL(/\/app\/path/, { timeout: 15000 });
  await expect(page.getByText("Your research path")).toBeVisible();
  await expect(page.getByText("Needs verification").first()).toBeVisible();
});
