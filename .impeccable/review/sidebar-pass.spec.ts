import { expect, test, type Page } from "@playwright/test";

const baseUrl = "http://127.0.0.1:3000";

test.use({
  channel: "chrome",
  launchOptions: { args: ["--disable-extensions"] },
});

async function prepareAuthenticatedPage(page: Page) {
  let languageCode: "vi" | "en" = "vi";

  await page.route("**/api/v1/**", async (route) => {
    if (route.request().url().endsWith("/api/v1/user/me")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            userId: "sidebar-review",
            email: "review@example.invalid",
            fullName: "Người dùng kiểm tra",
            role: "Admin",
            isEmailVerified: true,
            languageCode,
            timezone: "Asia/Ho_Chi_Minh",
            theme: "light",
          },
        }),
      });
      return;
    }

    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ success: false }),
    });
  });

  await page.goto(`${baseUrl}/vi/login`, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => {
    localStorage.setItem("pfp_access_token", "sidebar-review-token");
    localStorage.setItem("pfp_locale", "vi");
  });

  return {
    setLanguageCode(value: "vi" | "en") {
      languageCode = value;
    },
  };
}

test("flat sidebar, compact rail, and mobile drawer", async ({ page }) => {
  test.setTimeout(90_000);
  const account = await prepareAuthenticatedPage(page);

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${baseUrl}/vi`, { waitUntil: "domcontentloaded" });

  const sidebar = page.getByRole("complementary", {
    name: "Điều hướng chính",
  });
  const navigation = sidebar.getByRole("navigation", {
    name: "Điều hướng chính",
  });
  await expect(sidebar).toBeVisible();
  await expect(sidebar).toHaveCSS("width", "256px");
  await expect(navigation.getByRole("link")).toHaveCount(12);
  await expect(navigation.getByRole("link", { name: "Sao kê thẻ" })).toBeVisible();
  await expect(sidebar.getByRole("button", { name: "Thẻ & nợ" })).toHaveCount(0);
  await expect(sidebar.getByRole("button", { name: "Phân loại" })).toHaveCount(0);
  await expect(navigation.getByRole("link", { name: "Tổng quan" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(navigation.getByRole("link", { name: "Giao dịch" })).toHaveAttribute(
    "href",
    "/vi/transactions",
  );
  const closeButton = sidebar.getByRole("button", { name: "Đóng thanh bên" });
  await closeButton.hover();
  await expect(page.getByRole("tooltip")).toHaveText("Đóng thanh bên");
  await page.screenshot({
    path: ".impeccable/review/current/sidebar-flat-desktop.png",
    fullPage: true,
  });

  await closeButton.click();
  const openButton = sidebar.getByRole("button", { name: "Mở thanh bên" });
  await expect(openButton).toBeVisible();
  await expect(sidebar).toHaveCSS("width", "76px");
  await expect(openButton).toHaveAttribute("aria-expanded", "false");

  const transactionsLink = navigation.getByRole("link", { name: "Giao dịch" });
  await transactionsLink.focus();
  await expect(page.getByRole("tooltip")).toHaveText("Giao dịch");
  await page.screenshot({
    path: ".impeccable/review/current/sidebar-flat-collapsed-desktop.png",
    fullPage: true,
  });

  await openButton.focus();
  await expect(page.getByRole("tooltip")).toHaveText("Mở thanh bên");
  await page.keyboard.press("Space");
  await expect(sidebar.getByRole("button", { name: "Đóng thanh bên" })).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/vi`, { waitUntil: "domcontentloaded" });
  const mobileMenuButton = page.locator(
    '#dashboard-top-nav button[aria-controls="dashboard-sidebar"]',
  );
  await expect(mobileMenuButton).toHaveAccessibleName("Mở menu");
  await expect(mobileMenuButton).toHaveAttribute("aria-expanded", "false");
  await mobileMenuButton.click();
  await expect(mobileMenuButton).toHaveAttribute("aria-expanded", "true");

  const mobileSidebar = page.getByRole("dialog", {
    name: "Điều hướng chính",
  });
  const mobileNavigation = mobileSidebar.getByRole("navigation", {
    name: "Điều hướng chính",
  });
  await expect(mobileSidebar).toBeVisible();
  await expect(mobileSidebar).toHaveCSS("width", "256px");
  await expect(mobileSidebar.getByRole("button", { name: "Đóng menu" })).toBeFocused();
  await expect(page.locator("#dashboard-main")).toHaveAttribute("inert", "");
  await expect(page.locator("#dashboard-main")).toHaveAttribute("aria-hidden", "true");
  await expect(mobileNavigation.getByRole("link")).toHaveCount(12);
  await expect(mobileSidebar.getByRole("button", { name: "Phân loại" })).toHaveCount(0);
  await expect(page.locator("html").evaluate((element) => element.scrollWidth)).resolves.toBeLessThanOrEqual(
    await page.locator("html").evaluate((element) => element.clientWidth),
  );
  await page.screenshot({
    path: ".impeccable/review/current/sidebar-flat-drawer-mobile.png",
    fullPage: true,
  });

  await mobileNavigation.getByRole("link", { name: "Giao dịch" }).click();
  await expect(mobileSidebar).toBeHidden();
  await expect(page).toHaveURL(`${baseUrl}/vi/transactions`);
  await expect(page.locator("#dashboard-main")).not.toHaveAttribute("inert", "");
  await expect(mobileMenuButton).toBeFocused();

  await mobileMenuButton.click();
  await expect(mobileSidebar).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(mobileSidebar).toBeHidden();
  await expect(mobileMenuButton).toBeFocused();

  await page.setViewportSize({ width: 1440, height: 1000 });
  account.setLanguageCode("en");
  await page.goto(`${baseUrl}/en`, { waitUntil: "domcontentloaded" });
  const englishSidebar = page.getByRole("complementary", {
    name: "Main navigation",
  });
  await expect(englishSidebar.getByRole("button", { name: "Close sidebar" })).toBeVisible();

  await page.emulateMedia({ reducedMotion: "reduce" });
  await englishSidebar.getByRole("button", { name: "Close sidebar" }).click();
  await expect(englishSidebar.getByRole("button", { name: "Open sidebar" })).toBeVisible();
});
