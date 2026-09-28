import Link from "next/link";
import { StatusPill } from "@/components/ui/status";
import { cn } from "@/lib/cn";
import { REQUEST_STATUS_PRESENTATION, memberStatusLabel } from "@/lib/domain/requests";
import type { Journey, RequestOption, ServiceRequest } from "@/lib/domain/types";
import { formatDateRange, formatRelative } from "@/lib/format";

export function RequestCard({
  request,
  options = [],
  lastActivity,
  categoryName,
}: {
  request: ServiceRequest;
  options?: RequestOption[];
  lastActivity?: string | null;
  categoryName?: string | null;
}) {
  const presentation = REQUEST_STATUS_PRESENTATION[request.status];
  const openOptions = options.filter((o) => o.status === "presented").length;
  return (
    <Link
      href={`/app/concierge/${request.id}`}
      className="group duration-base relative block rounded-card bg-ink-900 p-5 shadow-[inset_0_0_0_1px_var(--line-subtle)] transition-[background-color,box-shadow,transform] ease-considered hover:bg-ink-850 hover:shadow-[inset_0_0_0_1px_var(--line)] active:scale-[0.995] sm:p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <StatusPill tone={presentation.tone}>
          {memberStatusLabel(request.status, options)}
        </StatusPill>
        <span className="font-mono text-[0.6875rem] text-bone-600">{request.reference}</span>
      </div>
      <h3 className="mt-4 font-display text-[1.375rem] leading-snug font-light text-balance text-bone-50">
        {request.title}
      </h3>
      <p className="mt-2 line-clamp-2 text-body-sm text-bone-400">{request.brief}</p>
      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-caption text-bone-500">
        {categoryName && <span>{categoryName}</span>}
        {openOptions > 0 && request.status === "options_ready" && (
          <span className="text-bone-300">
            {openOptions} {openOptions === 1 ? "option" : "options"} to review
          </span>
        )}
        <span className="ml-auto">Updated {formatRelative(lastActivity ?? request.updatedAt)}</span>
      </div>
    </Link>
  );
}

const JOURNEY_STATUS: Record<
  Journey["status"],
  { label: string; tone: "neutral" | "positive" | "active" | "muted" | "negative" }
> = {
  planning: { label: "Taking shape", tone: "neutral" },
  confirmed: { label: "Confirmed", tone: "positive" },
  underway: { label: "Underway", tone: "active" },
  completed: { label: "Completed", tone: "muted" },
  cancelled: { label: "Cancelled", tone: "negative" },
};

export function JourneyCard({
  journey,
  feature = false,
  marketName,
}: {
  journey: Journey;
  feature?: boolean;
  marketName?: string | null;
}) {
  const s = JOURNEY_STATUS[journey.status];
  return (
    <Link
      href={`/app/journeys/${journey.id}`}
      className={cn(
        "group duration-base relative flex flex-col justify-between overflow-hidden rounded-card bg-ink-900 shadow-[inset_0_0_0_1px_var(--line-subtle)] transition-[background-color,box-shadow] hover:bg-ink-850 hover:shadow-[inset_0_0_0_1px_var(--line)]",
        feature ? "min-h-64 p-6 sm:p-8" : "min-h-52 p-6",
      )}
    >
      <JourneyArc />
      <div className="relative flex items-start justify-between gap-4">
        <p className="text-label text-bone-500">
          {formatDateRange(journey.startsOn, journey.endsOn)}
        </p>
        <StatusPill tone={s.tone}>{s.label}</StatusPill>
      </div>
      <div className="relative mt-10">
        {marketName && <p className="text-caption text-bone-500">{marketName}</p>}
        <h3
          className={cn(
            "mt-1 font-display font-light text-balance text-bone-50",
            feature ? "text-headline" : "text-title",
          )}
        >
          {journey.title}
        </h3>
        {journey.summary && (
          <p className="mt-3 max-w-md text-body-sm text-bone-400">{journey.summary}</p>
        )}
      </div>
    </Link>
  );
}

/** A quiet route line — the journey motif. Decorative only. */
function JourneyArc() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 400 200"
      preserveAspectRatio="none"
      className="duration-slow pointer-events-none absolute inset-0 size-full opacity-60 transition-opacity group-hover:opacity-100"
    >
      <path
        d="M-10 190 C 120 170, 180 40, 410 20"
        fill="none"
        stroke="rgb(243 239 232 / 0.08)"
        strokeWidth="1"
        strokeDasharray="2 6"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
