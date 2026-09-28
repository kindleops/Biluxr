// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { Instrument } from "@/components/home/instrument";
import { BiluxrOrb, OrbGlyph } from "@/components/motion/orb";
import { SplitLines } from "@/components/motion/split-lines";

beforeAll(() => {
  // jsdom has no WebGL, IntersectionObserver or matchMedia.
  HTMLCanvasElement.prototype.getContext = vi.fn(() => null) as never;
  class IO {
    observe() {}
    disconnect() {}
    unobserve() {}
  }
  vi.stubGlobal("IntersectionObserver", IO);
  vi.stubGlobal("matchMedia", () => ({ matches: false }));
});

afterEach(cleanup);

describe("SplitLines", () => {
  it("keeps the heading as ordinary, readable text", () => {
    render(
      <h2>
        <SplitLines lines={["Request anything.", <em key="b">Biluxr coordinates the rest.</em>]} />
      </h2>,
    );
    expect(screen.getByRole("heading").textContent).toBe(
      "Request anything.Biluxr coordinates the rest.",
    );
  });
});

describe("Biluxr orb", () => {
  it("is decorative and falls back to CSS without WebGL", () => {
    const { container } = render(<BiluxrOrb state="listening" activity={3} />);
    const root = container.firstElementChild!;
    expect(root.getAttribute("aria-hidden")).toBe("true");
    expect(container.querySelector(".orb-glyph")).not.toBeNull();
  });

  it("glyph marks its active state for CSS only", () => {
    const { container } = render(<OrbGlyph active />);
    expect(container.querySelector("[data-active]")).not.toBeNull();
    expect(container.firstElementChild!.getAttribute("aria-hidden")).toBe("true");
  });
});

describe("Instrument", () => {
  it("describes its illustration to assistive tech and labels it illustrative", () => {
    render(<Instrument />);
    expect(screen.getByRole("heading", { name: /Request anything/ })).toBeTruthy();
    expect(screen.getByText(/Example: a member writes/)).toBeTruthy();
    expect(screen.getByText(/Illustrative\./)).toBeTruthy();
  });
});
