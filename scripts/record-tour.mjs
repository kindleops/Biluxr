#!/usr/bin/env node
/**
 * Records a product walkthrough of a running Biluxr (demo mode) as MP4.
 *
 *   BILUXR_DEMO_MODE=true npm run build && BILUXR_DEMO_MODE=true npx next start -p 3000
 *   FFMPEG=/path/to/ffmpeg node scripts/record-tour.mjs <outDir> [desktop|mobile|all]
 *
 * Frames come from Chrome's screencast (JPEG, timestamped) and are encoded
 * with H.264 at constant 30fps. A caption strip and a visible cursor are
 * injected into the recording only — never into the product.
 */
import { chromium } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
/** Scroll target meaning "just above the footer" (the founding section). */
const document_bottom = "main > section:last-of-type";
const FFMPEG = process.env.FFMPEG ?? "ffmpeg";
const [outDir = "tour", which = "all"] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });

const OVERLAY = `
(() => {
  const install = () => {
    if (document.getElementById("__tour_cursor")) return;
    const c = document.createElement("div");
    c.id = "__tour_cursor";
    c.style.cssText = "position:fixed;left:0;top:0;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;border:1.5px solid rgba(243,239,232,.9);background:rgba(243,239,232,.12);box-shadow:0 0 0 1px rgba(0,0,0,.35);pointer-events:none;z-index:2147483647;transition:transform .12s ease,background .12s ease;transform:translate(-100px,-100px)";
    document.documentElement.appendChild(c);
    let x = -100, y = -100;
    addEventListener("mousemove", (e) => { x = e.clientX; y = e.clientY; c.style.transform = "translate(" + x + "px," + y + "px)"; }, true);
    addEventListener("mousedown", () => { c.style.background = "rgba(243,239,232,.45)"; c.style.transform = "translate(" + x + "px," + y + "px) scale(.8)"; }, true);
    addEventListener("mouseup", () => { c.style.background = "rgba(243,239,232,.12)"; c.style.transform = "translate(" + x + "px," + y + "px)"; }, true);
    const cap = document.createElement("div");
    cap.id = "__tour_caption";
    cap.style.cssText = "position:fixed;left:50%;bottom:28px;transform:translateX(-50%);max-width:min(92vw,760px);padding:12px 20px;border-radius:14px;background:rgba(13,13,16,.82);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);box-shadow:inset 0 0 0 1px rgba(255,255,255,.1),0 20px 50px -20px rgba(0,0,0,.8);color:#f3efe8;font:500 15px/1.45 var(--font-geist),system-ui,sans-serif;letter-spacing:.01em;text-align:center;pointer-events:none;z-index:2147483646;opacity:0;transition:opacity .45s ease";
    document.documentElement.appendChild(cap);
  };
  if (document.readyState === "loading") addEventListener("DOMContentLoaded", install); else install();
})();
`;

async function caption(page, text) {
  await page.evaluate((t) => {
    const el = document.getElementById("__tour_caption");
    if (!el) return;
    if (!t) {
      el.style.opacity = "0";
      return;
    }
    el.textContent = t;
    el.style.opacity = "1";
  }, text);
}

async function smoothScrollTo(page, target, duration = 1600) {
  await page.evaluate(
    ({ target, duration }) =>
      new Promise((resolve) => {
        const html = document.documentElement;
        html.style.scrollBehavior = "auto";
        const start = scrollY;
        const end =
          typeof target === "number"
            ? target
            : (document.querySelector(target)?.getBoundingClientRect().top ?? 0) + scrollY - 40;
        const t0 = performance.now();
        const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
        const step = (now) => {
          const p = Math.min(1, (now - t0) / duration);
          scrollTo(0, start + (end - start) * ease(p));
          if (p < 1) requestAnimationFrame(step);
          else resolve();
        };
        requestAnimationFrame(step);
      }),
    { target, duration },
  );
}

async function glide(page, locator, steps = 28) {
  const box = await locator.boundingBox();
  if (!box) return;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps });
}

async function clickLike(page, locator) {
  await locator.scrollIntoViewIfNeeded();
  await glide(page, locator);
  await page.waitForTimeout(250);
  await locator.click();
}

async function circleOver(page, locator, seconds = 3) {
  const box = await locator.boundingBox();
  if (!box) return;
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  const frames = Math.round(seconds * 30);
  for (let i = 0; i <= frames; i++) {
    const a = (i / frames) * Math.PI * 2;
    await page.mouse.move(
      cx + Math.cos(a) * box.width * 0.36,
      cy + Math.sin(a) * box.height * 0.34,
    );
    await page.waitForTimeout(1000 / 30);
  }
}

async function signIn(page, persona) {
  await page.context().clearCookies();
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await caption(
    page,
    persona === "member" ? "Demo environment · fictional people" : "Now, the concierge team's side",
  );
  await page.waitForTimeout(1200);
  const button = page.getByRole("button", { name: new RegExp(persona, "i") }).first();
  await clickLike(page, button);
  await page.waitForURL(persona === "member" ? /\/app$/ : /\/command$/);
  await page.waitForLoadState("networkidle");
}

async function record(name, contextOptions, script) {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium",
    // WebGL (silk, orb) in headless Chromium without a GPU.
    args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
  });
  const context = await browser.newContext(contextOptions);
  await context.addInitScript(OVERLAY);
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  const framesDir = path.join(outDir, `${name}-frames`);
  rmSync(framesDir, { recursive: true, force: true });
  mkdirSync(framesDir, { recursive: true });
  const frames = [];
  cdp.on("Page.screencastFrame", async ({ data, metadata, sessionId }) => {
    const file = path.join(framesDir, `${String(frames.length).padStart(6, "0")}.jpg`);
    writeFileSync(file, Buffer.from(data, "base64"));
    frames.push({ file, t: metadata.timestamp });
    await cdp.send("Page.screencastFrameAck", { sessionId }).catch(() => {});
  });
  const { width, height } = contextOptions.viewport;
  const scale = contextOptions.deviceScaleFactor ?? 1;
  await cdp.send("Page.startScreencast", {
    format: "jpeg",
    quality: 90,
    maxWidth: Math.round(width * scale),
    maxHeight: Math.round(height * scale),
    everyNthFrame: 1,
  });

  await script(page);

  await page.waitForTimeout(600);
  await cdp.send("Page.stopScreencast");
  await browser.close();

  // Variable-duration concat list → constant 30fps H.264.
  const list = frames
    .map((f, i) => {
      const next = frames[i + 1]?.t ?? f.t + 1.2;
      return `file '${path.resolve(f.file)}'\nduration ${Math.max(0.001, next - f.t).toFixed(4)}`;
    })
    .join("\n");
  const listFile = path.join(outDir, `${name}-frames.txt`);
  writeFileSync(listFile, `${list}\nfile '${path.resolve(frames.at(-1).file)}'\n`);
  const out = path.join(outDir, `biluxr-${name}.mp4`);
  execFileSync(FFMPEG, [
    "-y",
    "-loglevel",
    "error",
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    listFile,
    "-vf",
    "fps=30,scale=trunc(iw/2)*2:trunc(ih/2)*2,format=yuv420p",
    "-c:v",
    "libx264",
    "-preset",
    "slow",
    "-crf",
    "19",
    "-movflags",
    "+faststart",
    out,
  ]);
  rmSync(framesDir, { recursive: true, force: true });
  rmSync(listFile, { force: true });
  console.log(`✓ ${out} (${frames.length} frames, ${(frames.at(-1).t - frames[0].t).toFixed(1)}s)`);
}

/* ------------------------------ Desktop tour ------------------------------ */

async function desktopTour(page) {
  const brief =
    "Two seats at the ballet on Saturday, near the front. It's my daughter's first time.";

  // 1. The public site
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.mouse.move(1100, 600);
  await caption(page, "Biluxr — one relationship for an exceptional life");
  await page.waitForTimeout(5600);
  await caption(page, "");
  await smoothScrollTo(page, "#instrument", 3000);
  await caption(page, "Request anything — the orb gathers as a request is written and read");
  await page.waitForTimeout(9500);
  await caption(page, "");
  await smoothScrollTo(page, "section[aria-label='A year with Biluxr']", 2200);
  await page.waitForTimeout(800);
  await smoothScrollTo(
    page,
    await page.evaluate(() => {
      const el = document.querySelector("section[aria-label='A year with Biluxr']");
      return el.getBoundingClientRect().bottom + scrollY - innerHeight;
    }),
    14000,
  );
  await page.waitForTimeout(600);
  await smoothScrollTo(page, "#product", 2200);
  await caption(page, "The member app: say it once, choose, consider it handled");
  await page.waitForTimeout(3600);
  await smoothScrollTo(page, "#journeys", 2000);
  await caption(page, "Journeys — every leg held together, in local time");
  await page.waitForTimeout(3400);
  await caption(page, "");
  await smoothScrollTo(page, "#credential", 2600);
  await caption(page, "A numbered, personal membership");
  await circleOver(page, page.locator(".tilt").first(), 3.2);
  await caption(page, "");
  await smoothScrollTo(page, "#command", 2200);
  await caption(page, "Behind every member, a team working from one system");
  await page.waitForTimeout(1800);
  await smoothScrollTo(page, "#command [data-reveal]:nth-of-type(2)", 1800);
  await page.waitForTimeout(3000);
  await caption(page, "");
  await smoothScrollTo(page, document_bottom, 3200);
  await page.mouse.move(500, 300, { steps: 40 });
  await page.waitForTimeout(3600);

  // 2. Member sends a request
  await signIn(page, "member");
  await caption(page, "Member home — greeted in their own time zone");
  await page.waitForTimeout(2400);
  const composer = page.getByLabel(/What can we arrange/);
  await clickLike(page, composer);
  await caption(page, "Write the way you would to someone who knows you — the orb listens");
  await composer.pressSequentially(brief, { delay: 55 });
  await page.waitForTimeout(500);
  await clickLike(page, page.getByRole("button", { name: "Send to concierge" }));
  await page.waitForURL(/\/app\/concierge\/.+/);
  await caption(page, "Received. A person has it — and the member can see exactly where it stands");
  await page.waitForTimeout(4400);

  // 3. ⌘K to a journey
  await caption(page, "⌘K — jump anywhere");
  await page.keyboard.press("Control+k");
  await page.waitForTimeout(600);
  await page.keyboard.type("Paris", { delay: 110 });
  await page.waitForTimeout(700);
  await page.keyboard.press("Enter");
  await page.waitForURL(/\/app\/journeys\/.+/);
  await page.waitForLoadState("networkidle");
  await caption(page, "Each journey opens on its destination and route");
  await page.waitForTimeout(2800);
  await smoothScrollTo(page, 700, 2400);
  await caption(page, "Flights, cars, rooms and tables — confirmed only when they are");
  await page.waitForTimeout(2600);

  // 4. Membership credential
  await page.goto(`${BASE}/app/membership`, { waitUntil: "networkidle" });
  await caption(page, "The membership credential");
  await circleOver(page, page.locator(".tilt").first(), 3);
  await caption(page, "");

  // 5. Concierge side
  await signIn(page, "concierge");
  await caption(page, "Biluxr Command — a queue ordered by what is due");
  await page.waitForTimeout(2600);
  await caption(page, "Keyboard-first: j / k to move, Enter to open");
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press("j");
    await page.waitForTimeout(450);
  }
  await page.waitForTimeout(600);
  const req = page.getByRole("link", { name: /Two seats at the ballet/ }).first();
  await clickLike(page, req);
  await page.waitForURL(/\/command\/requests\/.+/);
  await page.waitForLoadState("networkidle");
  for (let i = 0; i < 10 && !(await page.getByText(/Awaiting review/).count()); i++) {
    await page.waitForTimeout(700);
    await page.reload({ waitUntil: "networkidle" });
  }
  await caption(page, "Biluxr AI reads the request. A person decides what to use.");
  const ai = page.getByRole("button", { name: "Apply selected" });
  await ai.scrollIntoViewIfNeeded();
  await page.waitForTimeout(2800);
  await clickLike(page, ai);
  await page.waitForTimeout(1600);

  await caption(page, "Options are drafted, then presented");
  await smoothScrollTo(page, 0, 900);
  await clickLike(page, page.getByRole("button", { name: "New option" }));
  const sheet = page.getByRole("dialog", { name: "New option" });
  await sheet
    .getByLabel("Title")
    .pressSequentially("Orchestra, row C, on the aisle", { delay: 30 });
  await sheet
    .getByLabel("Why this")
    .pressSequentially(
      "Close enough to see the dancers breathe; the aisle makes an easy exit at the interval.",
      { delay: 16 },
    );
  await sheet.getByLabel("Price").pressSequentially("480", { delay: 60 });
  await page.waitForTimeout(500);
  await clickLike(page, sheet.getByRole("button", { name: "Save option" }));
  await page.waitForTimeout(1800);

  await caption(page, "Internal notes stay internal — enforced by the database");
  const internal = page.getByRole("radio", { name: "Internal note" });
  await clickLike(page, internal);
  await page
    .getByLabel("Internal note")
    .pressSequentially("First ballet for Sofia (10). Ask the box office about a backstage hello.", {
      delay: 22,
    });
  await clickLike(page, page.getByRole("button", { name: "Add note" }));
  await page.waitForTimeout(2200);

  await caption(page, "⌘K — every member, request and provider");
  await page.keyboard.press("Control+k");
  await page.waitForTimeout(500);
  await page.keyboard.type("Elena", { delay: 110 });
  await page.waitForTimeout(800);
  await page.keyboard.press("Enter");
  await page.waitForURL(/\/command\/members\/.+/);
  await page.waitForLoadState("networkidle");
  await caption(page, "Member 360 — preferences, people, requests, journeys");
  await page.waitForTimeout(2400);
  await smoothScrollTo(page, 500, 2200);
  await page.waitForTimeout(1400);

  // 6. Member chooses
  await signIn(page, "member");
  await page.goto(`${BASE}/app/concierge`, { waitUntil: "networkidle" });
  await clickLike(page, page.getByRole("link", { name: /Two seats at the ballet/ }).first());
  await page.waitForURL(/\/app\/concierge\/.+/);
  await page.waitForLoadState("networkidle");
  await caption(page, "The member sees the option — never the internal note");
  await page.waitForTimeout(2600);
  await clickLike(page, page.getByRole("button", { name: "Choose this" }));
  await page.waitForTimeout(1200);
  await caption(page, "Chosen — and shown as “being secured” until the provider confirms");
  await page.waitForTimeout(3600);

  await page.goto(BASE, { waitUntil: "networkidle" });
  await caption(page, "Biluxr. Consider it handled.");
  await page.waitForTimeout(4200);
}

/* ------------------------------- Mobile tour ------------------------------ */

async function mobileTour(page) {
  await page.goto(BASE, { waitUntil: "networkidle" });
  await caption(page, "Biluxr on a phone");
  await page.waitForTimeout(4600);
  await caption(page, "");
  await smoothScrollTo(page, "#instrument", 2600);
  await smoothScrollTo(page, "#instrument [aria-hidden='true'].liquid-glass", 1400);
  await page.waitForTimeout(8500);
  const chapters = "section[aria-label='A year with Biluxr']";
  await smoothScrollTo(page, chapters, 1800);
  await smoothScrollTo(
    page,
    await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      return el.getBoundingClientRect().bottom + scrollY - innerHeight;
    }, chapters),
    11000,
  );
  await smoothScrollTo(page, "#product", 2000);
  await page.waitForTimeout(1600);
  await signIn(page, "member");
  await caption(page, "Member home");
  await page.waitForTimeout(1600);
  const composer = page.getByLabel(/What can we arrange/);
  await composer.tap();
  await composer.pressSequentially("A table for two tonight, somewhere quiet", { delay: 60 });
  await page.waitForTimeout(1600);
  await composer.fill("");
  await page.locator("h1").first().tap();
  await page.waitForTimeout(800);
  await smoothScrollTo(page, 900, 2400);
  await page.waitForTimeout(1200);
  await smoothScrollTo(page, 0, 1200);
  const nav = page.getByRole("navigation", { name: "Member" }).last();
  await caption(page, "Journeys");
  await nav.getByRole("link", { name: "Journeys" }).tap();
  await page.waitForURL(/\/app\/journeys$/);
  await page.waitForTimeout(1600);
  await page
    .getByRole("link", { name: /Paris, autumn/ })
    .first()
    .tap();
  await page.waitForURL(/\/app\/journeys\/.+/);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2600);
  await smoothScrollTo(page, 800, 2600);
  await page.waitForTimeout(1600);
  await caption(page, "Membership");
  await page.goto(`${BASE}/app/membership`, { waitUntil: "networkidle" });
  await page.waitForTimeout(3000);
  await caption(page, "Biluxr. Consider it handled.");
  await page.waitForTimeout(2400);
}

if (which === "desktop" || which === "all") {
  await record(
    "desktop",
    { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
    desktopTour,
  );
}
if (which === "mobile" || which === "all") {
  await record(
    "mobile",
    { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
    mobileTour,
  );
}
