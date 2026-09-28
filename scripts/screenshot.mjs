#!/usr/bin/env node
/**
 * Visual review helper: captures pages at the reference viewports.
 *   node scripts/screenshot.mjs <outDir> <path>[,<path>...] [viewport,...] [--persona=member] [--full]
 */
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
import path from "node:path";

const VIEWPORTS = {
  d1440: { width: 1440, height: 900 },
  d1728: { width: 1728, height: 1117 },
  t1024: { width: 1024, height: 1366 },
  m390: { width: 390, height: 844 },
  m393: { width: 393, height: 852 },
  m430: { width: 430, height: 932 },
};

const [outDir, pathsArg, vpArg] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const flags = process.argv.filter((a) => a.startsWith("--"));
const persona = flags.find((f) => f.startsWith("--persona="))?.split("=")[1];
const full = flags.includes("--full");
const base = process.env.BASE_URL ?? "http://localhost:3000";
const paths = (pathsArg ?? "/").split(",");
const vps = (vpArg ?? "d1440,m390").split(",");
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium" });
for (const vp of vps) {
  const mobile = vp.startsWith("m");
  const context = await browser.newContext({
    viewport: VIEWPORTS[vp],
    deviceScaleFactor: 1,
    isMobile: mobile,
    hasTouch: mobile,
    reducedMotion: "reduce",
  });
  if (persona) {
    await context.addCookies([{ name: "biluxr_demo_persona", value: persona, url: base }]);
  }
  const page = await context.newPage();
  for (const p of paths) {
    await page.goto(base + p, { waitUntil: "networkidle" });
    await page.waitForTimeout(400);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    const name = `${vp}${p.replace(/[/?=&]+/g, "_") || "_home"}.png`;
    await page.screenshot({ path: path.join(outDir, name), fullPage: full });
    console.log(`${name}${overflow > 0 ? `  ⚠ horizontal overflow ${overflow}px` : ""}`);
  }
  await context.close();
}
await browser.close();
