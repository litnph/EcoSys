import { test, expect, type Page } from "@playwright/test";

const baseUrl = "http://127.0.0.1:3000";
const desktop = { width: 1440, height: 1000 };
const mobile = { width: 390, height: 844 };

test.use({
  channel: "chrome",
  launchOptions: { args: ["--disable-extensions"] },
});

async function settle(page: Page) {
  await page.waitForTimeout(3_500);
  await expect(page.locator("body")).toBeVisible();
}

test("bounded desktop and mobile redesign review", async ({ page }) => {
  test.setTimeout(180_000);
  const runtimeErrors: string[] = [];
  page.on("pageerror", (error) => runtimeErrors.push(error.message));

  await page.route("**/api/v1/**", async (route) => {
    if (route.request().url().endsWith("/api/v1/user/me")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            userId: "visual-review",
            email: "review@example.invalid",
            fullName: "Người dùng kiểm tra",
            role: "Admin",
            isEmailVerified: true,
            languageCode: "vi",
            timezone: "Asia/Bangkok",
            theme: "light",
          },
        }),
      });
      return;
    }

    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        success: false,
        error: { code: "visual_review_unavailable", message: "API unavailable during visual review" },
      }),
    });
  });

  await page.setViewportSize(desktop);
  await page.goto(`${baseUrl}/vi/login`, { waitUntil: "networkidle" });
  await page.screenshot({ path: ".impeccable/review/current/login-desktop.png", fullPage: true });

  await page.setViewportSize(mobile);
  await page.reload({ waitUntil: "networkidle" });
  await page.screenshot({ path: ".impeccable/review/current/login-mobile.png", fullPage: true });

  await page.evaluate(() => {
    localStorage.setItem("pfp_access_token", "visual-review-token");
    localStorage.setItem("pfp_locale", "vi");
  });

  const routes = [
    ["dashboard", "/vi"],
    ["transactions", "/vi/transactions"],
    ["sources", "/vi/sources"],
    ["installments", "/vi/installments"],
    ["debt", "/vi/debt"],
    ["reports", "/vi/reports"],
    ["settings", "/vi/settings/preferences"],
  ] as const;

  for (const [name, path] of routes) {
    await page.setViewportSize(desktop);
    await page.goto(`${baseUrl}${path}`, { waitUntil: "domcontentloaded" });
    await settle(page);
    await page.screenshot({ path: `.impeccable/review/current/${name}-desktop.png`, fullPage: true });

    await page.setViewportSize(mobile);
    await page.reload({ waitUntil: "domcontentloaded" });
    await settle(page);
    await page.screenshot({ path: `.impeccable/review/current/${name}-mobile.png`, fullPage: true });
  }

  expect(runtimeErrors).toEqual([]);
});
