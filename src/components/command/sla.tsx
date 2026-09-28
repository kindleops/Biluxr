import { cn } from "@/lib/cn";
import { slaState } from "@/lib/domain/requests";

function span(ms: number): string {
  const m = Math.round(Math.abs(ms) / 60_000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h}h ${m % 60 ? `${m % 60}m` : ""}`.trim();
  return `${Math.floor(h / 24)}d`;
}

/** First-response SLA against configured targets. */
export function SlaBadge({ dueAt, respondedAt, now = new Date() }: { dueAt: string | null; respondedAt: string | null; now?: Date }) {
  const state = slaState(dueAt, respondedAt, now);
  if (state === "none") return <span className="text-caption text-bone-600">—</span>;
  if (state === "met") return <span className="text-caption text-bone-500">Responded</span>;
  const remaining = new Date(dueAt!).getTime() - now.getTime();
  return (
    <span
      className={cn(
        "font-mono text-caption tabular-nums",
        state === "breached" && "text-status-clay",
        state === "at_risk" && "text-status-amber",
        state === "on_track" && "text-bone-300",
      )}
    >
      {state === "breached" ? (respondedAt ? "Late reply" : `Overdue ${span(remaining)}`) : `Reply in ${span(remaining)}`}
    </span>
  );
}
