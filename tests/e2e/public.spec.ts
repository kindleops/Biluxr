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

  test("home tells the story: instrument, chapters, reduced motion safe", async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Request anything/ })).toBeVisible();
    await expect(page.getByRole("region", { name: "A year with Biluxr" })).toBeAttached();
    await page.getByRole("region", { name: "A year with Biluxr" }).scrollIntoViewIfNeeded();
    await expect(page.getByText("Somewhere above the weather", { exact: false })).toBeVisible();
    await context.close();
  });

  test("sub pages show all content under reduced motion, without scrolling", async ({
    browser,
  }) => {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    const page = await context.newPage();
    for (const path of ["/membership", "/concierge", "/partners"]) {
      await page.goto(path);
      const hidden = await page.evaluate(
        () =>
          [...document.querySelectorAll<HTMLElement>("[data-reveal]")].filter(
            (el) => getComputedStyle(el).opacity !== "1",
          ).length,
      );
      expect(hidden, `${path}: revealed content is visible`).toBe(0);
    }
    await context.close();
  });

  test("membership questions open and close", async ({ page }) => {
    await page.goto("/membership");
    const summary = page.getByText("Where does Biluxr operate?");
    await summary.scrollIntoViewIfNeeded();
    await summary.click();
    await expect(page.getByText(/opening first in Miami and South Florida/)).toBeVisible();
  });

  test("concierge explains every member-facing status in order", async ({ page }) => {
    await page.goto("/concierge");
    const flow = page.locator(".scroll-timeline li");
    await expect(flow).toHaveCount(6);
    await expect(flow.first()).toContainText("Received");
    await expect(page.getByRole("list", { name: "Categories of request" })).toBeAttached();
  });

  test("partners marks its example brief as illustrative", async ({ page }) => {
    await page.goto("/partners");
    await expect(page.getByText("Illustrative. Fictional member.")).toBeAttached();
    await expect(page.getByRole("button", { name: /Introduce your business/ })).toBeAttached();
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
