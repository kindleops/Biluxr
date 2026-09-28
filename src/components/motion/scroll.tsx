"use client";

import {
  useEffect,
  useRef,
  type CSSProperties,
  type ElementType,
  type ReactNode,
  type RefObject,
} from "react";

type Mode = "through" | "pin";
interface Entry {
  el: HTMLElement;
  mode: Mode;
  active: boolean;
  seen: boolean;
  cb?: (progress: number) => void;
}

/*
 * One scroll listener and one rAF for every scroll-linked element on the page.
 * Each entry is measured only while it is near the viewport.
 */
const entries = new Set<Entry>();
let scheduled = false;
let listening = false;

function measure() {
  scheduled = false;
  const vh = window.innerHeight;
  for (const e of entries) {
    if (!e.active) continue;
    const r = e.el.getBoundingClientRect();
    if (!e.seen) {
      // Measured here rather than via IntersectionObserver ratios: Chromium
      // applies the element's own clip-path, which a wipe starts fully closed.
      const shown = Math.min(r.bottom, vh) - Math.max(r.top, 0);
      if (shown > Math.min(r.height, vh) * 0.12) {
        e.seen = true;
        e.el.dataset.visible = "true";
      }
    }
    let p: number;
    if (e.mode === "pin") {
      const span = r.height - vh;
      p = span > 0 ? -r.top / span : 0;
    } else {
      p = (vh - r.top) / (vh + r.height);
    }
    p = Math.min(1, Math.max(0, p));
    e.el.style.setProperty("--progress", p.toFixed(4));
    e.cb?.(p);
  }
}

function schedule() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(measure);
}

function register(entry: Entry) {
  entries.add(entry);
  if (!listening) {
    listening = true;
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
  }
  schedule();
  return () => {
    entries.delete(entry);
    if (entries.size === 0 && listening) {
      listening = false;
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    }
  };
}

/**
 * Writes `--progress` (0→1) onto the element as it scrolls: `through` runs from
 * the element's top entering the viewport to its bottom leaving; `pin` runs
 * across a tall element whose sticky child fills the viewport. Also marks the
 * element `data-visible` the first time it is seen (for wipes and line reveals).
 */
export function useScrollProgress(
  ref: RefObject<HTMLElement | null>,
  mode: Mode = "through",
  onProgress?: (progress: number) => void,
) {
  const cbRef = useRef(onProgress);
  useEffect(() => {
    cbRef.current = onProgress;
  }, [onProgress]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const entry: Entry = { el, mode, active: true, seen: false, cb: (p) => cbRef.current?.(p) };
    const unregister = register(entry);
    const io = new IntersectionObserver(
      ([e]) => {
        entry.active = !!e?.isIntersecting;
        if (entry.active) schedule();
      },
      { rootMargin: "10% 0px" },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      unregister();
    };
  }, [ref, mode]);
}

/** A block that exposes its scroll progress to CSS as `--progress`. */
export function ScrollScene({
  as,
  children,
  className,
  style,
  mode = "through",
  ...rest
}: {
  as?: ElementType;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  mode?: Mode;
} & Record<`data-${string}`, string | boolean | undefined>) {
  const ref = useRef<HTMLElement>(null);
  useScrollProgress(ref, mode);
  const Tag = (as ?? "div") as ElementType;
  return (
    <Tag ref={ref} className={className} style={style} {...rest}>
      {children}
    </Tag>
  );
}
