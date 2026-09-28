import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("text-label text-bone-400", className)}>{children}</p>;
}

type HeadingSize = "monument" | "display" | "headline" | "title";

const headingSizes: Record<HeadingSize, string> = {
  monument: "text-monument tracking-[var(--tracking-tight-display)]",
  display: "text-display tracking-[var(--tracking-tight-display)]",
  headline: "text-headline tracking-[var(--tracking-editorial)]",
  title: "text-title tracking-[-0.012em]",
};

/**
 * Editorial heading. Serif, light, balanced. Optional italic `accent` renders a
 * second voice within the line (used sparingly — once per page at most).
 */
export function EditorialHeading({
  as,
  size = "headline",
  children,
  className,
}: {
  as?: ElementType;
  size?: HeadingSize;
  children: ReactNode;
  className?: string;
}) {
  const Tag = (as ?? "h2") as ElementType;
  return (
    <Tag className={cn("font-display font-light text-balance", headingSizes[size], className)}>
      {children}
    </Tag>
  );
}

export function Accent({ children }: { children: ReactNode }) {
  return <em className="font-display font-light italic">{children}</em>;
}

export function Lede({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("text-lede text-pretty text-bone-300", className)}>{children}</p>;
}

export function Mono({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("font-mono text-[0.8em] tracking-[0.02em]", className)}>{children}</span>
  );
}
