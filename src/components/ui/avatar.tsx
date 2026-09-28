import { cn } from "@/lib/cn";

/**
 * Initials only — we do not show photographs of staff or members. The ring
 * marks the member's own concierge. No presence indicator: we do not claim
 * anyone is "online" without presence infrastructure.
 */
export function ConciergeAvatar({
  initials,
  size = "md",
  ring = false,
  className,
}: {
  initials: string;
  size?: "sm" | "md" | "lg";
  ring?: boolean;
  className?: string;
}) {
  const sizes = {
    sm: "size-7 text-[0.625rem]",
    md: "size-10 text-caption",
    lg: "size-14 text-body-sm",
  };
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-ink-750 font-medium tracking-[0.08em] text-bone-200 select-none",
        ring
          ? "shadow-[0_0_0_1px_var(--color-ink-950),0_0_0_2px_var(--color-sable-500)]"
          : "shadow-[inset_0_0_0_1px_var(--line)]",
        sizes[size],
        className,
      )}
    >
      {initials}
    </span>
  );
}
