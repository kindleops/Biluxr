import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { BiluxrMark } from "@/components/brand/logo";

/**
 * Empty states are part of the product, not a failure of it. Short, calm,
 * and honest about what will appear here.
 */
export function EmptyState({
  title,
  body,
  action,
  className,
  compact = false,
}: {
  title: string;
  body?: ReactNode;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "gap-2 px-6 py-10" : "gap-3 px-6 py-16 sm:py-20",
        className,
      )}
    >
      {!compact && <BiluxrMark decorative className="mb-3 size-9 text-bone-600" />}
      <p className="font-display text-title font-light text-bone-100">{title}</p>
      {body && <p className="max-w-sm text-body-sm text-pretty text-bone-400">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/** Rendered when a capability depends on an integration that is not configured. */
export function UnavailableState({
  title = "Not yet available",
  body,
  className,
}: {
  title?: string;
  body: ReactNode;
  className?: string;
}) {
  return (
    <div
      role="status"
      className={cn(
        "rounded-card px-6 py-8 text-center shadow-[inset_0_0_0_1px_var(--line)] [background:repeating-linear-gradient(135deg,transparent_0_10px,rgb(255_255_255/0.015)_10px_20px)]",
        className,
      )}
    >
      <p className="text-label text-bone-400">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-body-sm text-pretty text-bone-300">{body}</p>
    </div>
  );
}
