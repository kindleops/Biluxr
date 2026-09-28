import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "quiet" | "danger";
type Size = "sm" | "md" | "lg";
type Tone = "dark" | "paper";

const base =
  "group/btn relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap font-sans font-medium tracking-[0.01em] transition-[background-color,color,box-shadow,opacity,transform] duration-quick ease-considered active:translate-y-px disabled:pointer-events-none disabled:opacity-40 aria-disabled:pointer-events-none aria-disabled:opacity-40";

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-body-sm rounded-sm",
  md: "h-11 px-5 text-body-sm rounded-md",
  lg: "h-13 px-7 text-body rounded-md",
};

const variants: Record<Tone, Record<Variant, string>> = {
  dark: {
    primary: "bg-bone-100 text-ink-950 hover:bg-bone-50 shadow-[0_0_0_1px_rgb(255_255_255/0.2)]",
    secondary:
      "bg-transparent text-bone-100 shadow-[inset_0_0_0_1px_var(--line-strong)] hover:bg-white/[0.04] hover:shadow-[inset_0_0_0_1px_rgb(255_255_255/0.3)]",
    ghost: "bg-transparent text-bone-200 hover:bg-white/[0.05] hover:text-bone-50",
    quiet:
      "bg-transparent text-bone-200 underline decoration-white/25 underline-offset-[6px] hover:text-bone-50 hover:decoration-white/60",
    danger:
      "bg-transparent text-status-clay shadow-[inset_0_0_0_1px_rgb(196_138_126/0.4)] hover:bg-status-clay/10",
  },
  paper: {
    primary: "bg-ink-900 text-paper-50 hover:bg-ink-800",
    secondary:
      "bg-transparent text-ink-900 shadow-[inset_0_0_0_1px_var(--line-paper-strong)] hover:bg-black/[0.03]",
    ghost: "bg-transparent text-ink-800 hover:bg-black/[0.04]",
    quiet:
      "bg-transparent text-ink-900 underline decoration-black/25 underline-offset-[6px] hover:decoration-black/60",
    danger: "bg-transparent text-[#8c4a3e] shadow-[inset_0_0_0_1px_rgb(140_74_62/0.35)]",
  },
};

export interface ButtonStyleProps {
  variant?: Variant;
  size?: Size;
  tone?: Tone;
  className?: string;
}

export function buttonStyles({ variant = "primary", size = "md", tone = "dark", className }: ButtonStyleProps = {}) {
  const sizing = variant === "quiet" ? "text-body-sm" : sizes[size];
  return cn(base, sizing, variants[tone][variant], className);
}

function Spinner() {
  return (
    <span
      aria-hidden
      className="inline-block size-3.5 animate-spin rounded-full border border-current border-t-transparent opacity-70"
    />
  );
}

export type ButtonProps = ComponentProps<"button"> &
  ButtonStyleProps & {
    pending?: boolean;
    pendingLabel?: string;
    trailing?: ReactNode;
  };

export function Button({
  variant,
  size,
  tone,
  className,
  pending = false,
  pendingLabel,
  trailing,
  children,
  disabled,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonStyles({ variant, size, tone, className })}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      {...rest}
    >
      {pending && <Spinner />}
      <span>{pending && pendingLabel ? pendingLabel : children}</span>
      {trailing}
    </button>
  );
}

export type LinkButtonProps = Omit<ComponentProps<typeof Link>, "className"> &
  ButtonStyleProps & { trailing?: ReactNode };

export function LinkButton({ variant, size, tone, className, trailing, children, ...rest }: LinkButtonProps) {
  return (
    <Link className={buttonStyles({ variant, size, tone, className })} {...rest}>
      <span>{children}</span>
      {trailing}
    </Link>
  );
}

/** A thin arrow that nudges on hover — the only decorative flourish buttons get. */
export function Arrow({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden
      className={cn(
        "size-3.5 transition-transform duration-base ease-settle group-hover/btn:translate-x-0.5",
        className,
      )}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
    >
      <path d="M2 8h11M9 4l4 4-4 4" />
    </svg>
  );
}
