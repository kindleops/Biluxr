import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { duration, easing, radius, zIndex } from "@/lib/design/tokens";

const css = readFileSync(path.join(process.cwd(), "src/app/globals.css"), "utf8");
const value = (name: string) => css.match(new RegExp(`--${name}:\\s*([^;]+);`))?.[1]?.trim();

describe("design tokens", () => {
  it("keeps motion durations in sync with CSS", () => {
    for (const [k, v] of Object.entries(duration)) expect(value(`duration-${k}`)).toBe(`${v}ms`);
  });
  it("keeps easing curves in sync with CSS", () => {
    for (const [k, v] of Object.entries(easing)) expect(value(`ease-${k}`)).toBe(v);
  });
  it("keeps the z-index scale in sync with CSS", () => {
    for (const [k, v] of Object.entries(zIndex)) expect(value(`z-${k}`)).toBe(String(v));
  });
  it("keeps radii in sync with CSS", () => {
    for (const [k, v] of Object.entries(radius)) expect(value(`radius-${k}`)).toBe(`${v}px`);
  });
});
