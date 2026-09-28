"use client";

import { useEffect, useRef, type CSSProperties, type ElementType, type ReactNode } from "react";

/**
 * Scroll-triggered entrance. Content is fully visible without JavaScript and
 * under reduced motion; the hidden start state applies only once the
 * `html.js` class is present (set by an inline script in the root layout).
 */
export function Reveal({
  as,
  children,
  className,
  delay = 0,
  distance = 28,
  style,
}: {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  delay?: number;
  distance?: number;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            el.dataset.visible = "true";
            io.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const Tag = (as ?? "div") as ElementType;
  return (
    <Tag
      ref={ref}
      data-reveal
      className={className}
      style={{
        ...style,
        ["--reveal-delay" as string]: `${delay}ms`,
        ["--reveal-distance" as string]: `${distance}px`,
      }}
    >
      {children}
    </Tag>
  );
}
