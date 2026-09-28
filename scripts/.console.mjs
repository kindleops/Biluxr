import { chromium } from "@playwright/test";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const p = await b.newPage();
p.on("console", (m) => {
  if (["error", "warning"].includes(m.type())) console.log(m.type(), m.text().slice(-1500));
});
p.on("pageerror", (e) => console.log("pageerror", e.message.slice(0, 600)));
await p.goto(process.argv[2] ?? "http://localhost:3000/", { waitUntil: "networkidle" });
await p.waitForTimeout(1500);
await b.close();
