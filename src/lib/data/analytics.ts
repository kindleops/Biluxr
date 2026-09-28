import { isOpen, slaState } from "@/lib/domain/requests";
import type {
  AiEvent,
  Application,
  Membership,
  Provider,
  RequestCategory,
  RequestOption,
  ServiceRequest,
} from "@/lib/domain/types";
import type { AnalyticsView } from "./repository";

/**
 * Computes operating metrics from real records. Returns null for any rate
 * whose denominator is zero — the UI shows "Not enough data" rather than a
 * number that implies traction that does not exist.
 */
export function summarizeAnalytics(input: {
  applications: Application[];
  memberships: Membership[];
  requests: ServiceRequest[];
  options: RequestOption[];
  providers: Provider[];
  aiEvents: AiEvent[];
  categories: RequestCategory[];
}): AnalyticsView {
  const { applications, memberships, requests, options, providers, aiEvents, categories } = input;

  const responded = requests.filter((r) => r.firstRespondedAt);
  const responseMinutes = responded
    .map(
      (r) => (new Date(r.firstRespondedAt!).getTime() - new Date(r.createdAt).getTime()) / 60_000,
    )
    .filter((m) => m >= 0)
    .sort((a, b) => a - b);

  const slaEvaluated = requests.filter((r) => r.firstResponseDueAt && r.firstRespondedAt);
  const slaMet = slaEvaluated.filter(
    (r) => slaState(r.firstResponseDueAt, r.firstRespondedAt) === "met",
  ).length;

  const decided = options.filter((o) => o.status === "accepted" || o.status === "declined");
  const accepted = decided.filter((o) => o.status === "accepted").length;

  const byCategory = new Map<string, number>();
  for (const r of requests) {
    const name = categories.find((c) => c.slug === r.categorySlug)?.name ?? "Uncategorised";
    byCategory.set(name, (byCategory.get(name) ?? 0) + 1);
  }

  return {
    applications: {
      total: applications.length,
      approved: applications.filter((a) => a.status === "approved").length,
      pending: applications.filter((a) =>
        ["submitted", "in_review", "conversation"].includes(a.status),
      ).length,
    },
    members: {
      active: memberships.filter((m) => m.status === "active").length,
      pendingActivation: memberships.filter((m) => m.status === "pending_activation").length,
      founding: memberships.filter((m) => m.isFounding).length,
    },
    requests: {
      total: requests.length,
      open: requests.filter((r) => isOpen(r.status)).length,
      completed: requests.filter((r) => r.status === "completed").length,
      cancelled: requests.filter((r) => r.status === "cancelled").length,
      byCategory: [...byCategory.entries()]
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count),
    },
    medianFirstResponseMinutes: median(responseMinutes),
    slaMetRate: slaEvaluated.length ? slaMet / slaEvaluated.length : null,
    optionAcceptanceRate: decided.length ? accepted / decided.length : null,
    providers: {
      total: providers.length,
      approved: providers.filter((p) => p.status === "approved" || p.status === "preferred").length,
    },
    ai: {
      total: aiEvents.length,
      accepted: aiEvents.filter((e) => e.status === "accepted").length,
      edited: aiEvents.filter((e) => e.status === "edited").length,
      dismissed: aiEvents.filter((e) => e.status === "dismissed").length,
      failed: aiEvents.filter((e) => e.status === "failed").length,
    },
  };
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const mid = Math.floor(values.length / 2);
  return values.length % 2 ? values[mid]! : (values[mid - 1]! + values[mid]!) / 2;
}
