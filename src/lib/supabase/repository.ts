import "server-only";
import type { PostgrestError } from "@supabase/supabase-js";
import { deriveTitle, isOpen, queueOrder } from "@/lib/domain/requests";
import type { AiReviewStatus, ApplicationStatus, MessageVisibility, Profile, ProviderStatus, UUID } from "@/lib/domain/types";
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
import { summarizeAnalytics } from "@/lib/data/analytics";
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
import type { Json, TablesUpdate } from "./database.types";
import * as map from "./mappers";
import { supabaseAdmin, type BiluxrSupabase } from "./server";

/**
 * Supabase-backed repositories. Queries run as the signed-in user; RLS is the
 * final authority on what each role may read or change. Joins are resolved in
 * application code to keep queries simple and predictable.
 */

function fail(error: PostgrestError | null, fallback = "Something went wrong"): never {
  if (!error) throw new Error(fallback);
  if (error.code === "PGRST116" || error.code === "P0002") throw new NotFoundError(error.message);
  if (error.code === "42501" || /row-level security/i.test(error.message)) throw new ForbiddenError(error.message);
  if (error.code === "P0001" || error.code === "22023") throw new DomainError(error.message);
  throw new Error(`${fallback}: ${error.message}`);
}

function ok<T>(res: { data: T; error: PostgrestError | null }, what?: string): NonNullable<T> {
  if (res.error || res.data === null || res.data === undefined) fail(res.error, what);
  return res.data as NonNullable<T>;
}

function summary(p: Profile): PersonSummary {
  const name = p.preferredName ? `${p.preferredName} ${p.fullName.split(" ").slice(1).join(" ")}`.trim() : p.fullName;
  return { id: p.id, name, initials: initials(p.fullName) };
}

async function tiersWithPrivileges(db: BiluxrSupabase, onlyActive: boolean): Promise<TierWithPrivileges[]> {
  let q = db.from("membership_tiers").select("*").order("sort_order");
  if (onlyActive) q = q.eq("is_active", true);
  const tiers = ok(await q).map(map.toTier);
  const privileges = ok(await db.from("privileges").select("*").order("sort_order")).map(map.toPrivilege);
  return tiers.map((t) => ({ ...t, privileges: privileges.filter((p) => p.tierId === t.id) }));
}

export class SupabasePublicRepository implements PublicRepository {
  constructor(private db: BiluxrSupabase) {}

  async listMarkets() {
    return ok(await this.db.from("markets").select("*").order("sort_order")).map(map.toMarket);
  }
  async listPublicTiers() {
    return tiersWithPrivileges(this.db, true);
  }
  async listCategories() {
    return ok(await this.db.from("request_categories").select("*").eq("is_active", true).order("sort_order")).map(
      map.toCategory,
    );
  }
  async submitApplication(input: ApplicationInput) {
    const { error } = await this.db.from("applications").insert({
      full_name: input.fullName,
      email: input.email,
      phone: input.phone,
      city: input.city,
      market_slug: input.marketSlug,
      occupation: input.occupation,
      referral_source: input.referralSource,
      invitation_code: input.invitationCode,
      answers: { lifeInMotion: input.lifeInMotion, whatWouldHelp: input.whatWouldHelp },
    });
    if (error) fail(error, "Could not submit application");
  }
  async submitPartnerApplication(input: PartnerApplicationInput) {
    const { error } = await this.db.from("partner_applications").insert({
      organization: input.organization,
      contact_name: input.contactName,
      email: input.email,
      phone: input.phone,
      category_slug: input.categorySlug,
      city: input.city,
      website: input.website,
      message: input.message,
    });
    if (error) fail(error, "Could not submit partner application");
  }
  async submitContact(input: ContactInput) {
    const { error } = await this.db.from("contact_inquiries").insert(input);
    if (error) fail(error, "Could not send message");
  }
  async checkInvitation(code: string) {
    const { data, error } = await this.db.rpc("check_invitation", { code });
    if (error) fail(error);
    return data === true;
  }
}

async function loadViewer(db: BiluxrSupabase, viewerId: UUID): Promise<Viewer> {
  const profile = map.toProfile(ok(await db.from("profiles").select("*").eq("id", viewerId).single(), "Profile"));
  const m = await db.from("memberships").select("*").eq("member_id", viewerId).maybeSingle();
  if (m.error) fail(m.error);
  return { profile, membership: m.data ? map.toMembership(m.data) : null };
}

export class SupabaseMemberRepository implements MemberRepository {
  constructor(
    private db: BiluxrSupabase,
    private viewerId: UUID,
  ) {}

  async home(): Promise<MemberHome> {
    const viewer = await loadViewer(this.db, this.viewerId);
    let owner: PersonSummary | null = null;
    if (viewer.membership?.relationshipOwnerId) {
      const res = await this.db
        .from("profiles")
        .select("*")
        .eq("id", viewer.membership.relationshipOwnerId)
        .maybeSingle();
      if (res.data) owner = summary(map.toProfile(res.data));
    }
    const tier = viewer.membership
      ? map.toTier(ok(await this.db.from("membership_tiers").select("*").eq("id", viewer.membership.tierId).single()))
      : null;
    const today = new Date().toISOString().slice(0, 10);
    const journeys = ok(
      await this.db
        .from("journeys")
        .select("*")
        .eq("member_id", this.viewerId)
        .not("status", "in", "(cancelled,completed)")
        .or(`ends_on.is.null,ends_on.gte.${today}`)
        .order("starts_on", { ascending: true, nullsFirst: false }),
    ).map(map.toJourney);
    return {
      viewer,
      tier,
      relationshipOwner: owner,
      activeRequests: (await this.listRequests()).filter((r) => isOpen(r.status)),
      upcomingJourneys: journeys,
    };
  }

  async listRequests(): Promise<RequestSummary[]> {
    const requests = ok(
      await this.db.from("requests").select("*").eq("member_id", this.viewerId).order("updated_at", { ascending: false }),
    ).map(map.toRequest);
    if (requests.length === 0) return [];
    const ids = requests.map((r) => r.id);
    const options = ok(await this.db.from("request_options").select("*").in("request_id", ids)).map(map.toOption);
    const messages = ok(
      await this.db.from("request_messages").select("request_id, created_at").in("request_id", ids).order("created_at"),
    );
    return requests.map((r) => ({
      ...r,
      options: options.filter((o) => o.requestId === r.id),
      lastMessageAt: messages.filter((m) => m.request_id === r.id).at(-1)?.created_at ?? null,
    }));
  }

  async getRequest(id: UUID): Promise<MemberRequestDetail> {
    const request = map.toRequest(ok(await this.db.from("requests").select("*").eq("id", id).single(), "Request"));
    const [messages, options, events] = await Promise.all([
      this.db.from("request_messages").select("*").eq("request_id", id).order("created_at"),
      this.db.from("request_options").select("*").eq("request_id", id).order("sort_order"),
      this.db.from("request_events").select("*").eq("request_id", id).order("created_at"),
    ]);
    let assignee: PersonSummary | null = null;
    if (request.assigneeId) {
      // Members may only see their relationship owner's profile; others stay anonymous as "Your concierge".
      const res = await this.db.from("profiles").select("*").eq("id", request.assigneeId).maybeSingle();
      if (res.data) assignee = summary(map.toProfile(res.data));
    }
    return {
      request,
      messages: ok(messages).map(map.toMessage),
      options: ok(options).map(map.toOption),
      events: ok(events).map(map.toEvent),
      assignee,
    };
  }

  async createRequest(input: NewRequestInput) {
    const viewer = await loadViewer(this.db, this.viewerId);
    if (viewer.membership?.status !== "active") {
      throw new DomainError("Your membership is not yet active. Your concierge will be in touch to complete activation.");
    }
    const categories = input.categorySlug
      ? ok(await this.db.from("request_categories").select("*").eq("slug", input.categorySlug)).map(map.toCategory)
      : [];
    const row = ok(
      await this.db
        .from("requests")
        .insert({
          member_id: this.viewerId,
          title: input.title ?? deriveTitle(input.brief),
          brief: input.brief,
          category_slug: input.categorySlug,
          vertical: categories[0]?.vertical ?? "concierge",
          priority: input.priority,
          journey_id: input.journeyId ?? null,
          market_id: viewer.profile.homeMarketId,
          timezone: viewer.profile.timezone,
        })
        .select("*")
        .single(),
      "Could not create request",
    );
    const { error } = await this.db.from("request_messages").insert({
      request_id: row.id,
      author_id: this.viewerId,
      author_kind: "member",
      body: input.brief,
      visibility: "member",
    });
    if (error) fail(error);
    return map.toRequest(row);
  }

  async postMessage(requestId: UUID, body: string) {
    const { error } = await this.db.from("request_messages").insert({
      request_id: requestId,
      author_id: this.viewerId,
      author_kind: "member",
      body,
      visibility: "member",
    });
    if (error) {
      if (/row-level security/i.test(error.message)) {
        throw new DomainError("This request is closed. Start a new request and we'll pick it up.");
      }
      fail(error);
    }
  }

  async respondToOption(optionId: UUID, decision: "accept" | "decline") {
    const { error } = await this.db.rpc("member_respond_to_option", { option_id: optionId, decision });
    if (error) fail(error);
  }

  async cancelRequest(requestId: UUID, reason: string | null) {
    const { error } = await this.db.rpc("member_cancel_request", { target: requestId, reason: reason ?? undefined });
    if (error) fail(error);
  }

  async listJourneys() {
    return ok(
      await this.db.from("journeys").select("*").eq("member_id", this.viewerId).order("starts_on", { nullsFirst: false }),
    ).map(map.toJourney);
  }

  async getJourney(id: UUID) {
    const journey = map.toJourney(ok(await this.db.from("journeys").select("*").eq("id", id).single(), "Journey"));
    const items = ok(
      await this.db.from("journey_items").select("*").eq("journey_id", id).order("starts_at", { nullsFirst: false }),
    ).map(map.toJourneyItem);
    return { journey, items };
  }

  async listAccessOffers() {
    return ok(await this.db.from("access_offers").select("*").eq("status", "published")).map(map.toAccessOffer);
  }

  async listInvitations() {
    return ok(
      await this.db.from("invitations").select("*").eq("inviter_id", this.viewerId).order("created_at", { ascending: false }),
    ).map(map.toInvitation);
  }

  async issueInvitation(email: string, name: string) {
    const { data, error } = await this.db.rpc("member_issue_invitation", { invitee_email: email, invitee_name: name });
    if (error) fail(error);
    const code = data?.[0]?.code;
    if (!code) throw new Error("Invitation was not created");
    return { code };
  }

  async membership(): Promise<MembershipDetail> {
    const viewer = await loadViewer(this.db, this.viewerId);
    const tiers = viewer.membership ? await tiersWithPrivileges(this.db, false) : [];
    const tier = tiers.find((t) => t.id === viewer.membership?.tierId) ?? null;
    const cards = ok(await this.db.from("member_cards").select("*").eq("member_id", this.viewerId)).map(map.toCard);
    const programs = cards.length
      ? ok(await this.db.from("card_programs").select("*").in("id", cards.map((c) => c.programId))).map(map.toCardProgram)
      : [];
    const invitations = await this.listInvitations();
    return {
      membership: viewer.membership,
      tier,
      cards: cards
        .map((c) => ({ ...c, program: programs.find((p) => p.id === c.programId) }))
        .filter((c): c is typeof c & { program: NonNullable<typeof c.program> } => Boolean(c.program)),
      invitationAllowance: tier?.invitationAllowance ?? 0,
      invitationsUsed: invitations.filter((i) => i.status === "issued" || i.status === "accepted").length,
    };
  }

  async profile(): Promise<ProfileBundle> {
    const { profile } = await loadViewer(this.db, this.viewerId);
    const [prefs, people] = await Promise.all([
      this.db.from("member_preferences").select("*").eq("member_id", this.viewerId).order("domain"),
      this.db.from("member_people").select("*").eq("member_id", this.viewerId).order("created_at"),
    ]);
    return { profile, preferences: ok(prefs).map(map.toPreference), people: ok(people).map(map.toPerson) };
  }

  async updateProfile(input: ProfileUpdateInput) {
    const { error } = await this.db
      .from("profiles")
      .update({
        full_name: input.fullName,
        preferred_name: input.preferredName,
        phone: input.phone,
        timezone: input.timezone,
      })
      .eq("id", this.viewerId);
    if (error) fail(error);
  }

  async addPreference(input: PreferenceInput) {
    const { error } = await this.db
      .from("member_preferences")
      .insert({ member_id: this.viewerId, domain: input.domain, label: input.label, value: input.value, source: "member" });
    if (error) fail(error);
  }

  async removePreference(id: UUID) {
    const { error } = await this.db.from("member_preferences").delete().eq("id", id).eq("member_id", this.viewerId);
    if (error) fail(error);
  }

  async addPerson(input: PersonInput) {
    const { error } = await this.db.from("member_people").insert({ member_id: this.viewerId, ...input });
    if (error) fail(error);
  }

  async removePerson(id: UUID) {
    const { error } = await this.db.from("member_people").delete().eq("id", id).eq("member_id", this.viewerId);
    if (error) fail(error);
  }
}

export class SupabaseStaffRepository implements StaffRepository {
  constructor(
    private db: BiluxrSupabase,
    private viewerId: UUID,
  ) {}

  private async profilesById(ids: (UUID | null)[]): Promise<Map<UUID, Profile>> {
    const unique = [...new Set(ids.filter((x): x is UUID => Boolean(x)))];
    if (unique.length === 0) return new Map();
    const rows = ok(await this.db.from("profiles").select("*").in("id", unique)).map(map.toProfile);
    return new Map(rows.map((p) => [p.id, p]));
  }

  async listStaff(): Promise<PersonSummary[]> {
    return ok(await this.db.from("profiles").select("*").in("role", ["concierge", "admin"]).order("full_name"))
      .map(map.toProfile)
      .map(summary);
  }

  async queue(filters: QueueFilters): Promise<QueueItem[]> {
    let q = this.db.from("requests").select("*");
    const status = filters.status ?? "open";
    if (status === "open") q = q.not("status", "in", "(completed,cancelled)");
    else if (status !== "all") q = q.eq("status", status);
    if (filters.assignee === "me") q = q.eq("assignee_id", this.viewerId);
    if (filters.assignee === "unassigned") q = q.is("assignee_id", null);
    if (filters.priority && filters.priority !== "all") q = q.eq("priority", filters.priority);
    const requests = ok(await q.limit(500)).map(map.toRequest);
    const people = await this.profilesById(requests.flatMap((r) => [r.memberId, r.assigneeId]));
    const memberships = requests.length
      ? ok(await this.db.from("memberships").select("member_id, is_founding").in("member_id", requests.map((r) => r.memberId)))
      : [];
    return requests
      .map((r) => {
        const member = people.get(r.memberId);
        return {
          ...r,
          member: member ? summary(member) : { id: r.memberId, name: "Member", initials: "·" },
          assignee: r.assigneeId && people.get(r.assigneeId) ? summary(people.get(r.assigneeId)!) : null,
          isFounding: memberships.find((m) => m.member_id === r.memberId)?.is_founding ?? false,
        };
      })
      .sort(queueOrder);
  }

  async getRequest(id: UUID): Promise<StaffRequestDetail> {
    const request = map.toRequest(ok(await this.db.from("requests").select("*").eq("id", id).single(), "Request"));
    const [member, membership, prefs, messages, options, events, ai, providers, staff] = await Promise.all([
      this.db.from("profiles").select("*").eq("id", request.memberId).single(),
      this.db.from("memberships").select("*").eq("member_id", request.memberId).maybeSingle(),
      this.db.from("member_preferences").select("*").eq("member_id", request.memberId),
      this.db.from("request_messages").select("*").eq("request_id", id).order("created_at"),
      this.db.from("request_options").select("*").eq("request_id", id).order("sort_order"),
      this.db.from("request_events").select("*").eq("request_id", id).order("created_at"),
      this.db.from("ai_events").select("*").eq("request_id", id).order("created_at", { ascending: false }),
      this.db.from("providers").select("*").neq("status", "removed").order("name"),
      this.listStaff(),
    ]);
    return {
      request,
      member: map.toProfile(ok(member)),
      membership: membership.data ? map.toMembership(membership.data) : null,
      preferences: ok(prefs).map(map.toPreference),
      messages: ok(messages).map(map.toMessage),
      options: ok(options).map(map.toOption),
      events: ok(events).map(map.toEvent),
      aiEvents: ok(ai).map(map.toAiEvent),
      providers: ok(providers).map(map.toProvider),
      staff,
    };
  }

  async updateRequest(id: UUID, patch: StaffRequestPatch) {
    const update: TablesUpdate<"requests"> = {};
    if (patch.status !== undefined) update.status = patch.status;
    if (patch.assigneeId !== undefined) update.assignee_id = patch.assigneeId;
    if (patch.priority !== undefined) update.priority = patch.priority;
    if (patch.title !== undefined) update.title = patch.title;
    if (patch.categorySlug !== undefined) update.category_slug = patch.categorySlug;
    if (patch.vertical !== undefined) update.vertical = patch.vertical;
    if (patch.location !== undefined) update.location = patch.location;
    if (patch.partySize !== undefined) update.party_size = patch.partySize;
    if (patch.startsAt !== undefined) update.starts_at = patch.startsAt;
    if (patch.endsAt !== undefined) update.ends_at = patch.endsAt;
    if (patch.timezone !== undefined) update.timezone = patch.timezone;
    if (patch.marketId !== undefined) update.market_id = patch.marketId;
    const { error } = await this.db.from("requests").update(update).eq("id", id);
    if (error) fail(error);
  }

  async postMessage(requestId: UUID, body: string, visibility: MessageVisibility) {
    const { error } = await this.db
      .from("request_messages")
      .insert({ request_id: requestId, author_id: this.viewerId, author_kind: "concierge", body, visibility });
    if (error) fail(error);
  }

  async createOption(requestId: UUID, input: NewOptionInput) {
    const count = ok(await this.db.from("request_options").select("id").eq("request_id", requestId)).length;
    const { error } = await this.db.from("request_options").insert({
      request_id: requestId,
      provider_id: input.providerId,
      title: input.title,
      summary: input.summary,
      price_minor: input.priceMajor,
      price_currency: input.priceMajor !== null ? input.currency : null,
      status: input.present ? "presented" : "draft",
      expires_at: input.expiresAt,
      sort_order: count + 1,
    });
    if (error) fail(error);
    if (input.present) {
      await this.db
        .from("request_events")
        .insert({ request_id: requestId, kind: "option_presented", actor_id: this.viewerId, note: input.title });
    }
  }

  async setOptionStatus(optionId: UUID, status: "presented" | "withdrawn") {
    const option = map.toOption(ok(await this.db.from("request_options").select("*").eq("id", optionId).single()));
    if (status === "presented" && option.status !== "draft") throw new DomainError("Only drafts can be presented.");
    if (status === "withdrawn" && !["draft", "presented"].includes(option.status)) {
      throw new DomainError("This option can no longer be withdrawn.");
    }
    const { error } = await this.db.from("request_options").update({ status }).eq("id", optionId);
    if (error) fail(error);
    if (status === "presented") {
      await this.db
        .from("request_events")
        .insert({ request_id: option.requestId, kind: "option_presented", actor_id: this.viewerId, note: option.title });
    }
  }

  async listMembers(): Promise<MemberListItem[]> {
    const profiles = ok(await this.db.from("profiles").select("*").eq("role", "member")).map(map.toProfile);
    if (profiles.length === 0) return [];
    const ids = profiles.map((p) => p.id);
    const [memberships, requests, tiers] = await Promise.all([
      this.db.from("memberships").select("*").in("member_id", ids),
      this.db.from("requests").select("member_id, status, created_at").in("member_id", ids),
      this.db.from("membership_tiers").select("*"),
    ]);
    const ms = ok(memberships).map(map.toMembership);
    const owners = await this.profilesById(ms.map((m) => m.relationshipOwnerId));
    const reqs = ok(requests);
    const ts = ok(tiers).map(map.toTier);
    return profiles
      .map((profile) => {
        const membership = ms.find((m) => m.memberId === profile.id) ?? null;
        const mine = reqs.filter((r) => r.member_id === profile.id);
        const owner = membership?.relationshipOwnerId ? owners.get(membership.relationshipOwnerId) : undefined;
        return {
          profile,
          membership,
          tierName: ts.find((t) => t.id === membership?.tierId)?.name ?? null,
          openRequests: mine.filter((r) => isOpen(r.status)).length,
          lastRequestAt: mine.map((r) => r.created_at).sort().at(-1) ?? null,
          relationshipOwner: owner ? summary(owner) : null,
        };
      })
      .sort((a, b) => (a.membership?.memberNumber ?? "").localeCompare(b.membership?.memberNumber ?? ""));
  }

  async member360(id: UUID): Promise<Member360> {
    const [profile, membership, prefs, people, requests, journeys, founding, summaries, staff] = await Promise.all([
      this.db.from("profiles").select("*").eq("id", id).single(),
      this.db.from("memberships").select("*").eq("member_id", id).maybeSingle(),
      this.db.from("member_preferences").select("*").eq("member_id", id),
      this.db.from("member_people").select("*").eq("member_id", id),
      this.db.from("requests").select("*").eq("member_id", id).order("created_at", { ascending: false }),
      this.db.from("journeys").select("*").eq("member_id", id).order("starts_on"),
      this.db.from("founding_members").select("*").eq("member_id", id).maybeSingle(),
      this.db.from("ai_events").select("*").eq("member_id", id).eq("kind", "summary").order("created_at", { ascending: false }),
      this.listStaff(),
    ]);
    const m = membership.data ? map.toMembership(membership.data) : null;
    const tier = m ? map.toTier(ok(await this.db.from("membership_tiers").select("*").eq("id", m.tierId).single())) : null;
    return {
      profile: map.toProfile(ok(profile, "Member")),
      membership: m,
      tier,
      preferences: ok(prefs).map(map.toPreference),
      people: ok(people).map(map.toPerson),
      requests: ok(requests).map(map.toRequest),
      journeys: ok(journeys).map(map.toJourney),
      founding: founding.data ? map.toFoundingMember(founding.data) : null,
      relationshipOwner: staff.find((s) => s.id === m?.relationshipOwnerId) ?? null,
      summaries: ok(summaries).map(map.toAiEvent),
      staff,
    };
  }

  async activateMembership(memberId: UUID) {
    const now = new Date();
    const { data, error } = await this.db
      .from("memberships")
      .update({
        status: "active",
        started_at: now.toISOString(),
        renews_at: new Date(now.getTime() + 365 * 86_400_000).toISOString(),
      })
      .eq("member_id", memberId)
      .in("status", ["pending_activation", "paused"])
      .select("id");
    if (error) fail(error);
    if (!data || data.length === 0) throw new DomainError("Membership is not awaiting activation.");
  }

  async assignRelationshipOwner(memberId: UUID, ownerId: UUID | null) {
    const { error } = await this.db.from("memberships").update({ relationship_owner_id: ownerId }).eq("member_id", memberId);
    if (error) fail(error);
  }

  async listProviders() {
    return ok(await this.db.from("providers").select("*").order("name")).map(map.toProvider);
  }

  async getProvider(id: UUID) {
    return map.toProvider(ok(await this.db.from("providers").select("*").eq("id", id).single(), "Provider"));
  }

  async createProvider(input: ProviderInput) {
    const row = ok(
      await this.db
        .from("providers")
        .insert({
          name: input.name,
          category_slug: input.categorySlug,
          market_id: input.marketId,
          status: input.status,
          is_founding: input.isFounding,
          website: input.website,
          contact_name: input.contactName,
          contact_email: input.contactEmail,
          contact_phone: input.contactPhone,
          terms_summary: input.termsSummary,
          notes: input.notes,
        })
        .select("id")
        .single(),
    );
    if (input.isFounding) await this.db.from("founding_providers").insert({ provider_id: row.id });
    return row.id;
  }

  async updateProviderStatus(id: UUID, status: ProviderStatus) {
    const { error } = await this.db.from("providers").update({ status }).eq("id", id);
    if (error) fail(error);
  }

  async listApplications() {
    return ok(await this.db.from("applications").select("*").order("submitted_at", { ascending: false })).map(
      map.toApplication,
    );
  }

  async getApplication(id: UUID) {
    return map.toApplication(ok(await this.db.from("applications").select("*").eq("id", id).single(), "Application"));
  }

  async decideApplication(id: UUID, status: ApplicationStatus, note: string | null) {
    const final = ["approved", "declined", "waitlisted"].includes(status);
    const { error } = await this.db
      .from("applications")
      .update({
        status,
        decision_note: note,
        reviewer_id: this.viewerId,
        decided_at: final ? new Date().toISOString() : null,
      })
      .eq("id", id);
    if (error) fail(error);
  }

  async listPartnerApplications() {
    return ok(await this.db.from("partner_applications").select("*").order("submitted_at", { ascending: false })).map(
      map.toPartnerApplication,
    );
  }

  async cohort(): Promise<CohortView> {
    const [members, providers, setting, staff] = await Promise.all([
      this.db.from("founding_members").select("*").order("created_at"),
      this.db.from("founding_providers").select("*").order("created_at"),
      this.db.from("app_settings").select("value").eq("key", "founding_cohort_target").maybeSingle(),
      this.listStaff(),
    ]);
    const fp = ok(providers).map(map.toFoundingProvider);
    const provs = fp.length
      ? ok(await this.db.from("providers").select("*").in("id", fp.map((p) => p.providerId))).map(map.toProvider)
      : [];
    const target = targetFrom(setting.data?.value ?? null);
    return {
      target,
      members: ok(members)
        .map(map.toFoundingMember)
        .map((f) => ({ ...f, owner: staff.find((s) => s.id === f.relationshipOwnerId) ?? null })),
      providers: fp
        .map((f) => ({ ...f, provider: provs.find((p) => p.id === f.providerId) }))
        .filter((f): f is typeof f & { provider: NonNullable<typeof f.provider> } => Boolean(f.provider)),
    };
  }

  async settings(): Promise<SettingsView> {
    const [markets, tiers, categories, slas, fees, cards, templates] = await Promise.all([
      this.db.from("markets").select("*").order("sort_order"),
      tiersWithPrivileges(this.db, false),
      this.db.from("request_categories").select("*").order("sort_order"),
      this.db.from("service_level_targets").select("*"),
      this.db.from("fee_rules").select("*").order("key"),
      this.db.from("card_programs").select("*"),
      this.db.from("notification_templates").select("*").order("key"),
    ]);
    return {
      markets: ok(markets).map(map.toMarket),
      tiers,
      categories: ok(categories).map(map.toCategory),
      slas: ok(slas).map(map.toSla),
      fees: ok(fees).map(map.toFee),
      cardPrograms: ok(cards).map(map.toCardProgram),
      templates: ok(templates).map(map.toTemplate),
    };
  }

  async analytics(): Promise<AnalyticsView> {
    const [applications, memberships, requests, options, providers, ai, categories] = await Promise.all([
      this.db.from("applications").select("*"),
      this.db.from("memberships").select("*"),
      this.db.from("requests").select("*"),
      this.db.from("request_options").select("*"),
      this.db.from("providers").select("*"),
      this.db.from("ai_events").select("*"),
      this.db.from("request_categories").select("*"),
    ]);
    return summarizeAnalytics({
      applications: ok(applications).map(map.toApplication),
      memberships: ok(memberships).map(map.toMembership),
      requests: ok(requests).map(map.toRequest),
      options: ok(options).map(map.toOption),
      providers: ok(providers).map(map.toProvider),
      aiEvents: ok(ai).map(map.toAiEvent),
      categories: ok(categories).map(map.toCategory),
    });
  }

  async recordAiEvent(input: AiEventInput) {
    // Staff sessions may write AI events directly under RLS.
    const row = ok(
      await this.db
        .from("ai_events")
        .insert({
          kind: input.kind,
          request_id: input.requestId,
          member_id: input.memberId,
          model: input.model,
          prompt_version: input.promptVersion,
          output: input.output as Json,
          status: input.status,
          latency_ms: input.latencyMs,
          input_tokens: input.inputTokens,
          output_tokens: input.outputTokens,
          error: input.error,
        })
        .select("*")
        .single(),
    );
    return map.toAiEvent(row);
  }

  async reviewAiEvent(id: UUID, status: AiReviewStatus) {
    const { error } = await this.db
      .from("ai_events")
      .update({ status, reviewed_by: this.viewerId, reviewed_at: new Date().toISOString() })
      .eq("id", id);
    if (error) fail(error);
  }

  async addPreferenceForMember(memberId: UUID, input: PreferenceInput) {
    const { error } = await this.db
      .from("member_preferences")
      .insert({ member_id: memberId, domain: input.domain, label: input.label, value: input.value, source: "concierge" });
    if (error) fail(error);
  }
}

function targetFrom(value: Json | null): { members: number; providers: number } {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const members = typeof value.members === "number" ? value.members : 25;
    const providers = typeof value.providers === "number" ? value.providers : 25;
    return { members, providers };
  }
  return { members: 25, providers: 25 };
}

/**
 * AI events for requests created by members are logged with the service role,
 * because members must never be able to write AI records themselves.
 */
export async function recordAiEventAsSystem(input: AiEventInput): Promise<boolean> {
  const admin = supabaseAdmin();
  if (!admin) return false;
  const { error } = await admin.from("ai_events").insert({
    kind: input.kind,
    request_id: input.requestId,
    member_id: input.memberId,
    model: input.model,
    prompt_version: input.promptVersion,
    output: input.output as Json,
    status: input.status,
    latency_ms: input.latencyMs,
    input_tokens: input.inputTokens,
    output_tokens: input.outputTokens,
    error: input.error,
  });
  return !error;
}
