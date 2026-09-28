import { existsSync } from "node:fs";
import { defineConfig } from "@playwright/test";

const chromium =
  process.env.CHROMIUM_PATH ??
  (existsSync("/opt/pw-browsers/chromium") ? "/opt/pw-browsers/chromium" : undefined);
const port = Number(process.env.E2E_PORT ?? 3100);

/**
 * End-to-end tests run against a production build in DEMO mode (fictional
 * fixtures, in-memory store). Build first: `npm run build`.
 */
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${port}`,
    launchOptions: chromium ? { executablePath: chromium } : {},
    reducedMotion: "reduce",
  },
  webServer: {
    command: `npx next start -p ${port}`,
    port,
    reuseExistingServer: false,
    env: { BILUXR_DEMO_MODE: "true", NEXT_PUBLIC_SITE_URL: `http://localhost:${port}` },
    timeout: 60_000,
  },
});
