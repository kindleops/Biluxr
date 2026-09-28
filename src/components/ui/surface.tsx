import type { ComponentProps, ElementType, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Elevation = "flat" | "raised" | "float";

const elevations: Record<Elevation, string> = {
  flat: "bg-ink-900 shadow-[inset_0_0_0_1px_var(--line-subtle)]",
  raised: "bg-ink-850 shadow-[inset_0_0_0_1px_var(--line-subtle),var(--shadow-lift)]",
  float: "bg-ink-800 shadow-[inset_0_0_0_1px_var(--line),var(--shadow-float)]",
};

export function Surface<T extends ElementType = "div">({
  as,
  elevation = "flat",
  className,
  children,
  ...rest
}: {
  as?: T;
  elevation?: Elevation;
  className?: string;
  children?: ReactNode;
} & Omit<ComponentProps<T>, "as" | "className" | "children">) {
  const Tag = (as ?? "div") as ElementType;
  return (
    <Tag className={cn("rounded-card", elevations[elevation], className)} {...rest}>
      {children}
    </Tag>
  );
}

/** Frosted surface for elements that float above content (nav, composer, sheets). */
export function GlassSurface({
  className,
  strong = false,
  children,
  ...rest
}: ComponentProps<"div"> & { strong?: boolean }) {
  return (
    <div
      className={cn(
        "glass rounded-card",
        strong && "[background:var(--glass-fill-strong)]",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

/** Light editorial surface used on the public site. */
export function PaperSurface({ className, children, ...rest }: ComponentProps<"section">) {
  return (
    <section
      data-surface="paper"
      className={cn("bg-paper-100 text-ink-900 [color-scheme:light]", className)}
      {...rest}
    >
      {children}
    </section>
  );
}
