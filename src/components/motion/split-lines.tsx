import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Masked line reveal: each line rises out of its own mask, one after another.
 * `trigger="load"` plays on arrival (heroes); `trigger="view"` waits for an
 * ancestor to be marked `data-visible` (Reveal or ScrollScene). The text is
 * ordinary text in the DOM; without JavaScript or under reduced motion it is
 * simply shown.
 */
export function SplitLines({
  lines,
  trigger = "view",
  delay = 0,
  stagger = 110,
  className,
}: {
  lines: ReactNode[];
  trigger?: "load" | "view";
  delay?: number;
  stagger?: number;
  className?: string;
}) {
  return (
    <span className={cn("split-lines block", className)} data-split={trigger}>
      {lines.map((line, i) => (
        <span key={i} className="split-line block">
          <span
            className="split-inner block"
            style={{ ["--split-delay" as string]: `${delay + i * stagger}ms` }}
          >
            {line}
          </span>
        </span>
      ))}
    </span>
  );
}
