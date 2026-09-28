/**
 * Biluxr domain model.
 *
 * These types mirror the Postgres schema in `supabase/migrations`. Enums are
 * declared once here as `as const` tuples so they can drive both TypeScript
 * types and runtime validation (zod) without drift.
 */

export const ROLES = ["applicant", "member", "concierge", "admin", "provider"] as const;
export type Role = (typeof ROLES)[number];
export const STAFF_ROLES: readonly Role[] = ["concierge", "admin"];

export const MARKET_STATUSES = ["planned", "preparing", "active", "paused"] as const;
export type MarketStatus = (typeof MARKET_STATUSES)[number];

export const MEMBERSHIP_STATUSES = [
  "pending_activation",
  "active",
  "paused",
  "lapsed",
  "cancelled",
] as const;
export type MembershipStatus = (typeof MEMBERSHIP_STATUSES)[number];

export const APPLICATION_STATUSES = [
  "submitted",
  "in_review",
  "conversation",
  "approved",
  "waitlisted",
  "declined",
  "withdrawn",
] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const INVITATION_STATUSES = ["issued", "accepted", "expired", "revoked"] as const;
export type InvitationStatus = (typeof INVITATION_STATUSES)[number];

export const REQUEST_STATUSES = [
  "received",
  "clarifying",
  "sourcing",
  "options_ready",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const REQUEST_PRIORITIES = ["standard", "priority", "urgent"] as const;
export type RequestPriority = (typeof REQUEST_PRIORITIES)[number];

/** Business verticals. Only `concierge` is built today; the rest are extension points. */
export const VERTICALS = ["concierge", "aviation", "residences", "private", "enterprise"] as const;
export type Vertical = (typeof VERTICALS)[number];

export const MESSAGE_AUTHOR_KINDS = ["member", "concierge", "system", "ai"] as const;
export type MessageAuthorKind = (typeof MESSAGE_AUTHOR_KINDS)[number];

export const MESSAGE_VISIBILITIES = ["member", "internal"] as const;
export type MessageVisibility = (typeof MESSAGE_VISIBILITIES)[number];

export const OPTION_STATUSES = ["draft", "presented", "accepted", "declined", "expired", "withdrawn"] as const;
export type OptionStatus = (typeof OPTION_STATUSES)[number];

export const JOURNEY_STATUSES = ["planning", "confirmed", "underway", "completed", "cancelled"] as const;
export type JourneyStatus = (typeof JOURNEY_STATUSES)[number];

export const JOURNEY_ITEM_KINDS = ["flight", "stay", "dining", "transfer", "experience", "event", "note"] as const;
export type JourneyItemKind = (typeof JOURNEY_ITEM_KINDS)[number];

export const JOURNEY_ITEM_STATUSES = ["tentative", "confirmed", "cancelled"] as const;
export type JourneyItemStatus = (typeof JOURNEY_ITEM_STATUSES)[number];

export const PROVIDER_STATUSES = ["prospect", "vetting", "approved", "preferred", "paused", "removed"] as const;
export type ProviderStatus = (typeof PROVIDER_STATUSES)[number];

export const ACCESS_OFFER_STATUSES = ["draft", "published", "archived"] as const;
export type AccessOfferStatus = (typeof ACCESS_OFFER_STATUSES)[number];

export const CARD_STATUSES = ["not_issued", "requested", "in_production", "issued", "suspended"] as const;
export type CardStatus = (typeof CARD_STATUSES)[number];

export const AI_EVENT_KINDS = ["intent_extraction", "clarification", "summary"] as const;
export type AiEventKind = (typeof AI_EVENT_KINDS)[number];

export const AI_REVIEW_STATUSES = ["proposed", "accepted", "edited", "dismissed", "failed"] as const;
export type AiReviewStatus = (typeof AI_REVIEW_STATUSES)[number];

export const ONBOARDING_STATUSES = [
  "not_started",
  "welcome_call",
  "preferences",
  "first_request",
  "established",
] as const;
export type OnboardingStatus = (typeof ONBOARDING_STATUSES)[number];

export const PREFERENCE_DOMAINS = [
  "travel",
  "stays",
  "dining",
  "wellness",
  "family",
  "communication",
  "gifting",
  "other",
] as const;
export type PreferenceDomain = (typeof PREFERENCE_DOMAINS)[number];

export type ISODate = string; // YYYY-MM-DD
export type ISODateTime = string; // RFC 3339
export type UUID = string;

export interface Money {
  amountMinor: number; // integer minor units (cents)
  currency: string; // ISO 4217
}

export interface Market {
  id: UUID;
  slug: string;
  name: string;
  region: string;
  timezone: string;
  currency: string;
  status: MarketStatus;
  sortOrder: number;
}

export interface Profile {
  id: UUID;
  email: string;
  fullName: string;
  preferredName: string | null;
  phone: string | null;
  role: Role;
  timezone: string;
  homeMarketId: UUID | null;
  avatarInitials: string;
  createdAt: ISODateTime;
}

export interface MembershipTier {
  id: UUID;
  slug: string;
  name: string;
  description: string;
  annualFee: Money | null;
  initiationFee: Money | null;
  invitationAllowance: number;
  isActive: boolean;
  sortOrder: number;
}

export interface Privilege {
  id: UUID;
  tierId: UUID;
  title: string;
  description: string;
  sortOrder: number;
}

export interface Membership {
  id: UUID;
  memberId: UUID;
  tierId: UUID;
  status: MembershipStatus;
  memberNumber: string;
  startedAt: ISODateTime | null;
  renewsAt: ISODateTime | null;
  relationshipOwnerId: UUID | null;
  isFounding: boolean;
  createdAt: ISODateTime;
}

export interface Application {
  id: UUID;
  fullName: string;
  email: string;
  phone: string | null;
  city: string;
  marketSlug: string | null;
  occupation: string | null;
  referralSource: string | null;
  invitationCode: string | null;
  answers: Record<string, string>;
  status: ApplicationStatus;
  reviewerId: UUID | null;
  decisionNote: string | null;
  submittedAt: ISODateTime;
  decidedAt: ISODateTime | null;
}

export interface Invitation {
  id: UUID;
  inviterId: UUID | null;
  email: string | null;
  inviteeName: string | null;
  code: string; // Plain code is only returned at creation time.
  status: InvitationStatus;
  applicationId: UUID | null;
  expiresAt: ISODateTime;
  createdAt: ISODateTime;
}

export interface RequestCategory {
  id: UUID;
  slug: string;
  name: string;
  vertical: Vertical;
  isActive: boolean;
  sortOrder: number;
}

export interface ServiceRequest {
  id: UUID;
  reference: string;
  memberId: UUID;
  categorySlug: string | null;
  vertical: Vertical;
  title: string;
  brief: string;
  status: RequestStatus;
  priority: RequestPriority;
  marketId: UUID | null;
  assigneeId: UUID | null;
  startsAt: ISODateTime | null;
  endsAt: ISODateTime | null;
  timezone: string | null;
  partySize: number | null;
  budget: Money | null;
  location: string | null;
  firstResponseDueAt: ISODateTime | null;
  firstRespondedAt: ISODateTime | null;
  journeyId: UUID | null;
  details: Record<string, unknown>;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface RequestMessage {
  id: UUID;
  requestId: UUID;
  authorId: UUID | null;
  authorKind: MessageAuthorKind;
  authorName: string;
  body: string;
  visibility: MessageVisibility;
  createdAt: ISODateTime;
}

export interface RequestOption {
  id: UUID;
  requestId: UUID;
  providerId: UUID | null;
  title: string;
  summary: string;
  price: Money | null;
  status: OptionStatus;
  expiresAt: ISODateTime | null;
  respondedAt: ISODateTime | null;
  sortOrder: number;
  createdAt: ISODateTime;
}

export interface RequestEvent {
  id: UUID;
  requestId: UUID;
  kind: "status_changed" | "assigned" | "option_presented" | "option_accepted" | "option_declined" | "created";
  fromStatus: RequestStatus | null;
  toStatus: RequestStatus | null;
  actorId: UUID | null;
  note: string | null;
  createdAt: ISODateTime;
}

export interface Journey {
  id: UUID;
  memberId: UUID;
  title: string;
  summary: string | null;
  status: JourneyStatus;
  startsOn: ISODate | null;
  endsOn: ISODate | null;
  primaryMarketId: UUID | null;
  createdAt: ISODateTime;
}

export interface JourneyItem {
  id: UUID;
  journeyId: UUID;
  requestId: UUID | null;
  kind: JourneyItemKind;
  title: string;
  detail: string | null;
  location: string | null;
  startsAt: ISODateTime | null;
  endsAt: ISODateTime | null;
  timezone: string | null;
  status: JourneyItemStatus;
  sortOrder: number;
}

export interface Provider {
  id: UUID;
  name: string;
  categorySlug: string | null;
  marketId: UUID | null;
  status: ProviderStatus;
  isFounding: boolean;
  website: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  termsSummary: string | null;
  notes: string | null;
  testRequestStatus: "not_started" | "scheduled" | "passed" | "failed";
  performanceScore: number | null; // 0–100, set by staff review
  createdAt: ISODateTime;
}

export interface PartnerApplication {
  id: UUID;
  organization: string;
  contactName: string;
  email: string;
  phone: string | null;
  categorySlug: string | null;
  city: string;
  website: string | null;
  message: string;
  status: "submitted" | "in_review" | "accepted" | "declined";
  submittedAt: ISODateTime;
}

export interface MemberPreference {
  id: UUID;
  memberId: UUID;
  domain: PreferenceDomain;
  label: string;
  value: string;
  source: "member" | "concierge";
  updatedAt: ISODateTime;
}

export interface MemberPerson {
  id: UUID;
  memberId: UUID;
  name: string;
  relationship: string;
  notes: string | null;
  birthday: ISODate | null;
}

export interface AccessOffer {
  id: UUID;
  title: string;
  summary: string;
  detail: string | null;
  providerId: UUID | null;
  marketId: UUID | null;
  minimumTierSlug: string | null;
  availableFrom: ISODateTime | null;
  availableUntil: ISODateTime | null;
  status: AccessOfferStatus;
}

export interface CardProgram {
  id: UUID;
  slug: string;
  name: string;
  description: string;
  isActive: boolean;
}

export interface MemberCard {
  id: UUID;
  memberId: UUID;
  programId: UUID;
  status: CardStatus;
  lastFour: string | null;
  requestedAt: ISODateTime | null;
  issuedAt: ISODateTime | null;
}

export interface AiEvent {
  id: UUID;
  kind: AiEventKind;
  requestId: UUID | null;
  memberId: UUID | null;
  model: string;
  promptVersion: string;
  output: Record<string, unknown>;
  status: AiReviewStatus;
  reviewedBy: UUID | null;
  reviewedAt: ISODateTime | null;
  latencyMs: number | null;
  inputTokens: number | null;
  outputTokens: number | null;
  error: string | null;
  createdAt: ISODateTime;
}

export interface FoundingMember {
  id: UUID;
  memberId: UUID | null;
  applicationId: UUID | null;
  displayName: string;
  referralSource: string | null;
  relationshipOwnerId: UUID | null;
  onboardingStatus: OnboardingStatus;
  preferencesCompleted: boolean;
  firstRequestAt: ISODateTime | null;
  satisfaction: number | null; // 1–5
  referralPotential: "low" | "medium" | "high" | null;
  notes: string | null;
}

export interface FoundingProvider {
  id: UUID;
  providerId: UUID;
  vettingStatus: "not_started" | "in_progress" | "passed" | "failed";
  termsStatus: "not_started" | "negotiating" | "agreed";
  testRequestStatus: "not_started" | "scheduled" | "passed" | "failed";
  performanceNote: string | null;
  preferredStatus: boolean;
}

export interface ServiceLevelTarget {
  priority: RequestPriority;
  firstResponseMinutes: number;
  optionsWithinHours: number;
}

export interface FeeRule {
  id: UUID;
  key: string;
  label: string;
  kind: "percentage" | "fixed";
  basisPoints: number | null;
  amount: Money | null;
  appliesTo: Vertical | "all";
  isActive: boolean;
}

export interface NotificationTemplate {
  id: UUID;
  key: string;
  channel: "email" | "sms" | "push";
  subject: string | null;
  body: string;
  isActive: boolean;
}

export interface ContactInquiry {
  id: UUID;
  name: string;
  email: string;
  topic: "membership" | "partnership" | "press" | "other";
  message: string;
  createdAt: ISODateTime;
}
