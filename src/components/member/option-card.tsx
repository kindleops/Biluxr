"use client";

import { useActionState } from "react";
import { respondToOptionAction } from "@/app/app/actions";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/field";
import { StatusPill } from "@/components/ui/status";
import { cn } from "@/lib/cn";
import type { RequestOption } from "@/lib/domain/types";
import { formatDateTime, formatMoney } from "@/lib/format";
import { IDLE } from "@/lib/forms/state";

const OPTION_STATE: Partial<
  Record<RequestOption["status"], { label: string; tone: "positive" | "muted" | "negative" }>
> = {
  accepted: { label: "Your choice — being confirmed", tone: "positive" },
  declined: { label: "Declined", tone: "muted" },
  expired: { label: "Expired", tone: "muted" },
  withdrawn: { label: "No longer available", tone: "negative" },
};

/**
 * An option (quote) presented by the concierge. Choosing it records the
 * member's decision; it does NOT claim a booking — the request becomes
 * "Confirmed" only when staff confirm with the provider.
 */
export function OptionCard({
  option,
  index,
  total,
  timezone,
  locked,
}: {
  option: RequestOption;
  index: number;
  total: number;
  timezone: string | null;
  locked: boolean;
}) {
  const [state, action, pending] = useActionState(respondToOptionAction, IDLE);
  const open = option.status === "presented" && !locked;
  const settled = OPTION_STATE[option.status];

  return (
    <article
      className={cn(
        "rounded-card p-5 sm:p-6",
        option.status === "accepted"
          ? "bg-ink-850 shadow-[inset_0_0_0_1px_rgb(147_167_140/0.35)]"
          : "bg-ink-900 shadow-[inset_0_0_0_1px_var(--line)]",
        (option.status === "declined" ||
          option.status === "expired" ||
          option.status === "withdrawn") &&
          "opacity-60",
      )}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="text-label text-bone-500">
          Option {index + 1} of {total}
        </p>
        {option.expiresAt && option.status === "presented" && (
          <p className="text-caption text-bone-500">
            Held until {formatDateTime(option.expiresAt, timezone)}
          </p>
        )}
        {settled && <StatusPill tone={settled.tone}>{settled.label}</StatusPill>}
      </div>
      <h3 className="mt-4 font-display text-[1.45rem] leading-snug font-light text-bone-50">
        {option.title}
      </h3>
      {option.summary && (
        <p className="mt-3 text-body-sm whitespace-pre-line text-bone-300">{option.summary}</p>
      )}
      <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-caption text-bone-500">Price</p>
          <p className="mt-1 text-body text-bone-100 tabular-nums">
            {option.price ? formatMoney(option.price) : "Shared on request"}
          </p>
        </div>
        {open && (
          <form action={action} className="flex gap-2">
            <input type="hidden" name="optionId" value={option.id} />
            <input type="hidden" name="requestId" value={option.requestId} />
            <Button
              type="submit"
              name="decision"
              value="decline"
              variant="ghost"
              size="sm"
              disabled={pending}
            >
              Not this one
            </Button>
            <Button
              type="submit"
              name="decision"
              value="accept"
              size="sm"
              pending={pending}
              pendingLabel="Sending"
            >
              Choose this
            </Button>
          </form>
        )}
      </div>
      {state.status !== "idle" && state.message && (
        <div className="mt-4">
          <FormMessage kind={state.status === "error" ? "error" : "success"}>
            {state.message}
          </FormMessage>
        </div>
      )}
    </article>
  );
}
