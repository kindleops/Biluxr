import "server-only";
import { canTransition, deriveTitle, firstResponseDue, isOpen, memberCanCancel, queueOrder } from "@/lib/domain/requests";
import type {
  AccessOffer,
  AiEvent,
  AiReviewStatus,
  Application,
  ApplicationStatus,
  Invitation,
  Journey,
  MessageVisibility,
  PartnerApplication,
  Profile,
  Provider,
  ProviderStatus,
  RequestEvent,
  ServiceRequest,
  UUID,
} from "@/lib/domain/types";
import { STAFF_ROLES } from "@/lib/domain/types";
import type {
  ApplicationInput,
  ContactInput,
  NewOptionInput,
  NewRequestInput,
  PartnerApplicationInput,
  PersonInput,
  PreferenceInput,
  ProfileUpdateInput,
  ProviderInput,
} from "@/lib/domain/schemas";
import { initials } from "@/lib/format";
import {
  DomainError,
  ForbiddenError,
  NotFoundError,
  type AiEventInput,
  type AnalyticsView,
  type CohortView,
  type Member360,
  type MemberHome,
  type MemberListItem,
  type MemberRepository,
  type MemberRequestDetail,
  type MembershipDetail,
  type PersonSummary,
  type ProfileBundle,
  type PublicRepository,
  type QueueFilters,
  type QueueItem,
  type RequestSummary,
  type SettingsView,
  type StaffRepository,
  type StaffRequestDetail,
  type StaffRequestPatch,
  type TierWithPrivileges,
  type Viewer,
} from "@/lib/data/repository";
import { createDemoStore, type DemoStore } from "./fixtures";
import { summarizeAnalytics } from "@/lib/data/analytics";

/**
 * In-memory demo repository. State lives on globalThis so it survives hot
 * reloads and is shared across requests within one server process — a demo
 * session behaves like a real (if ephemeral) backend. Authorization mirrors
 * the database's RLS policies.
 */

const globalStore = globalThis as unknown as { __biluxrDemoStore?: DemoStore };

export function demoStore(): DemoStore {
  if (!globalStore.__biluxrDemoStore) globalStore.__biluxrDemoStore = createDemoStore();
  return globalStore.__biluxrDemoStore;
}

export function resetDemoStore(): void {
  globalStore.__biluxrDemoStore = createDemoStore();
}

const newId = () => crypto.randomUUID();
const nowIso = () => new Date().toISOString();

function summary(p: Profile): PersonSummary {
  const name = p.preferredName ? `${p.preferredName} ${p.fullName.split(" ").slice(1).join(" ")}`.trim() : p.fullName;
  return { id: p.id, name, initials: initials(p.fullName) };
}

function tierWithPrivileges(s: DemoStore, tierId: UUID): TierWithPrivileges | null {
  const tier = s.tiers.find((t) => t.id === tierId);
  if (!tier) return null;
  return {
    ...tier,
    privileges: s.privileges.filter((p) => p.tierId === tier.id).sort((a, b) => a.sortOrder - b.sortOrder),
  };
}

export class DemoPublicRepository implements PublicRepository {
  private s = demoStore();

  async listMarkets() {
    return [...this.s.markets].sort((a, b) => a.sortOrder - b.sortOrder);
  }
  async listPublicTiers() {
    return this.s.tiers
      .filter((t) => t.isActive)
      .map((t) => tierWithPrivileges(this.s, t.id))
      .filter((t): t is TierWithPrivileges => t !== null);
  }
  async listCategories() {
    return this.s.categories.filter((c) => c.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
  }
  async submitApplication(input: ApplicationInput) {
    const app: Application = {
      id: newId(),
      fullName: input.fullName,
      email: input.email,
      phone: input.phone,
      city: input.city,
      marketSlug: input.marketSlug,
      occupation: input.occupation,
      referralSource: input.referralSource,
      invitationCode: input.invitationCode ? `••••${input.invitationCode.slice(-4).toUpperCase()}` : null,
      answers: { lifeInMotion: input.lifeInMotion, whatWouldHelp: input.whatWouldHelp },
      status: "submitted",
      reviewerId: null,
      decisionNote: null,
      submittedAt: nowIso(),
      decidedAt: null,
    };
    this.s.applications.unshift(app);
  }
  async submitPartnerApplication(input: PartnerApplicationInput) {
    const app: PartnerApplication = { id: newId(), ...input, status: "submitted", submittedAt: nowIso() };
    this.s.partnerApplications.unshift(app);
  }
  async submitContact(input: ContactInput) {
    this.s.contact.unshift({ id: newId(), ...input, createdAt: nowIso() });
  }
  async checkInvitation(code: string) {
    const normalized = code.trim().toUpperCase();
    return normalized.length >= 6 && this.s.invitations.some((i) => i.status === "issued" && i.code.endsWith(normalized.slice(-4)));
  }
}

export class DemoMemberRepository implements MemberRepository {
  private s = demoStore();
  constructor(private viewerId: UUID) {}

  private viewer(): Viewer {
    const profile = this.s.profiles.find((p) => p.id === this.viewerId);
    if (!profile) throw new ForbiddenError();
    return { profile, membership: this.s.memberships.find((m) => m.memberId === profile.id) ?? null };
  }

  private ownRequest(id: UUID): ServiceRequest {
    const r = this.s.requests.find((x) => x.id === id);
    if (!r || r.memberId !== this.viewerId) throw new NotFoundError("Request not found");
    return r;
  }

  private summarize(r: ServiceRequest): RequestSummary {
    const msgs = this.s.messages.filter((m) => m.requestId === r.id && m.visibility === "member");
    return {
      ...r,
      options: this.s.options.filter((o) => o.requestId === r.id && o.status !== "draft"),
      lastMessageAt: msgs.at(-1)?.createdAt ?? null,
    };
  }

  async home(): Promise<MemberHome> {
    const viewer = this.viewer();
    const ownerId = viewer.membership?.relationshipOwnerId;
    const owner = ownerId ? this.s.profiles.find((p) => p.id === ownerId) : null;
    const today = new Date().toISOString().slice(0, 10);
    return {
      viewer,
      tier: viewer.membership ? (this.s.tiers.find((t) => t.id === viewer.membership!.tierId) ?? null) : null,
      relationshipOwner: owner ? summary(owner) : null,
      activeRequests: (await this.listRequests()).filter((r) => isOpen(r.status)),
      upcomingJourneys: this.s.journeys
        .filter((j) => j.memberId === this.viewerId && j.status !== "cancelled" && j.status !== "completed")
        .filter((j) => !j.endsOn || j.endsOn >= today)
        .sort((a, b) => (a.startsOn ?? "9999").localeCompare(b.startsOn ?? "9999")),
    };
  }

  async listRequests() {
    return this.s.requests
      .filter((r) => r.memberId === this.viewerId)
      .map((r) => this.summarize(r))
      .sort((a, b) => (b.lastMessageAt ?? b.updatedAt).localeCompare(a.lastMessageAt ?? a.updatedAt));
  }

  async getRequest(id: UUID): Promise<MemberRequestDetail> {
    const request = this.ownRequest(id);
    const assignee = request.assigneeId ? this.s.profiles.find((p) => p.id === request.assigneeId) : null;
    return {
      request,
      messages: this.s.messages
        .filter((m) => m.requestId === id && m.visibility === "member")
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
      options: this.s.options
        .filter((o) => o.requestId === id && o.status !== "draft")
        .sort((a, b) => a.sortOrder - b.sortOrder),
      events: this.s.events.filter((e) => e.requestId === id).sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
      assignee: assignee ? summary(assignee) : null,
    };
  }

  async createRequest(input: NewRequestInput) {
    const viewer = this.viewer();
    if (viewer.membership?.status !== "active") {
      throw new DomainError("Your membership is not yet active. Your concierge will be in touch to complete activation.");
    }
    if (input.journeyId && !this.s.journeys.some((j) => j.id === input.journeyId && j.memberId === this.viewerId)) {
      throw new NotFoundError("Journey not found");
    }
    const created = new Date();
    const id = newId();
    const request: ServiceRequest = {
      id,
      reference: `BX-${id.replace(/-/g, "").slice(0, 6).toUpperCase()}`,
      memberId: this.viewerId,
      categorySlug: input.categorySlug,
      vertical: this.s.categories.find((c) => c.slug === input.categorySlug)?.vertical ?? "concierge",
      title: input.title ?? deriveTitle(input.brief),
      brief: input.brief,
      status: "received",
      priority: input.priority,
      marketId: viewer.profile.homeMarketId,
      assigneeId: null,
      startsAt: null,
      endsAt: null,
      timezone: viewer.profile.timezone,
      partySize: null,
      budget: null,
      location: null,
      firstResponseDueAt: firstResponseDue(created, input.priority, this.s.slas)?.toISOString() ?? null,
      firstRespondedAt: null,
      journeyId: input.journeyId ?? null,
      details: {},
      createdAt: created.toISOString(),
      updatedAt: created.toISOString(),
    };
    this.s.requests.unshift(request);
    this.s.messages.push({
      id: newId(),
      requestId: id,
      authorId: this.viewerId,
      authorKind: "member",
      authorName: viewer.profile.preferredName ?? viewer.profile.fullName,
      body: input.brief,
      visibility: "member",
      createdAt: request.createdAt,
    });
    pushEvent(this.s, { requestId: id, kind: "created", fromStatus: null, toStatus: "received", actorId: this.viewerId, note: null });
    return request;
  }

  async postMessage(requestId: UUID, body: string) {
    const r = this.ownRequest(requestId);
    if (!isOpen(r.status)) throw new DomainError("This request is closed. Start a new request and we'll pick it up.");
    const me = this.viewer().profile;
    this.s.messages.push({
      id: newId(),
      requestId,
      authorId: me.id,
      authorKind: "member",
      authorName: me.preferredName ?? me.fullName,
      body,
      visibility: "member",
      createdAt: nowIso(),
    });
    r.updatedAt = nowIso();
  }

  async respondToOption(optionId: UUID, decision: "accept" | "decline") {
    const opt = this.s.options.find((o) => o.id === optionId);
    if (!opt) throw new NotFoundError("Option not found");
    const r = this.ownRequest(opt.requestId);
    if (opt.status !== "presented") throw new DomainError("This option is no longer open.");
    if (opt.expiresAt && new Date(opt.expiresAt) < new Date()) {
      opt.status = "expired";
      throw new DomainError("This option has expired. Your concierge can refresh it.");
    }
    if (decision === "accept" && this.s.options.some((o) => o.requestId === r.id && o.status === "accepted")) {
      throw new DomainError("An option has already been chosen for this request.");
    }
    opt.status = decision === "accept" ? "accepted" : "declined";
    opt.respondedAt = nowIso();
    pushEvent(this.s, {
      requestId: r.id,
      kind: decision === "accept" ? "option_accepted" : "option_declined",
      fromStatus: null,
      toStatus: null,
      actorId: this.viewerId,
      note: opt.title,
    });
    r.updatedAt = nowIso();
  }

  async cancelRequest(requestId: UUID, reason: string | null) {
    const r = this.ownRequest(requestId);
    if (!memberCanCancel(r.status)) {
      throw new DomainError("This request can no longer be withdrawn here; your concierge will help.");
    }
    const from = r.status;
    r.status = "cancelled";
    r.updatedAt = nowIso();
    pushEvent(this.s, { requestId, kind: "status_changed", fromStatus: from, toStatus: "cancelled", actorId: this.viewerId, note: null });
    if (reason) await this.postMessageUnchecked(requestId, `Withdrawn: ${reason}`);
  }

  private async postMessageUnchecked(requestId: UUID, body: string) {
    const me = this.viewer().profile;
    this.s.messages.push({
      id: newId(),
      requestId,
      authorId: me.id,
      authorKind: "member",
      authorName: me.preferredName ?? me.fullName,
      body,
      visibility: "member",
      createdAt: nowIso(),
    });
  }

  async listJourneys(): Promise<Journey[]> {
    return this.s.journeys
      .filter((j) => j.memberId === this.viewerId)
      .sort((a, b) => (a.startsOn ?? "9999").localeCompare(b.startsOn ?? "9999"));
  }

  async getJourney(id: UUID) {
    const journey = this.s.journeys.find((j) => j.id === id && j.memberId === this.viewerId);
    if (!journey) throw new NotFoundError("Journey not found");
    return {
      journey,
      items: this.s.journeyItems
        .filter((i) => i.journeyId === id && i.status !== "cancelled")
        .sort((a, b) => (a.startsAt ?? "9999").localeCompare(b.startsAt ?? "9999") || a.sortOrder - b.sortOrder),
    };
  }

  async listAccessOffers(): Promise<AccessOffer[]> {
    if (this.viewer().membership?.status !== "active") return [];
    return this.s.accessOffers.filter((o) => o.status === "published");
  }

  async listInvitations(): Promise<Invitation[]> {
    return this.s.invitations.filter((i) => i.inviterId === this.viewerId);
  }

  async issueInvitation(email: string, name: string) {
    const viewer = this.viewer();
    if (viewer.membership?.status !== "active") throw new DomainError("An active membership is required to invite.");
    const tier = this.s.tiers.find((t) => t.id === viewer.membership!.tierId);
    const used = this.s.invitations.filter(
      (i) => i.inviterId === this.viewerId && (i.status === "issued" || i.status === "accepted"),
    ).length;
    if (!tier || used >= tier.invitationAllowance) throw new DomainError("You have used all of your invitations.");
    const code = Array.from(crypto.getRandomValues(new Uint8Array(6)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();
    this.s.invitations.unshift({
      id: newId(),
      inviterId: this.viewerId,
      email,
      inviteeName: name,
      code: `••••${code.slice(-4)}`,
      status: "issued",
      applicationId: null,
      expiresAt: new Date(Date.now() + 60 * 86_400_000).toISOString(),
      createdAt: nowIso(),
    });
    return { code };
  }

  async membership(): Promise<MembershipDetail> {
    const { membership } = this.viewer();
    const tier = membership ? tierWithPrivileges(this.s, membership.tierId) : null;
    const used = this.s.invitations.filter(
      (i) => i.inviterId === this.viewerId && (i.status === "issued" || i.status === "accepted"),
    ).length;
    return {
      membership,
      tier,
      cards: this.s.cards
        .filter((c) => c.memberId === this.viewerId)
        .map((c) => ({ ...c, program: this.s.cardPrograms.find((p) => p.id === c.programId)! })),
      invitationAllowance: tier?.invitationAllowance ?? 0,
      invitationsUsed: used,
    };
  }

  async profile(): Promise<ProfileBundle> {
    const { profile } = this.viewer();
    return {
      profile,
      preferences: this.s.preferences.filter((p) => p.memberId === this.viewerId),
      people: this.s.people.filter((p) => p.memberId === this.viewerId),
    };
  }

  async updateProfile(input: ProfileUpdateInput) {
    const { profile } = this.viewer();
    Object.assign(profile, {
      fullName: input.fullName,
      preferredName: input.preferredName,
      phone: input.phone,
      timezone: input.timezone,
      avatarInitials: initials(input.fullName),
    });
  }

  async addPreference(input: PreferenceInput) {
    this.s.preferences.push({ id: newId(), memberId: this.viewerId, ...input, source: "member", updatedAt: nowIso() });
  }

  async removePreference(id: UUID) {
    const idx = this.s.preferences.findIndex((p) => p.id === id && p.memberId === this.viewerId);
    if (idx === -1) throw new NotFoundError();
    this.s.preferences.splice(idx, 1);
  }

  async addPerson(input: PersonInput) {
    this.s.people.push({ id: newId(), memberId: this.viewerId, ...input });
  }

  async removePerson(id: UUID) {
    const idx = this.s.people.findIndex((p) => p.id === id && p.memberId === this.viewerId);
    if (idx === -1) throw new NotFoundError();
    this.s.people.splice(idx, 1);
  }
}

function pushEvent(s: DemoStore, e: Omit<RequestEvent, "id" | "createdAt">) {
  s.events.push({ ...e, id: newId(), createdAt: nowIso() });
}

export class DemoStaffRepository implements StaffRepository {
  private s = demoStore();
  constructor(private viewerId: UUID) {
    const me = this.s.profiles.find((p) => p.id === viewerId);
    if (!me || !STAFF_ROLES.includes(me.role)) throw new ForbiddenError();
  }

  private person(id: UUID | null): PersonSummary | null {
    const p = id ? this.s.profiles.find((x) => x.id === id) : null;
    return p ? summary(p) : null;
  }

  private request(id: UUID) {
    const r = this.s.requests.find((x) => x.id === id);
    if (!r) throw new NotFoundError("Request not found");
    return r;
  }

  async queue(filters: QueueFilters): Promise<QueueItem[]> {
    const status = filters.status ?? "open";
    return this.s.requests
      .filter((r) => (status === "all" ? true : status === "open" ? isOpen(r.status) : r.status === status))
      .filter((r) =>
        filters.assignee === "me"
          ? r.assigneeId === this.viewerId
          : filters.assignee === "unassigned"
            ? r.assigneeId === null
            : true,
      )
      .filter((r) => (!filters.priority || filters.priority === "all" ? true : r.priority === filters.priority))
      .map((r) => ({
        ...r,
        member: this.person(r.memberId)!,
        assignee: this.person(r.assigneeId),
        isFounding: this.s.memberships.find((m) => m.memberId === r.memberId)?.isFounding ?? false,
      }))
      .sort(queueOrder);
  }

  async getRequest(id: UUID): Promise<StaffRequestDetail> {
    const request = this.request(id);
    const member = this.s.profiles.find((p) => p.id === request.memberId)!;
    return {
      request,
      member,
      membership: this.s.memberships.find((m) => m.memberId === member.id) ?? null,
      preferences: this.s.preferences.filter((p) => p.memberId === member.id),
      messages: this.s.messages.filter((m) => m.requestId === id).sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
      options: this.s.options.filter((o) => o.requestId === id).sort((a, b) => a.sortOrder - b.sortOrder),
      events: this.s.events.filter((e) => e.requestId === id).sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
      aiEvents: this.s.aiEvents.filter((e) => e.requestId === id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      staff: await this.listStaff(),
      providers: this.s.providers.filter((p) => p.status !== "removed"),
    };
  }

  async updateRequest(id: UUID, patch: StaffRequestPatch) {
    const r = this.request(id);
    if (patch.status && patch.status !== r.status) {
      if (!canTransition(r.status, patch.status)) {
        throw new DomainError(`A request cannot move from ${r.status.replace("_", " ")} to ${patch.status.replace("_", " ")}.`);
      }
      pushEvent(this.s, { requestId: id, kind: "status_changed", fromStatus: r.status, toStatus: patch.status, actorId: this.viewerId, note: null });
      r.status = patch.status;
    }
    if (patch.assigneeId !== undefined && patch.assigneeId !== r.assigneeId) {
      pushEvent(this.s, { requestId: id, kind: "assigned", fromStatus: null, toStatus: null, actorId: this.viewerId, note: patch.assigneeId });
      r.assigneeId = patch.assigneeId;
    }
    const { status: _s, assigneeId: _a, ...rest } = patch;
    for (const [k, v] of Object.entries(rest)) if (v !== undefined) Object.assign(r, { [k]: v });
    r.updatedAt = nowIso();
  }

  async postMessage(requestId: UUID, body: string, visibility: MessageVisibility) {
    const r = this.request(requestId);
    const me = this.s.profiles.find((p) => p.id === this.viewerId)!;
    const createdAt = nowIso();
    this.s.messages.push({
      id: newId(),
      requestId,
      authorId: me.id,
      authorKind: "concierge",
      authorName: me.preferredName ?? me.fullName,
      body,
      visibility,
      createdAt,
    });
    if (visibility === "member" && !r.firstRespondedAt) r.firstRespondedAt = createdAt;
    r.updatedAt = createdAt;
  }

  async createOption(requestId: UUID, input: NewOptionInput) {
    this.request(requestId);
    const existing = this.s.options.filter((o) => o.requestId === requestId);
    this.s.options.push({
      id: newId(),
      requestId,
      providerId: input.providerId,
      title: input.title,
      summary: input.summary,
      price: input.priceMajor !== null ? { amountMinor: input.priceMajor, currency: input.currency } : null,
      status: input.present ? "presented" : "draft",
      expiresAt: input.expiresAt,
      respondedAt: null,
      sortOrder: existing.length + 1,
      createdAt: nowIso(),
    });
    if (input.present) {
      pushEvent(this.s, { requestId, kind: "option_presented", fromStatus: null, toStatus: null, actorId: this.viewerId, note: input.title });
    }
  }

  async setOptionStatus(optionId: UUID, status: "presented" | "withdrawn") {
    const o = this.s.options.find((x) => x.id === optionId);
    if (!o) throw new NotFoundError("Option not found");
    if (status === "presented" && o.status !== "draft") throw new DomainError("Only drafts can be presented.");
    if (status === "withdrawn" && !["draft", "presented"].includes(o.status)) {
      throw new DomainError("This option can no longer be withdrawn.");
    }
    o.status = status;
    if (status === "presented") {
      pushEvent(this.s, { requestId: o.requestId, kind: "option_presented", fromStatus: null, toStatus: null, actorId: this.viewerId, note: o.title });
    }
  }

  async listMembers(): Promise<MemberListItem[]> {
    return this.s.profiles
      .filter((p) => p.role === "member")
      .map((profile) => {
        const membership = this.s.memberships.find((m) => m.memberId === profile.id) ?? null;
        const requests = this.s.requests.filter((r) => r.memberId === profile.id);
        return {
          profile,
          membership,
          tierName: membership ? (this.s.tiers.find((t) => t.id === membership.tierId)?.name ?? null) : null,
          openRequests: requests.filter((r) => isOpen(r.status)).length,
          lastRequestAt: requests.map((r) => r.createdAt).sort().at(-1) ?? null,
          relationshipOwner: this.person(membership?.relationshipOwnerId ?? null),
        };
      })
      .sort((a, b) => (a.membership?.memberNumber ?? "").localeCompare(b.membership?.memberNumber ?? ""));
  }

  async member360(id: UUID): Promise<Member360> {
    const profile = this.s.profiles.find((p) => p.id === id);
    if (!profile) throw new NotFoundError("Member not found");
    const membership = this.s.memberships.find((m) => m.memberId === id) ?? null;
    return {
      profile,
      membership,
      tier: membership ? (this.s.tiers.find((t) => t.id === membership.tierId) ?? null) : null,
      preferences: this.s.preferences.filter((p) => p.memberId === id),
      people: this.s.people.filter((p) => p.memberId === id),
      requests: this.s.requests.filter((r) => r.memberId === id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      journeys: this.s.journeys.filter((j) => j.memberId === id),
      founding: this.s.foundingMembers.find((f) => f.memberId === id) ?? null,
      relationshipOwner: this.person(membership?.relationshipOwnerId ?? null),
      summaries: this.s.aiEvents.filter((e) => e.memberId === id && e.kind === "summary"),
      staff: await this.listStaff(),
    };
  }

  async activateMembership(memberId: UUID) {
    const m = this.s.memberships.find((x) => x.memberId === memberId);
    if (!m) throw new NotFoundError("Membership not found");
    if (m.status !== "pending_activation" && m.status !== "paused") throw new DomainError("Membership is not awaiting activation.");
    m.status = "active";
    m.startedAt = nowIso();
    m.renewsAt = new Date(Date.now() + 365 * 86_400_000).toISOString();
  }

  async assignRelationshipOwner(memberId: UUID, ownerId: UUID | null) {
    const m = this.s.memberships.find((x) => x.memberId === memberId);
    if (!m) throw new NotFoundError("Membership not found");
    m.relationshipOwnerId = ownerId;
  }

  async listProviders(): Promise<Provider[]> {
    return [...this.s.providers].sort((a, b) => a.name.localeCompare(b.name));
  }

  async getProvider(id: UUID) {
    const p = this.s.providers.find((x) => x.id === id);
    if (!p) throw new NotFoundError("Provider not found");
    return p;
  }

  async createProvider(input: ProviderInput) {
    const id = newId();
    this.s.providers.push({
      id,
      name: input.name,
      categorySlug: input.categorySlug,
      marketId: input.marketId,
      status: input.status,
      isFounding: input.isFounding,
      website: input.website,
      contactName: input.contactName,
      contactEmail: input.contactEmail,
      contactPhone: input.contactPhone,
      termsSummary: input.termsSummary,
      notes: input.notes,
      testRequestStatus: "not_started",
      performanceScore: null,
      createdAt: nowIso(),
    });
    if (input.isFounding) {
      this.s.foundingProviders.push({
        id: newId(),
        providerId: id,
        vettingStatus: "not_started",
        termsStatus: "not_started",
        testRequestStatus: "not_started",
        performanceNote: null,
        preferredStatus: false,
      });
    }
    return id;
  }

  async updateProviderStatus(id: UUID, status: ProviderStatus) {
    const p = await this.getProvider(id);
    p.status = status;
  }

  async listApplications() {
    return [...this.s.applications].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  }

  async getApplication(id: UUID) {
    const a = this.s.applications.find((x) => x.id === id);
    if (!a) throw new NotFoundError("Application not found");
    return a;
  }

  async decideApplication(id: UUID, status: ApplicationStatus, note: string | null) {
    const a = await this.getApplication(id);
    a.status = status;
    a.reviewerId = this.viewerId;
    a.decisionNote = note;
    a.decidedAt = ["approved", "declined", "waitlisted"].includes(status) ? nowIso() : null;
  }

  async listPartnerApplications() {
    return [...this.s.partnerApplications];
  }

  async cohort(): Promise<CohortView> {
    return {
      target: { members: 25, providers: 25 },
      members: this.s.foundingMembers.map((f) => ({ ...f, owner: this.person(f.relationshipOwnerId) })),
      providers: this.s.foundingProviders.map((f) => ({ ...f, provider: this.s.providers.find((p) => p.id === f.providerId)! })),
    };
  }

  async settings(): Promise<SettingsView> {
    return {
      markets: [...this.s.markets],
      tiers: this.s.tiers.map((t) => tierWithPrivileges(this.s, t.id)!),
      categories: [...this.s.categories],
      slas: [...this.s.slas],
      fees: [...this.s.fees],
      cardPrograms: [...this.s.cardPrograms],
      templates: [...this.s.templates],
    };
  }

  async analytics(): Promise<AnalyticsView> {
    return summarizeAnalytics({
      applications: this.s.applications,
      memberships: this.s.memberships,
      requests: this.s.requests,
      options: this.s.options,
      providers: this.s.providers,
      aiEvents: this.s.aiEvents,
      categories: this.s.categories,
    });
  }

  async recordAiEvent(input: AiEventInput): Promise<AiEvent> {
    const event: AiEvent = { id: newId(), ...input, reviewedBy: null, reviewedAt: null, createdAt: nowIso() };
    this.s.aiEvents.unshift(event);
    return event;
  }

  async reviewAiEvent(id: UUID, status: AiReviewStatus) {
    const e = this.s.aiEvents.find((x) => x.id === id);
    if (!e) throw new NotFoundError("AI event not found");
    e.status = status;
    e.reviewedBy = this.viewerId;
    e.reviewedAt = nowIso();
  }

  async listStaff(): Promise<PersonSummary[]> {
    return this.s.profiles.filter((p) => STAFF_ROLES.includes(p.role)).map(summary);
  }

  async addPreferenceForMember(memberId: UUID, input: PreferenceInput) {
    this.s.preferences.push({ id: newId(), memberId, ...input, source: "concierge", updatedAt: nowIso() });
  }
}

