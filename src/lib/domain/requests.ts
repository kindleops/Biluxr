import type {
  RequestOption,
  RequestPriority,
  RequestStatus,
  ServiceLevelTarget,
  ServiceRequest,
} from "./types";

/**
 * Request lifecycle. Every status change in the product passes through
 * `canTransition` — the database enforces the same graph in a trigger.
 */
export const REQUEST_TRANSITIONS: Record<RequestStatus, readonly RequestStatus[]> = {
  received: ["clarifying", "sourcing", "cancelled"],
  clarifying: ["sourcing", "cancelled"],
  sourcing: ["clarifying", "options_ready", "confirmed", "cancelled"],
  options_ready: ["sourcing", "confirmed", "cancelled"],
  confirmed: ["in_progress", "completed", "cancelled"],
  in_progress: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export function canTransition(from: RequestStatus, to: RequestStatus): boolean {
  return REQUEST_TRANSITIONS[from].includes(to);
}

export const OPEN_REQUEST_STATUSES: readonly RequestStatus[] = [
  "received",
  "clarifying",
  "sourcing",
  "options_ready",
  "confirmed",
  "in_progress",
];

export function isOpen(status: RequestStatus): boolean {
  return OPEN_REQUEST_STATUSES.includes(status);
}

export function memberCanCancel(status: RequestStatus): boolean {
  return ["received", "clarifying", "sourcing", "options_ready"].includes(status);
}

export type StatusTone = "neutral" | "active" | "attention" | "positive" | "muted" | "negative";

interface StatusPresentation {
  member: string;
  staff: string;
  tone: StatusTone;
}

export const REQUEST_STATUS_PRESENTATION: Record<RequestStatus, StatusPresentation> = {
  received: { member: "Received", staff: "New", tone: "neutral" },
  clarifying: { member: "A question for you", staff: "Awaiting member", tone: "attention" },
  sourcing: { member: "In motion", staff: "Sourcing", tone: "active" },
  options_ready: { member: "Options ready", staff: "Options presented", tone: "attention" },
  confirmed: { member: "Confirmed", staff: "Confirmed", tone: "positive" },
  in_progress: { member: "Underway", staff: "In progress", tone: "active" },
  completed: { member: "Completed", staff: "Completed", tone: "muted" },
  cancelled: { member: "Cancelled", staff: "Cancelled", tone: "negative" },
};

/**
 * Member-facing label that respects product truth: when the member has chosen
 * an option but staff have not yet confirmed it with the provider, we say so
 * rather than claiming a confirmation.
 */
export function memberStatusLabel(
  status: RequestStatus,
  options: readonly RequestOption[] = [],
): string {
  if (status === "options_ready" && options.some((o) => o.status === "accepted")) {
    return "Securing your choice";
  }
  return REQUEST_STATUS_PRESENTATION[status].member;
}

export const PRIORITY_LABEL: Record<RequestPriority, string> = {
  standard: "Standard",
  priority: "Priority",
  urgent: "Urgent",
};

export function firstResponseDue(
  createdAt: Date,
  priority: RequestPriority,
  targets: readonly ServiceLevelTarget[],
): Date | null {
  const target = targets.find((t) => t.priority === priority);
  if (!target) return null;
  return new Date(createdAt.getTime() + target.firstResponseMinutes * 60_000);
}

export type SlaState = "met" | "on_track" | "at_risk" | "breached" | "none";

export function slaState(
  dueAt: string | null,
  respondedAt: string | null,
  now: Date = new Date(),
): SlaState {
  if (!dueAt) return "none";
  const due = new Date(dueAt).getTime();
  if (respondedAt) return new Date(respondedAt).getTime() <= due ? "met" : "breached";
  const remaining = due - now.getTime();
  if (remaining < 0) return "breached";
  if (remaining < 15 * 60_000) return "at_risk";
  return "on_track";
}

/** Human reference, e.g. "BX-4Q7K". Not a secret; used in conversation. */
export function requestReference(seed: string): string {
  const alphabet = "23456789ABCDEFGHJKMNPQRSTVWXYZ";
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  let out = "";
  let n = hash >>> 0;
  for (let i = 0; i < 4; i++) {
    out += alphabet[n % alphabet.length];
    n = Math.floor(n / alphabet.length);
  }
  return `BX-${out}`;
}

/** A short title from a free-form brief, used until staff refine it. */
export function deriveTitle(brief: string): string {
  const firstSentence = brief.split(/(?<=[.!?])\s|\n/)[0] ?? brief;
  const clean = firstSentence.replace(/^(hi|hello|hey)[,!\s]+/i, "").trim();
  if (clean.length <= 64) return clean.replace(/[.!?]$/, "");
  const cut = clean.slice(0, 60);
  return `${cut.slice(0, cut.lastIndexOf(" ") > 30 ? cut.lastIndexOf(" ") : 60)}…`;
}

/** Queue ordering: breached/soonest SLA first, then priority, then age. */
export function queueOrder(a: ServiceRequest, b: ServiceRequest): number {
  const weight = { urgent: 0, priority: 1, standard: 2 } as const;
  const awaiting = (r: ServiceRequest) => (r.firstRespondedAt ? 1 : 0);
  return (
    awaiting(a) - awaiting(b) ||
    (a.firstRespondedAt
      ? 0
      : (a.firstResponseDueAt ?? "9999").localeCompare(b.firstResponseDueAt ?? "9999")) ||
    weight[a.priority] - weight[b.priority] ||
    b.updatedAt.localeCompare(a.updatedAt)
  );
}
