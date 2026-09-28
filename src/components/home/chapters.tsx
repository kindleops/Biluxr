"use client";

import Image from "next/image";
import { useCallback, useRef } from "react";
import { useScrollProgress } from "@/components/motion/scroll";

const CHAPTERS = [
  {
    src: "/images/window.jpg",
    alt: "An aircraft wing above a field of cloud, seen from a window seat at dawn.",
    label: "In transit",
    line: "Somewhere above the weather, the car is already waiting.",
    position: "50% 50%",
  },
  {
    src: "/images/suite.jpg",
    alt: "A quiet hotel suite at first light, linen curtains moving over a city view.",
    label: "Stays",
    line: "The room is ready before you think to ask.",
    position: "62% 50%",
  },
  {
    src: "/images/table.jpg",
    alt: "A hand placing a handwritten name card beside a candle on a linen tablecloth.",
    label: "Tables",
    line: "Every name at the table, spelled correctly.",
    position: "50% 60%",
  },
  {
    src: "/images/paris.jpg",
    alt: "A Paris street at night after rain, a single figure under an umbrella.",
    label: "Evenings",
    line: "The city after rain, with nothing left to chase.",
    position: "60% 55%",
  },
  {
    src: "/images/chalet.jpg",
    alt: "A snow-covered chalet at dusk, its windows lit, mountains behind.",
    label: "Seasons",
    line: "The house in the mountains, warm when you arrive.",
    position: "50% 60%",
  },
] as const;

const N = CHAPTERS.length;

/**
 * A pinned sequence: the frame holds still while a year passes through it.
 * Photographs crossfade and settle as you scroll; each line rises in with
 * its image. Scroll position is the only clock — nothing plays on its own.
 */
export function Chapters() {
  const sectionRef = useRef<HTMLElement>(null);
  const layers = useRef<(HTMLDivElement | null)[]>([]);
  const lines = useRef<(HTMLDivElement | null)[]>([]);
  const bar = useRef<HTMLSpanElement>(null);
  const counter = useRef<HTMLSpanElement>(null);

  const onProgress = useCallback((p: number) => {
    const pos = p * N;
    let dominant = 0;
    let best = -1;
    for (let i = 0; i < N; i++) {
      const local = pos - i;
      // Visible across its segment, crossfading over the final 35% into the next.
      const fadeIn = i === 0 ? 1 : clamp((local + 0.35) / 0.35);
      const fadeOut = i === N - 1 ? 1 : clamp((1 - local) / 0.35);
      const opacity = Math.min(fadeIn, fadeOut);
      if (opacity > best) {
        best = opacity;
        dominant = i;
      }
      const layer = layers.current[i];
      if (layer) {
        layer.style.opacity = opacity.toFixed(3);
        const zoom = 1.14 - 0.12 * clamp((local + 0.35) / 1.35);
        layer.style.transform = `scale(${zoom.toFixed(4)})`;
      }
      const line = lines.current[i];
      if (line) {
        const t =
          i === 0 && local < 0
            ? 1
            : Math.min(clamp((local + 0.15) / 0.3), i === N - 1 ? 1 : clamp((0.88 - local) / 0.22));
        line.style.opacity = t.toFixed(3);
        line.style.transform = `translate3d(0, ${((1 - t) * 28).toFixed(1)}px, 0)`;
        line.style.filter = `blur(${((1 - t) * 8).toFixed(1)}px)`;
        line.style.visibility = t < 0.01 ? "hidden" : "visible";
      }
    }
    if (bar.current) bar.current.style.transform = `scaleX(${p.toFixed(4)})`;
    if (counter.current) counter.current.textContent = String(dominant + 1).padStart(2, "0");
  }, []);

  useScrollProgress(sectionRef, "pin", onProgress);

  return (
    <section
      ref={sectionRef}
      aria-label="A year with Biluxr"
      className="relative bg-ink-950"
      style={{ height: `${N * 90 + 40}svh` }}
    >
      <div className="sticky top-0 h-svh overflow-hidden">
        {CHAPTERS.map((c, i) => (
          <div
            key={c.src}
            ref={(el) => {
              layers.current[i] = el;
            }}
            className="absolute inset-0 will-change-[opacity,transform]"
            style={{ opacity: i === 0 ? 1 : 0, transform: "scale(1.14)" }}
          >
            <Image
              src={c.src}
              alt={c.alt}
              fill
              sizes="100vw"
              className="object-cover brightness-[0.7] contrast-[1.06]"
              style={{ objectPosition: c.position }}
            />
          </div>
        ))}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgb(8_8_10/0.92)_0%,rgb(8_8_10/0.35)_45%,rgb(8_8_10/0.1)_70%,rgb(8_8_10/0.55)_100%)]"
        />
        <div className="page-gutter content-max relative flex h-full flex-col justify-end pb-14 sm:pb-20">
          <div className="relative min-h-[12rem] sm:min-h-[14rem]">
            {CHAPTERS.map((c, i) => (
              <div
                key={c.label}
                ref={(el) => {
                  lines.current[i] = el;
                }}
                className="absolute inset-x-0 bottom-0"
                style={{ opacity: i === 0 ? 1 : 0, visibility: i === 0 ? "visible" : "hidden" }}
              >
                <p className="text-label text-bone-300">{c.label}</p>
                <p className="mt-5 max-w-[20ch] font-display text-display font-light tracking-[var(--tracking-editorial)] text-balance text-bone-50">
                  {c.line}
                </p>
              </div>
            ))}
          </div>
          <div
            aria-hidden
            className="mt-10 flex items-center gap-5 font-mono text-caption text-bone-400"
          >
            <span ref={counter} className="tabular-nums">
              01
            </span>
            <span className="relative h-px flex-1 bg-white/15 sm:max-w-xs">
              <span
                ref={bar}
                className="absolute inset-0 origin-left bg-bone-100"
                style={{ transform: "scaleX(0)" }}
              />
            </span>
            <span className="tabular-nums">{String(N).padStart(2, "0")}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function clamp(v: number) {
  return Math.min(1, Math.max(0, v));
}
