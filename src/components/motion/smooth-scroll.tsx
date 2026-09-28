"use client";

import Lenis from "lenis";
import { useEffect } from "react";

/**
 * Inertial wheel scrolling for the public site. Native scrolling is kept for
 * touch, keyboard and assistive technology; nothing is initialised under
 * reduced motion. Elements marked `data-lenis-prevent` keep native scrolling.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const lenis = new Lenis({
      autoRaf: true,
      lerp: 0.09,
      wheelMultiplier: 0.9,
      anchors: true,
      stopInertiaOnNavigate: true,
    });
    return () => lenis.destroy();
  }, []);
  return null;
}
