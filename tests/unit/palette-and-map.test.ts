import { describe, expect, it } from "vitest";
import { PLACES, arcPath, framePlaces, placeForMarket, project } from "@/components/geo/world-map";
import { score } from "@/components/ui/command-palette";

describe("palette matching", () => {
  it("prefers direct and word-start matches", () => {
    expect(score("elena", "Elena Voss")).toBeGreaterThan(score("elena", "Chalet near Elena"));
    expect(score("voss", "Elena Voss")).toBeGreaterThan(0);
  });
  it("matches subsequences and rejects non-matches", () => {
    expect(score("dfs", "Dinner for six")).toBeGreaterThan(0);
    expect(score("xyz", "Dinner for six")).toBe(-1);
    expect(score("", "anything")).toBe(0);
  });
});

describe("world map geometry", () => {
  it("projects west to east and north to south", () => {
    const [mx, my] = project(PLACES.miami);
    const [px, py] = project(PLACES.paris);
    expect(mx).toBeLessThan(px);
    expect(py).toBeLessThan(my);
  });
  it("frames every requested place", () => {
    const [x, y, w, h] = framePlaces([PLACES.miami, PLACES.aspen], 3).split(" ").map(Number) as [
      number,
      number,
      number,
      number,
    ];
    for (const p of [PLACES.miami, PLACES.aspen]) {
      const [px, py] = project(p);
      expect(px).toBeGreaterThan(x);
      expect(px).toBeLessThan(x + w);
      expect(py).toBeGreaterThan(y);
      expect(py).toBeLessThan(y + h);
    }
    expect(w / h).toBeCloseTo(3, 1);
  });
  it("maps configured market slugs to places and builds arcs", () => {
    expect(placeForMarket("st-barts")?.name).toBe("St. Barts");
    expect(placeForMarket("atlantis")).toBeNull();
    expect(arcPath(PLACES.miami, PLACES.paris)).toMatch(/^M[\d.]+ [\d.]+ Q/);
  });
});
