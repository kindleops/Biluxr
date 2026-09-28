import { describe, expect, it } from "vitest";
import { summarizeAnalytics } from "@/lib/data/analytics";
import type { RequestOption, ServiceRequest } from "@/lib/domain/types";

const empty = {
  applications: [],
  memberships: [],
  requests: [],
  options: [],
  providers: [],
  aiEvents: [],
  categories: [],
};

describe("analytics", () => {
  it("reports no rates when there is no data, rather than inventing them", () => {
    const a = summarizeAnalytics(empty);
    expect(a.medianFirstResponseMinutes).toBeNull();
    expect(a.slaMetRate).toBeNull();
    expect(a.optionAcceptanceRate).toBeNull();
    expect(a.requests.total).toBe(0);
  });

  it("computes response time, SLA and acceptance from records", () => {
    const req = (created: string, responded: string, due: string) =>
      ({
        id: created,
        createdAt: created,
        firstRespondedAt: responded,
        firstResponseDueAt: due,
        status: "sourcing",
        categorySlug: null,
      }) as ServiceRequest;
    const requests = [
      req("2026-09-28T10:00:00Z", "2026-09-28T10:10:00Z", "2026-09-28T10:15:00Z"),
      req("2026-09-28T11:00:00Z", "2026-09-28T11:30:00Z", "2026-09-28T11:15:00Z"),
    ];
    const options = [
      { status: "accepted" },
      { status: "declined" },
      { status: "presented" },
    ] as RequestOption[];
    const a = summarizeAnalytics({ ...empty, requests, options });
    expect(a.medianFirstResponseMinutes).toBe(20);
    expect(a.slaMetRate).toBe(0.5);
    expect(a.optionAcceptanceRate).toBe(0.5);
  });
});
