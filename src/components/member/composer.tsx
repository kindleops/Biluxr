"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createRequestAction } from "@/app/app/actions";
import { BiluxrOrb, type OrbState } from "@/components/motion/orb";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { IDLE } from "@/lib/forms/state";

const PROMPTS = [
  "Dinner for four on Friday, somewhere quiet…",
  "A car to the airport tomorrow at six…",
  "Two nights in Paris next month, Left Bank…",
  "A birthday gift for my daughter…",
];

/**
 * The member's primary instrument. One field, written the way you'd write to
 * someone who knows you. ⌘/Ctrl+Enter sends.
 */
export function CommandComposer({
  placeholderName,
  journeyId,
  variant = "hero",
  autoFocus = false,
}: {
  placeholderName?: string | null;
  journeyId?: string;
  variant?: "hero" | "compact";
  autoFocus?: boolean;
}) {
  const [state, action, pending] = useActionState(createRequestAction, IDLE);
  const [value, setValue] = useState(state.values?.brief ?? "");
  const [urgent, setUrgent] = useState(false);
  const [prompt, setPrompt] = useState(0);
  const [focused, setFocused] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (value) return;
    const t = window.setInterval(() => setPrompt((p) => (p + 1) % PROMPTS.length), 4200);
    return () => window.clearInterval(t);
  }, [value]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 320)}px`;
  }, [value]);

  const error = state.fieldErrors?.brief ?? (state.status === "error" ? state.message : undefined);
  const hero = variant === "hero";
  const orb: OrbState = pending ? "thinking" : focused || value ? "listening" : "idle";

  return (
    <form
      ref={formRef}
      action={action}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
      }}
      className={cn(
        "liquid-glass liquid-glass-strong duration-slow rounded-[22px] transition-shadow ease-considered focus-within:shadow-[inset_0_1px_0_0_rgb(255_255_255/0.24),inset_0_22px_36px_-24px_rgb(255_255_255/0.14),0_50px_110px_-40px_rgb(0_0_0/0.9),0_0_0_1px_rgb(255_255_255/0.08)]",
        hero ? "p-5 sm:p-6" : "p-4",
      )}
    >
      {journeyId && <input type="hidden" name="journeyId" value={journeyId} />}
      <div className="flex items-center justify-between gap-4">
        <label htmlFor="brief" className="text-label text-bone-400">
          {hero
            ? `What can we arrange${placeholderName ? `, ${placeholderName}` : ""}?`
            : "New request"}
        </label>
        <BiluxrOrb
          state={orb}
          activity={value.length}
          halo={0.8}
          className={cn("shrink-0", hero ? "-my-7 -mr-3 size-24" : "-my-5 -mr-2 size-16")}
        />
      </div>
      <textarea
        ref={ref}
        id="brief"
        name="brief"
        rows={hero ? 3 : 2}
        required
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && value.trim()) {
            e.preventDefault();
            formRef.current?.requestSubmit();
          }
        }}
        placeholder={PROMPTS[prompt]}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? "brief-error" : "brief-hint"}
        className={cn(
          "relative mt-3 block w-full resize-none bg-transparent text-bone-50 outline-none placeholder:text-bone-500",
          hero
            ? "font-display text-[1.5rem] leading-snug font-light sm:text-[1.75rem]"
            : "text-body",
        )}
      />
      {error && (
        <p id="brief-error" role="alert" className="mt-2 text-caption text-status-clay">
          {error}
        </p>
      )}
      <div className="mt-4 flex items-center justify-between gap-4 border-t border-white/[0.06] pt-4">
        <label className="flex cursor-pointer items-center gap-2.5 text-caption text-bone-400 select-none">
          <input
            type="checkbox"
            name="timeSensitive"
            checked={urgent}
            onChange={(e) => setUrgent(e.target.checked)}
            className="peer sr-only"
          />
          <span
            aria-hidden
            className="duration-quick relative inline-flex h-4 w-7 items-center rounded-full bg-white/10 transition-colors peer-checked:bg-status-amber/70 peer-focus-visible:outline peer-focus-visible:outline-1 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-bone-100"
          >
            <span
              className={cn(
                "duration-base absolute left-0.5 size-3 rounded-full bg-bone-100 transition-transform ease-settle",
                urgent && "translate-x-3",
              )}
            />
          </span>
          <span className={urgent ? "text-status-amber" : undefined}>Time-sensitive</span>
        </label>
        <div className="flex items-center gap-4">
          <span id="brief-hint" className="hidden text-caption text-bone-600 sm:inline">
            ⌘ ↵ to send
          </span>
          <Button
            type="submit"
            size="sm"
            pending={pending}
            pendingLabel="Sending"
            disabled={!value.trim()}
          >
            Send to concierge
          </Button>
        </div>
      </div>
    </form>
  );
}
