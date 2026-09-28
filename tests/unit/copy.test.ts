import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { destinationImage } from "@/lib/design/destinations";

const ROOT = path.resolve(import.meta.dirname, "../..");
const BANNED =
  /\b(elite|exclusive|billionaire|prestige|prestigious|luxury|luxurious|revolutionary|next-generation|ai-powered)\b/i;

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) return files(p);
    return /\.(tsx?|sql)$/.test(name) && !name.endsWith("database.types.ts") ? [p] : [];
  });
}

describe("copy system", () => {
  it("product copy never uses the banned words (docs/BRAND.md)", () => {
    const offenders = [...files(path.join(ROOT, "src")), path.join(ROOT, "supabase/seed.sql")]
      .flatMap((f) =>
        readFileSync(f, "utf8")
          .split("\n")
          .map((line, i) => ({ f, i, line }))
          .filter(({ line }) => BANNED.test(line)),
      )
      .map(({ f, i, line }) => `${path.relative(ROOT, f)}:${i + 1} ${line.trim()}`);
    expect(offenders).toEqual([]);
  });
});

describe("destination imagery", () => {
  it("maps known markets to local photographs and nothing else", () => {
    expect(destinationImage("paris")?.src).toBe("/images/paris.jpg");
    expect(destinationImage("aspen")?.src).toBe("/images/chalet.jpg");
    expect(destinationImage("miami")).toBeNull();
    expect(destinationImage(null)).toBeNull();
  });
});
