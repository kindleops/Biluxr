import type {
  AccessOffer,
  AiEvent,
  AiReviewStatus,
  Application,
  ApplicationStatus,
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
  MessageVisibility,
  NotificationTemplate,
  PartnerApplication,
  PreferenceDomain,
  Privilege,
  Profile,
  Provider,
  ProviderStatus,
  RequestCategory,
  RequestEvent,
  RequestMessage,
  RequestOption,
  RequestPriority,
  RequestStatus,
  ServiceLevelTarget,
  ServiceRequest,
  UUID,
  Vertical,
} from "@/lib/domain/types";
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

/**
 * The repository is the only way screens touch data. Two implementations
 * exist — Supabase (production) and an in-memory demo store — and both honour
 * the same authorization rules. In Supabase mode, RLS is the final authority.
 */

export class NotFoundError extends Error {
  constructor(what = "Not found") {
    super(what);
    this.name = "NotFoundError";
  }
}

export class ForbiddenError extends Error {
  constructor(what = "Not permitted") {
    super(what);
    this.name = "ForbiddenError";
  }
}

export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DomainError";
  }
}

export interface Viewer {
  profile: Profile;
  membership: Membership | null;
}

export interface TierWithPrivileges extends MembershipTier {
  privileges: Privilege[];
}

export interface PersonSummary {
  id: UUID;
  name: string;
  initials: string;
}

export interface RequestSummary extends ServiceRequest {
  options: RequestOption[];
  lastMessageAt: string | null;
}

export interface MemberHome {
  viewer: Viewer;
  tier: MembershipTier | null;
  relationshipOwner: PersonSummary | null;
  activeRequests: RequestSummary[];
  upcomingJourneys: Journey[];
}

export interface MemberRequestDetail {
  request: ServiceRequest;
  messages: RequestMessage[];
  options: RequestOption[];
  events: RequestEvent[];
  assignee: PersonSummary | null;
}

export interface JourneyDetail {
  journey: Journey;
  items: JourneyItem[];
}

export interface MembershipDetail {
  membership: Membership | null;
  tier: TierWithPrivileges | null;
  cards: (MemberCard & { program: CardProgram })[];
  invitationAllowance: number;
  invitationsUsed: number;
}

export interface ProfileBundle {
  profile: Profile;
  preferences: MemberPreference[];
  people: MemberPerson[];
}

export interface QueueFilters {
  status?: RequestStatus | "open" | "all";
  assignee?: "me" | "unassigned" | "all";
  priority?: RequestPriority | "all";
}

export interface QueueItem extends ServiceRequest {
  member: PersonSummary;
  assignee: PersonSummary | null;
  isFounding: boolean;
}

export interface StaffRequestDetail {
  request: ServiceRequest;
  member: Profile;
  membership: Membership | null;
  preferences: MemberPreference[];
  messages: RequestMessage[];
  options: RequestOption[];
  events: RequestEvent[];
  aiEvents: AiEvent[];
  staff: PersonSummary[];
  providers: Provider[];
}

export interface MemberListItem {
  profile: Profile;
  membership: Membership | null;
  tierName: string | null;
  openRequests: number;
  lastRequestAt: string | null;
  relationshipOwner: PersonSummary | null;
}

export interface Member360 {
  profile: Profile;
  membership: Membership | null;
  tier: MembershipTier | null;
  preferences: MemberPreference[];
  people: MemberPerson[];
  requests: ServiceRequest[];
  journeys: Journey[];
  founding: FoundingMember | null;
  relationshipOwner: PersonSummary | null;
  summaries: AiEvent[];
  staff: PersonSummary[];
}

export interface CohortView {
  target: { members: number; providers: number };
  members: (FoundingMember & { owner: PersonSummary | null })[];
  providers: (FoundingProvider & { provider: Provider })[];
}

export interface SettingsView {
  markets: Market[];
  tiers: TierWithPrivileges[];
  categories: RequestCategory[];
  slas: ServiceLevelTarget[];
  fees: FeeRule[];
  cardPrograms: CardProgram[];
  templates: NotificationTemplate[];
}

export interface AnalyticsView {
  applications: { total: number; approved: number; pending: number };
  members: { active: number; pendingActivation: number; founding: number };
  requests: {
    total: number;
    open: number;
    completed: number;
    cancelled: number;
    byCategory: { category: string; count: number }[];
  };
  medianFirstResponseMinutes: number | null;
  slaMetRate: number | null;
  optionAcceptanceRate: number | null;
  providers: { total: number; approved: number };
  ai: { total: number; accepted: number; edited: number; dismissed: number; failed: number };
}

export interface AiEventInput {
  kind: AiEvent["kind"];
  requestId: UUID | null;
  memberId: UUID | null;
  model: string;
  promptVersion: string;
  output: Record<string, unknown>;
  status: AiReviewStatus;
  latencyMs: number | null;
  inputTokens: number | null;
  outputTokens: number | null;
  error: string | null;
}

export interface StaffRequestPatch {
  status?: RequestStatus;
  assigneeId?: UUID | null;
  priority?: RequestPriority;
  title?: string;
  categorySlug?: string | null;
  vertical?: Vertical;
  location?: string | null;
  partySize?: number | null;
  startsAt?: string | null;
  endsAt?: string | null;
  timezone?: string | null;
  marketId?: UUID | null;
}

export interface PublicRepository {
  listMarkets(): Promise<Market[]>;
  listPublicTiers(): Promise<TierWithPrivileges[]>;
  listCategories(): Promise<RequestCategory[]>;
  submitApplication(input: ApplicationInput): Promise<void>;
  submitPartnerApplication(input: PartnerApplicationInput): Promise<void>;
  submitContact(input: ContactInput): Promise<void>;
  checkInvitation(code: string): Promise<boolean>;
}

export interface MemberRepository {
  home(): Promise<MemberHome>;
  listRequests(): Promise<RequestSummary[]>;
  getRequest(id: UUID): Promise<MemberRequestDetail>;
  createRequest(input: NewRequestInput): Promise<ServiceRequest>;
  postMessage(requestId: UUID, body: string): Promise<void>;
  respondToOption(optionId: UUID, decision: "accept" | "decline"): Promise<void>;
  cancelRequest(requestId: UUID, reason: string | null): Promise<void>;
  listJourneys(): Promise<Journey[]>;
  getJourney(id: UUID): Promise<JourneyDetail>;
  listAccessOffers(): Promise<AccessOffer[]>;
  listInvitations(): Promise<Invitation[]>;
  issueInvitation(email: string, name: string): Promise<{ code: string }>;
  membership(): Promise<MembershipDetail>;
  profile(): Promise<ProfileBundle>;
  updateProfile(input: ProfileUpdateInput): Promise<void>;
  addPreference(input: PreferenceInput): Promise<void>;
  removePreference(id: UUID): Promise<void>;
  addPerson(input: PersonInput): Promise<void>;
  removePerson(id: UUID): Promise<void>;
}

export interface StaffRepository {
  queue(filters: QueueFilters): Promise<QueueItem[]>;
  getRequest(id: UUID): Promise<StaffRequestDetail>;
  updateRequest(id: UUID, patch: StaffRequestPatch): Promise<void>;
  postMessage(requestId: UUID, body: string, visibility: MessageVisibility): Promise<void>;
  createOption(requestId: UUID, input: NewOptionInput): Promise<void>;
  setOptionStatus(optionId: UUID, status: "presented" | "withdrawn"): Promise<void>;
  listMembers(): Promise<MemberListItem[]>;
  member360(id: UUID): Promise<Member360>;
  activateMembership(memberId: UUID): Promise<void>;
  assignRelationshipOwner(memberId: UUID, ownerId: UUID | null): Promise<void>;
  listProviders(): Promise<Provider[]>;
  getProvider(id: UUID): Promise<Provider>;
  createProvider(input: ProviderInput): Promise<UUID>;
  updateProviderStatus(id: UUID, status: ProviderStatus): Promise<void>;
  listApplications(): Promise<Application[]>;
  getApplication(id: UUID): Promise<Application>;
  decideApplication(id: UUID, status: ApplicationStatus, note: string | null): Promise<void>;
  listPartnerApplications(): Promise<PartnerApplication[]>;
  cohort(): Promise<CohortView>;
  settings(): Promise<SettingsView>;
  analytics(): Promise<AnalyticsView>;
  recordAiEvent(input: AiEventInput): Promise<AiEvent>;
  reviewAiEvent(id: UUID, status: AiReviewStatus): Promise<void>;
  listStaff(): Promise<PersonSummary[]>;
  addPreferenceForMember(memberId: UUID, input: PreferenceInput): Promise<void>;
}

export type { PreferenceDomain };
