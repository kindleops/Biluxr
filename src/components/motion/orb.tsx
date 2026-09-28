"use client";

import { useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import { ShaderCanvas, type FrameInfo, type SetUniform } from "./shader-canvas";
import { ORB_FRAGMENT } from "./shaders";

export type OrbState = "idle" | "listening" | "thinking" | "sent";

const ENERGY: Record<OrbState, number> = {
  idle: 0.12,
  listening: 0.42,
  thinking: 0.85,
  sent: 0.3,
};

/**
 * Biluxr's orb — the visible sign that a message is being read, never a claim
 * that someone is present. It breathes while idle, gathers and swirls as a
 * member writes (`activity` changes on each keystroke), turns faster while a
 * request is being sent, and releases a single ring when it has gone.
 * Decorative: always aria-hidden; the surrounding UI carries the meaning.
 */
export function BiluxrOrb({
  state = "idle",
  activity = 0,
  className,
  halo = 1,
  announce = false,
}: {
  state?: OrbState;
  /** Any value that changes as the member types (e.g. text length). */
  activity?: number;
  className?: string;
  /** Halo strength, 0–1. */
  halo?: number;
  /** Release a ring as soon as it appears (e.g. on arriving at a new request). */
  announce?: boolean;
}) {
  const sim = useRef({ energy: ENERGY.idle, kick: 0, phase: 0, ring: announce ? 0.001 : 0 });
  const target = useRef(state);
  const haloRef = useRef(halo);

  useEffect(() => {
    if (state === "sent" && target.current !== "sent") sim.current.ring = 0.001;
    target.current = state;
  }, [state]);

  useEffect(() => {
    haloRef.current = halo;
  }, [halo]);

  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    sim.current.kick = Math.min(sim.current.kick + 0.22, 0.6);
  }, [activity]);

  const onFrame = useCallback((set: SetUniform, { dt, reducedMotion }: FrameInfo) => {
    const s = sim.current;
    const goal = ENERGY[target.current] + s.kick;
    s.energy += (goal - s.energy) * Math.min(dt * 3.2, 1);
    s.kick *= Math.exp(-dt * 2.4);
    if (!reducedMotion) s.phase += dt * (0.22 + s.energy * 1.7);
    if (s.ring > 0) {
      s.ring += dt / 1.5;
      if (s.ring >= 1) s.ring = 0;
    }
    set("uEnergy", Math.min(s.energy, 1));
    set("uPhase", s.phase);
    set("uRing", reducedMotion ? 0 : s.ring);
    set("uHalo", haloRef.current);
  }, []);

  return (
    <div aria-hidden className={cn("relative aspect-square", className)}>
      <ShaderCanvas
        fragment={ORB_FRAGMENT}
        onFrame={onFrame}
        maxDpr={2}
        fallback={<OrbGlyph className="absolute inset-[22%]" />}
      />
    </div>
  );
}

/**
 * A CSS-only orb for small sizes and as the WebGL fallback: layered light
 * turning slowly inside a pearl. No canvas, no JavaScript.
 */
export function OrbGlyph({ className, active = false }: { className?: string; active?: boolean }) {
  return (
    <span
      aria-hidden
      data-active={active || undefined}
      className={cn("orb-glyph relative inline-block aspect-square rounded-full", className)}
    >
      <span className="orb-glyph-flow absolute inset-0 rounded-full" />
      <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_32%_28%,rgb(255_255_255/0.85),rgb(255_255_255/0.12)_22%,transparent_46%)]" />
      <span className="absolute inset-0 rounded-full shadow-[inset_0_0_0_1px_rgb(255_255_255/0.22),inset_0_-6px_14px_-4px_rgb(0_0_0/0.55)]" />
    </span>
  );
}
