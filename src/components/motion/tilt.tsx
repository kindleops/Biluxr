"use client";

import { useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Pointer-tracked tilt with a moving specular highlight — the feel of a real
 * object under light. Pure transforms (GPU), no re-renders; inert for touch
 * and reduced motion.
 */
export function TiltSurface({
  children,
  className,
  max = 9,
}: {
  children: ReactNode;
  className?: string;
  max?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef<number | null>(null);

  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "mouse") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    if (frame.current) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      el.style.setProperty("--rx", `${((0.5 - py) * max).toFixed(2)}deg`);
      el.style.setProperty("--ry", `${((px - 0.5) * max * 1.2).toFixed(2)}deg`);
      el.style.setProperty("--lx", `${(px * 100).toFixed(1)}%`);
      el.style.setProperty("--ly", `${(py * 100).toFixed(1)}%`);
      el.style.setProperty("--glare", "1");
    });
  }

  function onLeave() {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--glare", "0");
  }

  return (
    <div className={cn("[perspective:1400px]", className)}>
      <div
        ref={ref}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        className="tilt relative [transform-style:preserve-3d]"
      >
        {children}
        <div
          aria-hidden
          className="tilt-glare pointer-events-none absolute inset-0 rounded-[inherit]"
        />
      </div>
    </div>
  );
}
