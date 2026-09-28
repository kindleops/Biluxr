import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "dark" | "paper";

const control: Record<Tone, string> = {
  dark: "bg-ink-900/60 text-bone-50 placeholder:text-bone-500 shadow-[inset_0_0_0_1px_var(--line)] hover:shadow-[inset_0_0_0_1px_var(--line-strong)] focus:shadow-[inset_0_0_0_1px_var(--color-bone-300)] aria-invalid:shadow-[inset_0_0_0_1px_var(--color-status-clay)]",
  paper:
    "bg-paper-50 text-ink-900 placeholder:text-paper-400 shadow-[inset_0_0_0_1px_var(--line-paper-strong)] hover:shadow-[inset_0_0_0_1px_rgb(20_18_14/0.35)] focus:shadow-[inset_0_0_0_1px_var(--color-ink-900)] aria-invalid:shadow-[inset_0_0_0_1px_#8c4a3e]",
};

const controlBase =
  "block w-full rounded-md px-4 outline-none transition-shadow duration-quick ease-considered focus-visible:outline-none disabled:opacity-50";

export function Field({
  label,
  htmlFor,
  hint,
  error,
  optional,
  children,
  tone = "dark",
  className,
}: {
  label: string;
  htmlFor: string;
  hint?: ReactNode;
  error?: string;
  optional?: boolean;
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <div className={cn("grid content-start gap-2", className)}>
      <label
        htmlFor={htmlFor}
        className={cn("flex items-baseline justify-between text-body-sm font-medium", tone === "dark" ? "text-bone-200" : "text-ink-800")}
      >
        <span>{label}</span>
        {optional && <span className={cn("text-caption font-normal", tone === "dark" ? "text-bone-500" : "text-paper-400")}>Optional</span>}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className={cn("text-caption", tone === "dark" ? "text-status-clay" : "text-[#8c4a3e]")}>
          {error}
        </p>
      ) : hint ? (
        <p id={`${htmlFor}-hint`} className={cn("text-caption", tone === "dark" ? "text-bone-500" : "text-ink-700/70")}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function Input({ tone = "dark", className, invalid, ...rest }: ComponentProps<"input"> & { tone?: Tone; invalid?: boolean }) {
  return (
    <input
      className={cn(controlBase, "h-12", control[tone], className)}
      aria-invalid={invalid || undefined}
      aria-describedby={invalid && rest.id ? `${rest.id}-error` : rest["aria-describedby"]}
      {...rest}
    />
  );
}

export function Textarea({
  tone = "dark",
  className,
  invalid,
  ...rest
}: ComponentProps<"textarea"> & { tone?: Tone; invalid?: boolean }) {
  return (
    <textarea
      className={cn(controlBase, "min-h-32 resize-y py-3 leading-relaxed", control[tone], className)}
      aria-invalid={invalid || undefined}
      aria-describedby={invalid && rest.id ? `${rest.id}-error` : rest["aria-describedby"]}
      {...rest}
    />
  );
}

export function Select({
  tone = "dark",
  className,
  invalid,
  children,
  ...rest
}: ComponentProps<"select"> & { tone?: Tone; invalid?: boolean }) {
  return (
    <div className="relative">
      <select
        className={cn(controlBase, "h-12 appearance-none pr-10", control[tone], className)}
        aria-invalid={invalid || undefined}
        {...rest}
      >
        {children}
      </select>
      <svg
        aria-hidden
        viewBox="0 0 16 16"
        className={cn("pointer-events-none absolute right-4 top-1/2 size-3 -translate-y-1/2", tone === "dark" ? "text-bone-400" : "text-ink-700")}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M4 6l4 4 4-4" />
      </svg>
    </div>
  );
}

export function Checkbox({ label, tone = "dark", ...rest }: ComponentProps<"input"> & { label: ReactNode; tone?: Tone }) {
  return (
    <label className={cn("flex cursor-pointer items-start gap-3 text-body-sm", tone === "dark" ? "text-bone-300" : "text-ink-800")}>
      <input
        type="checkbox"
        className={cn(
          "mt-0.5 size-4 shrink-0 cursor-pointer appearance-none rounded-xs transition-colors duration-quick",
          tone === "dark"
            ? "shadow-[inset_0_0_0_1px_var(--line-strong)] checked:bg-bone-100 checked:shadow-none"
            : "shadow-[inset_0_0_0_1px_var(--line-paper-strong)] checked:bg-ink-900 checked:shadow-none",
          "bg-[length:12px] bg-center bg-no-repeat checked:bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 16%22><path d=%22M3.5 8.5l3 3 6-7%22 fill=%22none%22 stroke=%22%23888%22 stroke-width=%221.8%22/></svg>')]",
        )}
        {...rest}
      />
      <span>{label}</span>
    </label>
  );
}

export function FormMessage({ tone = "dark", kind, children }: { tone?: Tone; kind: "error" | "success"; children: ReactNode }) {
  return (
    <div
      role={kind === "error" ? "alert" : "status"}
      className={cn(
        "rounded-md px-4 py-3 text-body-sm",
        kind === "error"
          ? tone === "dark"
            ? "bg-status-clay/10 text-status-clay shadow-[inset_0_0_0_1px_rgb(196_138_126/0.3)]"
            : "bg-[#8c4a3e]/5 text-[#8c4a3e] shadow-[inset_0_0_0_1px_rgb(140_74_62/0.25)]"
          : tone === "dark"
            ? "bg-status-moss/10 text-status-moss shadow-[inset_0_0_0_1px_rgb(147_167_140/0.3)]"
            : "bg-ink-900/5 text-ink-900",
      )}
    >
      {children}
    </div>
  );
}
