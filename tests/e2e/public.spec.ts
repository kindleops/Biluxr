import { expect, test } from "@playwright/test";
import { VIEWPORTS, expectAccessible, expectNoHorizontalOverflow } from "./helpers";

const PAGES = [
  "/",
  "/membership",
  "/concierge",
  "/partners",
  "/apply",
  "/contact",
  "/login",
  "/legal/privacy",
  "/legal/security",
];

for (const [name, viewport] of Object.entries(VIEWPORTS)) {
  test.describe(`public site @ ${name}`, () => {
    test.use({ viewport });
    for (const path of PAGES) {
      test(`${path} renders without overflow`, async ({ page }) => {
        const response = await page.goto(path);
        expect(response?.status()).toBe(200);
        await expect(page.locator("h1").first()).toBeVisible();
        await expectNoHorizontalOverflow(page);
      });
    }
  });
}

test.describe("accessibility", () => {
  for (const path of PAGES) {
    test(`${path} has no serious axe violations (desktop)`, async ({ page }) => {
      await page.setViewportSize(VIEWPORTS["desktop-1440"]);
      await page.goto(path);
      await expectAccessible(page);
    });
  }

  test("home has no serious axe violations (mobile)", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS["mobile-390"]);
    await page.goto("/");
    await expectAccessible(page);
  });

  test("skip link moves focus to main content", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Skip to content" });
    await expect(skip).toBeFocused();
    await expect(page.locator("#main")).toBeAttached();
  });
});

test.describe("navigation", () => {
  test("mobile menu opens, navigates, and closes", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS["mobile-390"]);
    await page.goto("/");
    await page.getByRole("button", { name: "Open menu" }).click();
    const menu = page.getByRole("navigation", { name: "Mobile" });
    await expect(menu).toBeVisible();
    await menu.getByRole("link", { name: "Membership" }).click();
    await page.waitForURL("**/membership");
    await expect(page.getByRole("navigation", { name: "Mobile" })).toBeHidden();
  });

  test("SEO endpoints respond", async ({ request }) => {
    expect((await request.get("/sitemap.xml")).status()).toBe(200);
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toContain("Disallow: /app");
    expect((await request.get("/opengraph-image")).headers()["content-type"]).toContain(
      "image/png",
    );
  });
});

test.describe("apply", () => {
  test("validates, then accepts an application", async ({ page }) => {
    await page.goto("/apply");
    await page.getByRole("button", { name: "Submit application" }).click();
    await expect(page.getByText("A few details need attention.")).toBeVisible();
    await expect(page.getByLabel("Full name")).toHaveAttribute("aria-invalid", "true");

    await page.getByLabel("Full name").fill("Imogen Test");
    await page.getByLabel("Email").fill("imogen@example.com");
    await page.getByLabel("City you live in").fill("Miami");
    await page
      .getByLabel("How does your life move?")
      .fill("Two homes, a lot of travel, two small children.");
    await page
      .getByLabel("What would make it easier?")
      .fill("One person who remembers everything for us.");
    await page.getByLabel(/I have read the privacy notice/).check();
    await page.getByRole("button", { name: "Submit application" }).click();
    await expect(page.getByText("Thank you. Your application is with us.")).toBeVisible();
  });
});
