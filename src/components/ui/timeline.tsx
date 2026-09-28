import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface TimelineEntry {
  id: string;
  title: ReactNode;
  meta?: ReactNode;
  body?: ReactNode;
  state?: "done" | "current" | "upcoming" | "tentative";
}

/** Vertical timeline with hairline spine. Used for request history and journeys. */
export function Timeline({ entries, className }: { entries: TimelineEntry[]; className?: string }) {
  return (
    <ol className={cn("relative", className)}>
      {entries.map((entry, i) => {
        const last = i === entries.length - 1;
        return (
          <li
            key={entry.id}
            className="relative grid grid-cols-[1.25rem_1fr] gap-x-4 pb-7 last:pb-0"
          >
            {!last && (
              <span
                aria-hidden
                className="absolute top-3 bottom-0 left-[0.59rem] w-px bg-white/10"
              />
            )}
            <span aria-hidden className="relative mt-1.5 flex size-5 items-start justify-center">
              <span
                className={cn(
                  "block size-2 rounded-full",
                  entry.state === "current" &&
                    "bg-bone-100 shadow-[0_0_0_4px_rgb(243_239_232/0.1)]",
                  entry.state === "done" && "bg-bone-400",
                  entry.state === "tentative" &&
                    "border border-dashed border-bone-400 bg-transparent",
                  (!entry.state || entry.state === "upcoming") &&
                    "border border-bone-500 bg-ink-950",
                )}
              />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <div className="text-body-sm font-medium text-bone-100">{entry.title}</div>
                {entry.meta && <div className="text-caption text-bone-500">{entry.meta}</div>}
              </div>
              {entry.body && <div className="mt-1 text-body-sm text-bone-400">{entry.body}</div>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
