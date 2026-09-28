import { cn } from "@/lib/cn";
import type { StatusTone } from "@/lib/domain/requests";

const toneDot: Record<StatusTone, string> = {
  neutral: "bg-bone-300",
  active: "bg-status-tide",
  attention: "bg-status-amber",
  positive: "bg-status-moss",
  muted: "bg-bone-600",
  negative: "bg-status-clay",
};

const toneText: Record<StatusTone, string> = {
  neutral: "text-bone-200",
  active: "text-bone-200",
  attention: "text-status-amber",
  positive: "text-status-moss",
  muted: "text-bone-400",
  negative: "text-status-clay",
};

/**
 * Status is a dot and a word — never a filled pill. Attention states pulse
 * once on mount, then hold still.
 */
export function StatusPill({
  tone,
  children,
  className,
}: {
  tone: StatusTone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-caption font-medium tracking-[0.02em]", toneText[tone], className)}>
      <span className="relative inline-flex size-1.5">
        {tone === "attention" && (
          <span className={cn("absolute inset-0 rounded-full opacity-60 motion-safe:animate-ping [animation-iteration-count:2]", toneDot[tone])} />
        )}
        <span className={cn("relative inline-flex size-1.5 rounded-full", toneDot[tone])} />
      </span>
      {children}
    </span>
  );
}

export function Tag({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-xs px-2 text-micro font-medium uppercase tracking-[0.12em] text-bone-300 shadow-[inset_0_0_0_1px_var(--line)]",
        className,
      )}
    >
      {children}
    </span>
  );
}
