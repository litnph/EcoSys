import { test } from "@playwright/test";

const baseUrl = "http://127.0.0.1:3000";

test.use({ channel: "chrome" });

test("capture authenticated shell baseline", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("pfp_access_token", "visual-audit-token");
    localStorage.setItem("pfp_locale", "vi");
  });

  await page.route("**/api/v1/**", async (route) => {
    if (route.request().url().endsWith("/api/v1/user/me")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            userId: "visual-audit",
            email: "audit@example.invalid",
            fullName: "Người dùng kiểm thử",
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
        error: { code: "visual_audit", message: "Dữ liệu không khả dụng trong bản chụp audit." },
      }),
    });
  });

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${baseUrl}/vi`, { waitUntil: "networkidle" });
  await page.screenshot({ path: ".impeccable/review/baseline/dashboard-shell-desktop.png", fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: "networkidle" });
  await page.screenshot({ path: ".impeccable/review/baseline/dashboard-shell-mobile.png", fullPage: true });
});
