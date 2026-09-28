import type {
  AccessOffer,
  AiEvent,
  Application,
  CardProgram,
  FeeRule,
  FoundingMember,
  FoundingProvider,
  Invitation,
  Journey,
  JourneyItem,
  Market,
  MemberCard,
  MemberPerson,
  MemberPreference,
  Membership,
  MembershipTier,
  Money,
  NotificationTemplate,
  PartnerApplication,
  Privilege,
  Profile,
  Provider,
  RequestCategory,
  RequestEvent,
  RequestMessage,
  RequestOption,
  ServiceLevelTarget,
  ServiceRequest,
} from "@/lib/domain/types";
import { initials } from "@/lib/format";
import type { Json, Tables } from "./database.types";

/** Row → domain mappers. The only place snake_case meets camelCase. */

function money(amount: number | null, currency: string | null): Money | null {
  return amount === null || !currency ? null : { amountMinor: amount, currency: currency.trim() };
}

function record(json: Json): Record<string, unknown> {
  return json && typeof json === "object" && !Array.isArray(json)
    ? (json as Record<string, unknown>)
    : {};
}

function stringRecord(json: Json): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(record(json))) if (typeof v === "string") out[k] = v;
  return out;
}

export const toMarket = (r: Tables<"markets">): Market => ({
  id: r.id,
  slug: r.slug,
  name: r.name,
  region: r.region,
  timezone: r.timezone,
  currency: r.currency.trim(),
  status: r.status,
  sortOrder: r.sort_order,
});

export const toTier = (r: Tables<"membership_tiers">): MembershipTier => ({
  id: r.id,
  slug: r.slug,
  name: r.name,
  description: r.description,
  annualFee: money(r.annual_fee_minor, r.currency),
  initiationFee: money(r.initiation_fee_minor, r.currency),
  invitationAllowance: r.invitation_allowance,
  isActive: r.is_active,
  sortOrder: r.sort_order,
});

export const toPrivilege = (r: Tables<"privileges">): Privilege => ({
  id: r.id,
  tierId: r.tier_id,
  title: r.title,
  description: r.description,
  sortOrder: r.sort_order,
});

export const toCategory = (r: Tables<"request_categories">): RequestCategory => ({
  id: r.id,
  slug: r.slug,
  name: r.name,
  vertical: r.vertical,
  isActive: r.is_active,
  sortOrder: r.sort_order,
});

export const toSla = (r: Tables<"service_level_targets">): ServiceLevelTarget => ({
  priority: r.priority,
  firstResponseMinutes: r.first_response_minutes,
  optionsWithinHours: r.options_within_hours,
});

export const toFee = (r: Tables<"fee_rules">): FeeRule => ({
  id: r.id,
  key: r.key,
  label: r.label,
  kind: r.kind,
  basisPoints: r.basis_points,
  amount: money(r.amount_minor, r.currency),
  appliesTo: r.applies_to as FeeRule["appliesTo"],
  isActive: r.is_active,
});

export const toCardProgram = (r: Tables<"card_programs">): CardProgram => ({
  id: r.id,
  slug: r.slug,
  name: r.name,
  description: r.description,
  isActive: r.is_active,
});

export const toTemplate = (r: Tables<"notification_templates">): NotificationTemplate => ({
  id: r.id,
  key: r.key,
  channel: r.channel,
  subject: r.subject,
  body: r.body,
  isActive: r.is_active,
});

export const toProfile = (r: Tables<"profiles">): Profile => ({
  id: r.id,
  email: r.email,
  fullName: r.full_name || r.email.split("@")[0] || "Member",
  preferredName: r.preferred_name,
  phone: r.phone,
  role: r.role,
  timezone: r.timezone,
  homeMarketId: r.home_market_id,
  avatarInitials: initials(r.full_name || r.email),
  createdAt: r.created_at,
});

export const toMembership = (r: Tables<"memberships">): Membership => ({
  id: r.id,
  memberId: r.member_id,
  tierId: r.tier_id,
  status: r.status,
  memberNumber: r.member_number,
  startedAt: r.started_at,
  renewsAt: r.renews_at,
  relationshipOwnerId: r.relationship_owner_id,
  isFounding: r.is_founding,
  createdAt: r.created_at,
});

export const toCard = (r: Tables<"member_cards">): MemberCard => ({
  id: r.id,
  memberId: r.member_id,
  programId: r.program_id,
  status: r.status,
  lastFour: r.last_four,
  requestedAt: r.requested_at,
  issuedAt: r.issued_at,
});

export const toPreference = (r: Tables<"member_preferences">): MemberPreference => ({
  id: r.id,
  memberId: r.member_id,
  domain: r.domain,
  label: r.label,
  value: r.value,
  source: r.source === "concierge" ? "concierge" : "member",
  updatedAt: r.updated_at,
});

export const toPerson = (r: Tables<"member_people">): MemberPerson => ({
  id: r.id,
  memberId: r.member_id,
  name: r.name,
  relationship: r.relationship,
  notes: r.notes,
  birthday: r.birthday,
});

export const toApplication = (r: Tables<"applications">): Application => ({
  id: r.id,
  fullName: r.full_name,
  email: r.email,
  phone: r.phone,
  city: r.city,
  marketSlug: r.market_slug,
  occupation: r.occupation,
  referralSource: r.referral_source,
  invitationCode: r.invitation_code ? `••••${r.invitation_code.slice(-4)}` : null,
  answers: stringRecord(r.answers),
  status: r.status,
  reviewerId: r.reviewer_id,
  decisionNote: r.decision_note,
  submittedAt: r.submitted_at,
  decidedAt: r.decided_at,
});

export const toPartnerApplication = (r: Tables<"partner_applications">): PartnerApplication => ({
  id: r.id,
  organization: r.organization,
  contactName: r.contact_name,
  email: r.email,
  phone: r.phone,
  categorySlug: r.category_slug,
  city: r.city,
  website: r.website,
  message: r.message,
  status: r.status as PartnerApplication["status"],
  submittedAt: r.submitted_at,
});

export const toInvitation = (r: Tables<"invitations">): Invitation => ({
  id: r.id,
  inviterId: r.inviter_id,
  email: r.email,
  inviteeName: r.invitee_name,
  code: `••••${r.code_hint}`,
  status: r.status,
  applicationId: r.application_id,
  expiresAt: r.expires_at,
  createdAt: r.created_at,
});

export const toRequest = (r: Tables<"requests">): ServiceRequest => ({
  id: r.id,
  reference: r.reference,
  memberId: r.member_id,
  categorySlug: r.category_slug,
  vertical: r.vertical,
  title: r.title,
  brief: r.brief,
  status: r.status,
  priority: r.priority,
  marketId: r.market_id,
  assigneeId: r.assignee_id,
  startsAt: r.starts_at,
  endsAt: r.ends_at,
  timezone: r.timezone,
  partySize: r.party_size,
  budget: money(r.budget_minor, r.budget_currency),
  location: r.location,
  firstResponseDueAt: r.first_response_due_at,
  firstRespondedAt: r.first_responded_at,
  journeyId: r.journey_id,
  details: record(r.details),
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

export const toMessage = (r: Tables<"request_messages">): RequestMessage => ({
  id: r.id,
  requestId: r.request_id,
  authorId: r.author_id,
  authorKind: r.author_kind,
  authorName: r.author_name,
  body: r.body,
  visibility: r.visibility,
  createdAt: r.created_at,
});

export const toOption = (r: Tables<"request_options">): RequestOption => ({
  id: r.id,
  requestId: r.request_id,
  providerId: r.provider_id,
  title: r.title,
  summary: r.summary,
  price: money(r.price_minor, r.price_currency),
  status: r.status,
  expiresAt: r.expires_at,
  respondedAt: r.responded_at,
  sortOrder: r.sort_order,
  createdAt: r.created_at,
});

export const toEvent = (r: Tables<"request_events">): RequestEvent => ({
  id: r.id,
  requestId: r.request_id,
  kind: r.kind as RequestEvent["kind"],
  fromStatus: r.from_status,
  toStatus: r.to_status,
  actorId: r.actor_id,
  note: r.note,
  createdAt: r.created_at,
});

export const toJourney = (r: Tables<"journeys">): Journey => ({
  id: r.id,
  memberId: r.member_id,
  title: r.title,
  summary: r.summary,
  status: r.status,
  startsOn: r.starts_on,
  endsOn: r.ends_on,
  primaryMarketId: r.primary_market_id,
  createdAt: r.created_at,
});

export const toJourneyItem = (r: Tables<"journey_items">): JourneyItem => ({
  id: r.id,
  journeyId: r.journey_id,
  requestId: r.request_id,
  kind: r.kind,
  title: r.title,
  detail: r.detail,
  location: r.location,
  startsAt: r.starts_at,
  endsAt: r.ends_at,
  timezone: r.timezone,
  status: r.status,
  sortOrder: r.sort_order,
});

export const toProvider = (r: Tables<"providers">): Provider => ({
  id: r.id,
  name: r.name,
  categorySlug: r.category_slug,
  marketId: r.market_id,
  status: r.status,
  isFounding: r.is_founding,
  website: r.website,
  contactName: r.contact_name,
  contactEmail: r.contact_email,
  contactPhone: r.contact_phone,
  termsSummary: r.terms_summary,
  notes: r.notes,
  testRequestStatus: r.test_request_status as Provider["testRequestStatus"],
  performanceScore: r.performance_score,
  createdAt: r.created_at,
});

export const toAccessOffer = (r: Tables<"access_offers">): AccessOffer => ({
  id: r.id,
  title: r.title,
  summary: r.summary,
  detail: r.detail,
  providerId: r.provider_id,
  marketId: r.market_id,
  minimumTierSlug: r.minimum_tier_slug,
  availableFrom: r.available_from,
  availableUntil: r.available_until,
  status: r.status,
});

export const toAiEvent = (r: Tables<"ai_events">): AiEvent => ({
  id: r.id,
  kind: r.kind,
  requestId: r.request_id,
  memberId: r.member_id,
  model: r.model,
  promptVersion: r.prompt_version,
  output: record(r.output),
  status: r.status,
  reviewedBy: r.reviewed_by,
  reviewedAt: r.reviewed_at,
  latencyMs: r.latency_ms,
  inputTokens: r.input_tokens,
  outputTokens: r.output_tokens,
  error: r.error,
  createdAt: r.created_at,
});

export const toFoundingMember = (r: Tables<"founding_members">): FoundingMember => ({
  id: r.id,
  memberId: r.member_id,
  applicationId: r.application_id,
  displayName: r.display_name,
  referralSource: r.referral_source,
  relationshipOwnerId: r.relationship_owner_id,
  onboardingStatus: r.onboarding_status,
  preferencesCompleted: r.preferences_completed,
  firstRequestAt: r.first_request_at,
  satisfaction: r.satisfaction,
  referralPotential: r.referral_potential as FoundingMember["referralPotential"],
  notes: r.notes,
});

export const toFoundingProvider = (r: Tables<"founding_providers">): FoundingProvider => ({
  id: r.id,
  providerId: r.provider_id,
  vettingStatus: r.vetting_status as FoundingProvider["vettingStatus"],
  termsStatus: r.terms_status as FoundingProvider["termsStatus"],
  testRequestStatus: r.test_request_status as FoundingProvider["testRequestStatus"],
  performanceNote: r.performance_note,
  preferredStatus: r.preferred_status,
});
