import { expect, test } from "@playwright/test";
import { VIEWPORTS, expectAccessible, expectNoHorizontalOverflow, signInAs } from "./helpers";

const MEMBER_PAGES = ["/app", "/app/concierge", "/app/journeys", "/app/access", "/app/membership", "/app/profile"];

test.describe("access control", () => {
  test("signed-out visitors are sent to sign in", async ({ page, context }) => {
    await context.clearCookies();
    await page.goto("/app");
    await expect(page).toHaveURL(/\/login\?next=%2Fapp/);
    await page.goto("/command");
    await expect(page).toHaveURL(/\/login\?next=%2Fcommand/);
  });

  test("members cannot open Command", async ({ page, context }) => {
    await signInAs(context, page, "member");
    await page.goto("/command");
    await expect(page).toHaveURL(/\/app$/);
  });

  test("concierges cannot open the member app or admin configuration", async ({ page, context }) => {
    await signInAs(context, page, "concierge");
    await page.goto("/app");
    await expect(page).toHaveURL(/\/command$/);
    await page.goto("/command/settings");
    await expect(page).toHaveURL(/\/command$/);
  });
});

test.describe("member app", () => {
  for (const [name, viewport] of Object.entries(VIEWPORTS)) {
    test(`renders every section without overflow @ ${name}`, async ({ page, context }) => {
      await page.setViewportSize(viewport);
      await signInAs(context, page, "member");
      for (const path of MEMBER_PAGES) {
        await page.goto(path);
        await expect(page.locator("h1").first()).toBeVisible();
        await expectNoHorizontalOverflow(page);
      }
    });
  }

  test("member pages have no serious axe violations", async ({ page, context }) => {
    await signInAs(context, page, "member");
    for (const path of MEMBER_PAGES) {
      await page.goto(path);
      await expectAccessible(page);
    }
  });

  test("mobile navigation is reachable above the safe area", async ({ page, context }) => {
    await page.setViewportSize(VIEWPORTS["mobile-390"]);
    await signInAs(context, page, "member");
    const nav = page.getByRole("navigation", { name: "Member" }).last();
    await expect(nav).toBeVisible();
    await nav.getByRole("link", { name: "Journeys" }).click();
    await expect(page).toHaveURL(/\/app\/journeys$/);
  });
});

test.describe("the request loop: member → concierge → member", () => {
  const brief = `A quiet table for two at the chef's counter, ${Date.now()}`;

  test("member sends a request", async ({ page, context }) => {
    await signInAs(context, page, "member");
    await page.getByLabel(/What can we arrange/).fill(brief);
    await page.getByRole("button", { name: "Send to concierge" }).click();
    await expect(page).toHaveURL(/\/app\/concierge\/.+\?new=1/);
    await expect(page.getByText(/has it and will be in touch|Your concierge has it/)).toBeVisible();
    await expect(page.getByText("Received").first()).toBeVisible();
  });

  test("concierge reviews the AI reading and presents an option", async ({ page, context }) => {
    await signInAs(context, page, "concierge");
    await page.getByRole("link", { name: /A quiet table for two/ }).first().click();
    await expect(page.getByRole("heading", { level: 1 })).toContainText("A quiet table for two");

    // The reading happens after the member's response is sent; reload until present.
    await expect(async () => {
      await page.reload();
      await expect(page.getByText(/Awaiting review/)).toBeVisible({ timeout: 1000 });
    }).toPass({ timeout: 15_000 });
    await expect(page.getByText("Demo heuristic (not a model)")).toBeVisible();

    await page.getByRole("button", { name: "Apply selected" }).click();
    await expect(page.getByText("Accepted", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "New option" }).click();
    const sheet = page.getByRole("dialog", { name: "New option" });
    await sheet.getByLabel("Title").fill("Counter seats, 8:30pm");
    await sheet.getByLabel("Why this").fill("Two seats facing the pass. The chef will cook off-menu if you let us know tonight.");
    await sheet.getByLabel("Price").fill("640");
    await sheet.getByRole("button", { name: "Save option" }).click();
    await expect(page.getByText("Counter seats, 8:30pm").first()).toBeVisible();
    await expect(page.getByText("Options presented").first()).toBeVisible();

    await page.getByRole("radio", { name: "Internal note" }).click();
    await page.getByLabel("Internal note").fill("Member prefers counter seating; confirmed with the restaurant by phone.");
    await page.getByRole("button", { name: "Add note" }).click();
    await expect(page.getByText("Member prefers counter seating")).toBeVisible();
  });

  test("member chooses the option; the app says it is being secured, not confirmed", async ({ page, context }) => {
    await signInAs(context, page, "member");
    await page.goto("/app/concierge");
    await page.getByRole("link", { name: /A quiet table for two/ }).first().click();
    await expect(page.getByRole("heading", { name: "Counter seats, 8:30pm" })).toBeVisible();
    await expect(page.getByText("Member prefers counter seating")).toHaveCount(0);
    await page.getByRole("button", { name: "Choose this" }).click();
    await expect(page.getByText("Your choice is with your concierge")).toBeVisible();
    await page.reload();
    await expect(page.getByText("Securing your choice").first()).toBeVisible();
    await expect(page.getByText(/^Confirmed$/)).toHaveCount(0);
  });
});

test.describe("Command", () => {
  test("every section renders for an administrator", async ({ page, context }) => {
    await page.setViewportSize(VIEWPORTS["desktop-1440"]);
    await signInAs(context, page, "admin");
    for (const path of ["/command", "/command/members", "/command/applications", "/command/providers", "/command/cohort", "/command/analytics", "/command/settings"]) {
      await page.goto(path);
      await expect(page.locator("h1").first()).toBeVisible();
      await expectNoHorizontalOverflow(page);
      await expectAccessible(page);
    }
  });

  test("Command is usable on a phone", async ({ page, context }) => {
    await page.setViewportSize(VIEWPORTS["mobile-390"]);
    await signInAs(context, page, "concierge");
    await expectNoHorizontalOverflow(page);
    await page.getByRole("button", { name: "Menu" }).click();
    await page.getByRole("navigation", { name: "Command" }).getByRole("link", { name: "Members" }).click();
    await expect(page).toHaveURL(/\/command\/members$/);
  });
});
