"use client";

import { useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import { ShaderCanvas, type SetUniform } from "./shader-canvas";
import { SILK_FRAGMENT } from "./shaders";

const TINTS = {
  /** Warm lamp on dark cloth. */
  sable: [0.86, 0.78, 0.64],
  /** Neutral pearl. */
  pearl: [0.9, 0.9, 0.9],
  /** Blue hour. */
  tide: [0.62, 0.7, 0.84],
} as const;

/**
 * Liquid silk backdrop: dark cloth folding slowly under a single lamp that
 * leans gently toward the pointer. Rendered at reduced resolution (it is soft
 * by nature) and capped at 30fps. Falls back to a still gradient.
 */
export function LiquidSilk({
  className,
  tint = "sable",
  intensity = 1,
  base = [0.03, 0.03, 0.036],
}: {
  className?: string;
  tint?: keyof typeof TINTS;
  intensity?: number;
  base?: [number, number, number];
}) {
  const pointer = useRef({ x: 0.5, y: 0.4, tx: 0.5, ty: 0.4 });

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      pointer.current.tx = e.clientX / window.innerWidth;
      pointer.current.ty = e.clientY / window.innerHeight;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  const [tr, tg, tb] = TINTS[tint];
  const [br, bg, bb] = base;
  const onFrame = useCallback(
    (set: SetUniform, { dt }: { dt: number }) => {
      const p = pointer.current;
      p.x += (p.tx - p.x) * Math.min(dt * 1.2, 1);
      p.y += (p.ty - p.y) * Math.min(dt * 1.2, 1);
      set("uPointer", p.x, p.y);
      set("uIntensity", intensity);
      set("uTint", tr, tg, tb);
      set("uBase", br, bg, bb);
    },
    [intensity, tr, tg, tb, br, bg, bb],
  );

  return (
    <ShaderCanvas
      className={cn("overflow-hidden", className)}
      fragment={SILK_FRAGMENT}
      onFrame={onFrame}
      renderScale={0.5}
      maxDpr={1.5}
      fps={30}
      fallback={
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_30%_20%,rgb(215_198_165/0.08),transparent_70%),radial-gradient(ellipse_60%_50%_at_80%_80%,rgb(143_160_182/0.06),transparent_70%)]" />
      }
    />
  );
}
