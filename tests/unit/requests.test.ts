import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  REQUEST_TRANSITIONS,
  canTransition,
  deriveTitle,
  firstResponseDue,
  memberCanCancel,
  memberStatusLabel,
  queueOrder,
  slaState,
} from "@/lib/domain/requests";
import { REQUEST_STATUSES, type RequestOption, type ServiceRequest } from "@/lib/domain/types";

describe("request lifecycle", () => {
  it("matches the transition graph enforced by the database", () => {
    const sql = readFileSync(
      path.join(process.cwd(), "supabase/migrations/20260928000300_service.sql"),
      "utf8",
    );
    const body = sql.slice(
      sql.indexOf("request_transition_allowed"),
      sql.indexOf("-- Before insert"),
    );
    for (const from of REQUEST_STATUSES) {
      const match = body.match(new RegExp(`when '${from}' then to_status in \\(([^)]*)\\)`));
      const dbTargets = match
        ? [...match[1]!.matchAll(/'([a-z_]+)'/g)].map((m) => m[1]).sort()
        : [];
      expect([...REQUEST_TRANSITIONS[from]].sort(), `transitions from ${from}`).toEqual(dbTargets);
    }
  });

  it("never allows reopening closed requests", () => {
    for (const to of REQUEST_STATUSES) {
      expect(canTransition("completed", to)).toBe(false);
      expect(canTransition("cancelled", to)).toBe(false);
    }
  });

  it("lets members withdraw only before confirmation", () => {
    expect(memberCanCancel("sourcing")).toBe(true);
    expect(memberCanCancel("options_ready")).toBe(true);
    expect(memberCanCancel("confirmed")).toBe(false);
    expect(memberCanCancel("in_progress")).toBe(false);
  });

  it("does not claim confirmation when the member has only chosen an option", () => {
    const accepted = { status: "accepted" } as RequestOption;
    expect(memberStatusLabel("options_ready", [accepted])).toBe("Securing your choice");
    expect(memberStatusLabel("options_ready", [])).toBe("Options ready");
    expect(memberStatusLabel("confirmed", [accepted])).toBe("Confirmed");
  });
});

describe("service levels", () => {
  const targets = [
    { priority: "urgent" as const, firstResponseMinutes: 15, optionsWithinHours: 4 },
    { priority: "standard" as const, firstResponseMinutes: 240, optionsWithinHours: 48 },
  ];

  it("computes first-response deadlines from configuration", () => {
    const created = new Date("2026-09-28T10:00:00Z");
    expect(firstResponseDue(created, "urgent", targets)?.toISOString()).toBe(
      "2026-09-28T10:15:00.000Z",
    );
    expect(firstResponseDue(created, "priority", targets)).toBeNull();
  });

  it("classifies SLA state", () => {
    const now = new Date("2026-09-28T10:00:00Z");
    expect(slaState(null, null, now)).toBe("none");
    expect(slaState("2026-09-28T11:00:00Z", null, now)).toBe("on_track");
    expect(slaState("2026-09-28T10:10:00Z", null, now)).toBe("at_risk");
    expect(slaState("2026-09-28T09:00:00Z", null, now)).toBe("breached");
    expect(slaState("2026-09-28T09:00:00Z", "2026-09-28T08:59:00Z", now)).toBe("met");
    expect(slaState("2026-09-28T09:00:00Z", "2026-09-28T09:30:00Z", now)).toBe("breached");
  });

  it("orders the queue: unanswered by deadline first, then priority", () => {
    const base = { updatedAt: "2026-09-28T09:00:00Z" } as ServiceRequest;
    const a = {
      ...base,
      id: "a",
      firstRespondedAt: null,
      firstResponseDueAt: "2026-09-28T12:00:00Z",
      priority: "standard",
    } as ServiceRequest;
    const b = {
      ...base,
      id: "b",
      firstRespondedAt: null,
      firstResponseDueAt: "2026-09-28T10:05:00Z",
      priority: "urgent",
    } as ServiceRequest;
    const c = {
      ...base,
      id: "c",
      firstRespondedAt: "2026-09-28T09:10:00Z",
      firstResponseDueAt: "2026-09-28T09:30:00Z",
      priority: "urgent",
    } as ServiceRequest;
    expect([a, c, b].sort(queueOrder).map((r) => r.id)).toEqual(["b", "a", "c"]);
  });
});

describe("deriveTitle", () => {
  it("takes the first sentence and drops greetings", () => {
    expect(deriveTitle("Hi, dinner for four on Friday. Somewhere quiet.")).toBe(
      "dinner for four on Friday",
    );
  });
  it("shortens long briefs on a word boundary", () => {
    const title = deriveTitle("A".repeat(10) + " " + "word ".repeat(30));
    expect(title.length).toBeLessThanOrEqual(62);
    expect(title.endsWith("…")).toBe(true);
  });
});
