import { beforeEach, describe, expect, it } from "vitest";
import { DomainError, ForbiddenError, NotFoundError } from "@/lib/data/repository";
import { DEMO_IDS } from "@/lib/demo/fixtures";
import {
  DemoMemberRepository,
  DemoStaffRepository,
  demoStore,
  resetDemoStore,
} from "@/lib/demo/repository";

beforeEach(() => resetDemoStore());

describe("demo repository authorization (mirrors RLS)", () => {
  it("members only see their own requests", async () => {
    const elena = new DemoMemberRepository(DEMO_IDS.member);
    const marcus = new DemoMemberRepository(DEMO_IDS.member2);
    const mine = await elena.listRequests();
    expect(mine.length).toBeGreaterThan(0);
    expect(mine.every((r) => r.memberId === DEMO_IDS.member)).toBe(true);
    await expect(marcus.getRequest(mine[0]!.id)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("members never see internal notes or draft options", async () => {
    const elena = new DemoMemberRepository(DEMO_IDS.member);
    for (const r of await elena.listRequests()) {
      const d = await elena.getRequest(r.id);
      expect(d.messages.some((m) => m.visibility === "internal")).toBe(false);
      expect(d.options.some((o) => o.status === "draft")).toBe(false);
    }
  });

  it("members without an active membership cannot create requests", async () => {
    const theo = new DemoMemberRepository(DEMO_IDS.member4);
    await expect(
      theo.createRequest({
        brief: "A car tomorrow",
        title: null,
        categorySlug: null,
        priority: "standard",
      }),
    ).rejects.toBeInstanceOf(DomainError);
  });

  it("creates a request with an SLA deadline and the brief as the first message", async () => {
    const elena = new DemoMemberRepository(DEMO_IDS.member);
    const r = await elena.createRequest({
      brief: "Two seats at the ballet on Saturday.",
      title: null,
      categorySlug: "access",
      priority: "urgent",
      journeyId: null,
    });
    expect(r.status).toBe("received");
    expect(r.title).toBe("Two seats at the ballet on Saturday");
    expect(new Date(r.firstResponseDueAt!).getTime() - new Date(r.createdAt).getTime()).toBe(
      15 * 60_000,
    );
    const detail = await elena.getRequest(r.id);
    expect(detail.messages[0]?.body).toBe("Two seats at the ballet on Saturday.");
  });

  it("accepting an option records a choice, never a confirmation, and only once", async () => {
    const elena = new DemoMemberRepository(DEMO_IDS.member);
    const withOptions = (await elena.listRequests()).find((r) => r.options.length >= 2)!;
    const [first, second] = withOptions.options;
    await elena.respondToOption(first!.id, "accept");
    const after = await elena.getRequest(withOptions.id);
    expect(after.request.status).toBe("options_ready");
    expect(after.options.find((o) => o.id === first!.id)?.status).toBe("accepted");
    await expect(elena.respondToOption(second!.id, "accept")).rejects.toThrow(
      /already been chosen/,
    );
  });

  it("enforces the invitation allowance", async () => {
    const elena = new DemoMemberRepository(DEMO_IDS.member);
    const { invitationAllowance, invitationsUsed } = await elena.membership();
    for (let i = invitationsUsed; i < invitationAllowance; i++)
      await elena.issueInvitation(`g${i}@example.com`, "Guest");
    await expect(elena.issueInvitation("one-too-many@example.com", "Guest")).rejects.toThrow(
      /used all/,
    );
  });

  it("members cannot remove someone else's preferences", async () => {
    const marcus = new DemoMemberRepository(DEMO_IDS.member2);
    const elenaPref = demoStore().preferences.find((p) => p.memberId === DEMO_IDS.member)!;
    await expect(marcus.removePreference(elenaPref.id)).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("demo staff repository", () => {
  it("refuses non-staff identities", () => {
    expect(() => new DemoStaffRepository(DEMO_IDS.member)).toThrow(ForbiddenError);
  });

  it("enforces lifecycle transitions and records events", async () => {
    const staff = new DemoStaffRepository(DEMO_IDS.concierge);
    const fresh = (await staff.queue({ status: "received" }))[0]!;
    await expect(staff.updateRequest(fresh.id, { status: "completed" })).rejects.toBeInstanceOf(
      DomainError,
    );
    await staff.updateRequest(fresh.id, { status: "sourcing", assigneeId: DEMO_IDS.concierge });
    const detail = await staff.getRequest(fresh.id);
    expect(detail.request.status).toBe("sourcing");
    expect(detail.events.map((e) => e.kind)).toEqual(
      expect.arrayContaining(["status_changed", "assigned"]),
    );
  });

  it("stamps first response only for member-visible replies", async () => {
    const staff = new DemoStaffRepository(DEMO_IDS.concierge);
    const fresh = (await staff.queue({ status: "received" }))[0]!;
    await staff.postMessage(fresh.id, "Internal thought", "internal");
    expect((await staff.getRequest(fresh.id)).request.firstRespondedAt).toBeNull();
    await staff.postMessage(fresh.id, "On it.", "member");
    expect((await staff.getRequest(fresh.id)).request.firstRespondedAt).not.toBeNull();
  });
});
