import AxeBuilder from "@axe-core/playwright";
import { expect, type BrowserContext, type Page } from "@playwright/test";

export const VIEWPORTS = {
  "desktop-1440": { width: 1440, height: 900 },
  "desktop-1728": { width: 1728, height: 1117 },
  "tablet-1024": { width: 1024, height: 1366 },
  "mobile-390": { width: 390, height: 844 },
  "mobile-393": { width: 393, height: 852 },
  "mobile-430": { width: 430, height: 932 },
} as const;

export async function signInAs(
  context: BrowserContext,
  page: Page,
  persona: "member" | "concierge" | "admin",
) {
  await context.clearCookies();
  await page.goto("/login");
  await page
    .getByRole("button", { name: new RegExp(persona === "admin" ? "Administrator" : persona, "i") })
    .first()
    .click();
  await page.waitForURL(persona === "member" ? /\/app$/ : /\/command$/);
}

export async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow, "page should not scroll horizontally").toBeLessThanOrEqual(0);
}

export async function expectAccessible(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  const serious = results.violations.filter(
    (v) => v.impact === "serious" || v.impact === "critical",
  );
  expect(
    serious.map(
      (v) =>
        `${v.id}: ${v.nodes
          .map((n) => n.target.join(" "))
          .slice(0, 3)
          .join(", ")}`,
    ),
    "no serious or critical accessibility violations",
  ).toEqual([]);
}
