import "server-only";
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

/**
 * DEMO FIXTURES — fictional people, fictional providers.
 *
 * Loaded only when BILUXR_DEMO_MODE=true on a non-production deployment and
 * Supabase is not configured (see `dataMode()`). No real individuals or
 * brands appear here; any resemblance is unintended.
 */

export interface DemoStore {
  markets: Market[];
  tiers: MembershipTier[];
  privileges: Privilege[];
  categories: RequestCategory[];
  slas: ServiceLevelTarget[];
  fees: FeeRule[];
  cardPrograms: CardProgram[];
  templates: NotificationTemplate[];
  profiles: Profile[];
  memberships: Membership[];
  cards: MemberCard[];
  preferences: MemberPreference[];
  people: MemberPerson[];
  applications: Application[];
  partnerApplications: PartnerApplication[];
  invitations: Invitation[];
  providers: Provider[];
  requests: ServiceRequest[];
  messages: RequestMessage[];
  options: RequestOption[];
  events: RequestEvent[];
  journeys: Journey[];
  journeyItems: JourneyItem[];
  accessOffers: AccessOffer[];
  aiEvents: AiEvent[];
  foundingMembers: FoundingMember[];
  foundingProviders: FoundingProvider[];
  contact: { id: string; name: string; email: string; topic: string; message: string; createdAt: string }[];
}

export const DEMO_IDS = {
  member: "0b7e1c2a-1f4d-4c8e-9a51-6d2f0e3a7b01",
  concierge: "5c3a9e7d-2b6f-4a1c-8e0d-7f4b1a2c3d02",
  admin: "9d1f3b5a-7c2e-4e6d-b8a0-1c3e5f7a9b03",
  concierge2: "3e5a7c9b-1d3f-4b5d-9f7b-2e4c6a8d0f04",
  member2: "7a9c1e3f-5b7d-4f9b-a1c3-5d7f9b1d3f05",
  member3: "2c4e6a8c-0e2a-4c4e-b6d8-0a2c4e6a8c06",
  member4: "8e0a2c4e-6a8c-4e0a-92c4-6e8a0c2e4a07",
} as const;

function uuid(n: number): string {
  const hex = n.toString(16).padStart(12, "0");
  return `00000000-0000-4000-8000-${hex}`;
}

export function createDemoStore(now: Date = new Date()): DemoStore {
  let seq = 1;
  const id = () => uuid(seq++);
  const at = (hoursFromNow: number) => new Date(now.getTime() + hoursFromNow * 3_600_000).toISOString();
  const day = (daysFromNow: number) =>
    new Date(now.getTime() + daysFromNow * 86_400_000).toISOString().slice(0, 10);

  const markets: Market[] = [
    ["miami", "Miami & South Florida", "North America", "America/New_York", "USD", "preparing"],
    ["new-york", "New York", "North America", "America/New_York", "USD", "planned"],
    ["los-angeles", "Los Angeles", "North America", "America/Los_Angeles", "USD", "planned"],
    ["aspen", "Aspen", "North America", "America/Denver", "USD", "planned"],
    ["st-barts", "St. Barthélemy", "Caribbean", "America/St_Barthelemy", "EUR", "planned"],
    ["london", "London", "Europe", "Europe/London", "GBP", "planned"],
    ["paris", "Paris", "Europe", "Europe/Paris", "EUR", "planned"],
    ["milan", "Milan", "Europe", "Europe/Rome", "EUR", "planned"],
    ["monaco", "Monaco", "Europe", "Europe/Monaco", "EUR", "planned"],
    ["ibiza", "Ibiza", "Europe", "Europe/Madrid", "EUR", "planned"],
    ["mykonos", "Mykonos", "Europe", "Europe/Athens", "EUR", "planned"],
    ["dubai", "Dubai", "Middle East", "Asia/Dubai", "AED", "planned"],
    ["tokyo", "Tokyo", "Asia", "Asia/Tokyo", "JPY", "planned"],
    ["singapore", "Singapore", "Asia", "Asia/Singapore", "SGD", "planned"],
  ].map(([slug, name, region, timezone, currency, status], i) => ({
    id: id(),
    slug: slug!,
    name: name!,
    region: region!,
    timezone: timezone!,
    currency: currency!,
    status: status as Market["status"],
    sortOrder: (i + 1) * 10,
  }));
  const market = (slug: string) => markets.find((m) => m.slug === slug)!.id;

  const tierId = id();
  const tiers: MembershipTier[] = [
    {
      id: tierId,
      slug: "membership",
      name: "Membership",
      description: "One relationship for every part of life that moves.",
      annualFee: null,
      initiationFee: null,
      invitationAllowance: 3,
      isActive: true,
      sortOrder: 10,
    },
    {
      id: id(),
      slug: "private",
      name: "Biluxr Private",
      description: "A dedicated team for households and family offices.",
      annualFee: null,
      initiationFee: null,
      invitationAllowance: 5,
      isActive: false,
      sortOrder: 20,
    },
  ];

  const privileges: Privilege[] = [
    ["A single relationship", "One concierge who knows your life, supported by a team that keeps it moving."],
    ["Considered options", "Every request returns a short, reasoned set of options — never a search result."],
    ["Remembered preferences", "Seats, rooms, tables, allergies, the people you travel with. Said once."],
    ["Journeys, held together", "Flights, stays, tables and transfers gathered into one living itinerary."],
    ["Invitations to extend", "A small number of invitations to share Biluxr with people you trust."],
  ].map(([title, description], i) => ({ id: id(), tierId, title: title!, description: description!, sortOrder: (i + 1) * 10 }));

  const categories: RequestCategory[] = [
    ["travel", "Travel", "concierge"],
    ["stays", "Stays", "concierge"],
    ["dining", "Dining", "concierge"],
    ["aviation", "Private aviation", "aviation"],
    ["ground", "Ground transport", "concierge"],
    ["access", "Events & access", "concierge"],
    ["wellness", "Wellness", "concierge"],
    ["residences", "Residences", "residences"],
    ["gifting", "Gifting", "concierge"],
    ["household", "Household & errands", "concierge"],
    ["other", "Something else", "concierge"],
  ].map(([slug, name, vertical], i) => ({
    id: id(),
    slug: slug!,
    name: name!,
    vertical: vertical as RequestCategory["vertical"],
    isActive: true,
    sortOrder: (i + 1) * 10,
  }));

  const slas: ServiceLevelTarget[] = [
    { priority: "urgent", firstResponseMinutes: 15, optionsWithinHours: 4 },
    { priority: "priority", firstResponseMinutes: 60, optionsWithinHours: 12 },
    { priority: "standard", firstResponseMinutes: 240, optionsWithinHours: 48 },
  ];

  const fees: FeeRule[] = [
    ["service_fee", "Service fee on arranged bookings", "percentage", "all"],
    ["partner_commission", "Partner commission", "percentage", "all"],
    ["premium_sourcing", "Premium sourcing fee", "fixed", "concierge"],
    ["aviation_margin", "Aviation margin", "percentage", "aviation"],
  ].map(([key, label, kind, appliesTo]) => ({
    id: id(),
    key: key!,
    label: label!,
    kind: kind as FeeRule["kind"],
    basisPoints: kind === "percentage" ? 0 : null,
    amount: kind === "fixed" ? { amountMinor: 0, currency: "USD" } : null,
    appliesTo: appliesTo as FeeRule["appliesTo"],
    isActive: false,
  }));

  const cardProgramId = id();
  const cardPrograms: CardProgram[] = [
    {
      id: cardProgramId,
      slug: "member-card",
      name: "Member card",
      description: "A physical credential identifying a Biluxr member to partners.",
      isActive: false,
    },
  ];

  const templates: NotificationTemplate[] = [
    ["application_received", "Your application to Biluxr", "Thank you, {{first_name}}. Your application has been received."],
    ["application_approved", "Welcome to Biluxr", "{{first_name}}, we would be glad to have you."],
    ["request_received", "Received: {{request_title}}", "Your request is with {{concierge_name}}."],
    ["options_ready", "Options for {{request_title}}", "A considered set of options is ready for you."],
  ].map(([key, subject, body]) => ({ id: id(), key: key!, channel: "email", subject: subject!, body: body!, isActive: true }));

  const person = (
    pid: string,
    fullName: string,
    preferredName: string | null,
    role: Profile["role"],
    email: string,
    timezone = "America/New_York",
  ): Profile => ({
    id: pid,
    email,
    fullName,
    preferredName,
    phone: null,
    role,
    timezone,
    homeMarketId: market("miami"),
    avatarInitials: fullName
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2),
    createdAt: at(-24 * 60),
  });

  const profiles: Profile[] = [
    person(DEMO_IDS.member, "Elena Voss", "Elena", "member", "elena.voss@example.com"),
    person(DEMO_IDS.member2, "Marcus Hale", null, "member", "marcus.hale@example.com"),
    person(DEMO_IDS.member3, "Priya Anand", null, "member", "priya.anand@example.com", "Europe/London"),
    person(DEMO_IDS.member4, "Theo Castellane", "Theo", "member", "theo.c@example.com"),
    person(DEMO_IDS.concierge, "Isabel Moreau", "Isabel", "concierge", "isabel@biluxr.example"),
    person(DEMO_IDS.concierge2, "Daniel Okafor", "Daniel", "concierge", "daniel@biluxr.example"),
    person(DEMO_IDS.admin, "Rhea Linden", "Rhea", "admin", "rhea@biluxr.example"),
  ];

  const memberships: Membership[] = [
    [DEMO_IDS.member, "0007", "active", DEMO_IDS.concierge, true, -140],
    [DEMO_IDS.member2, "0012", "active", DEMO_IDS.concierge2, true, -60],
    [DEMO_IDS.member3, "0015", "active", DEMO_IDS.concierge, true, -30],
    [DEMO_IDS.member4, "0019", "pending_activation", null, true, -2],
  ].map(([memberId, memberNumber, status, owner, founding, startedDays]) => ({
    id: id(),
    memberId: memberId as string,
    tierId,
    status: status as Membership["status"],
    memberNumber: memberNumber as string,
    startedAt: status === "active" ? at((startedDays as number) * 24) : null,
    renewsAt: status === "active" ? at(((startedDays as number) + 365) * 24) : null,
    relationshipOwnerId: owner as string | null,
    isFounding: founding as boolean,
    createdAt: at((startedDays as number) * 24),
  }));

  const cards: MemberCard[] = [
    {
      id: id(),
      memberId: DEMO_IDS.member,
      programId: cardProgramId,
      status: "not_issued",
      lastFour: null,
      requestedAt: null,
      issuedAt: null,
    },
  ];

  const preferences: MemberPreference[] = [
    ["travel", "Seating", "Window, forward cabin. Never the last row."],
    ["stays", "Rooms", "High floor, away from the elevator. Feather-free bedding."],
    ["dining", "Allergies", "Shellfish — severe. Always flag to the kitchen in advance."],
    ["dining", "Tables", "Corner or banquette. Quiet over scene."],
    ["family", "Children", "Sofia (9) and Luca (6) travel with a nanny on longer trips."],
    ["communication", "Contact", "Messages over calls before 10am. Assistant (Maren) cc'd on travel."],
  ].map(([domain, label, value], i) => ({
    id: id(),
    memberId: DEMO_IDS.member,
    domain: domain as MemberPreference["domain"],
    label: label!,
    value: value!,
    source: i === 2 ? "concierge" : "member",
    updatedAt: at(-24 * (20 - i)),
  }));

  const people: MemberPerson[] = [
    { id: id(), memberId: DEMO_IDS.member, name: "Sofia Voss", relationship: "Daughter", notes: "Loves horses and anything botanical.", birthday: day(19) },
    { id: id(), memberId: DEMO_IDS.member, name: "Luca Voss", relationship: "Son", notes: null, birthday: null },
    { id: id(), memberId: DEMO_IDS.member, name: "Maren Holt", relationship: "Executive assistant", notes: "Copy on all travel confirmations.", birthday: null },
  ];

  const providers: Provider[] = [
    ["Northline Air Partners", "aviation", "miami", "approved", true, "passed", 88],
    ["Maison Ardent", "dining", "miami", "preferred", true, "passed", 94],
    ["Casa Palmera Villas", "stays", "miami", "vetting", true, "scheduled", null],
    ["Keel & Tide Charters", "travel", "miami", "prospect", false, "not_started", null],
    ["Blackwater Chauffeured", "ground", "miami", "approved", true, "passed", 81],
    ["Atelier Solenne", "gifting", "miami", "approved", false, "passed", 90],
    ["Hollow Pine Lodge", "stays", "aspen", "vetting", false, "not_started", null],
  ].map(([name, cat, mkt, status, founding, test, score]) => ({
    id: id(),
    name: name as string,
    categorySlug: cat as string,
    marketId: market(mkt as string),
    status: status as Provider["status"],
    isFounding: founding as boolean,
    website: null,
    contactName: null,
    contactEmail: null,
    contactPhone: null,
    termsSummary: status === "approved" || status === "preferred" ? "Net 30. Member rate on request." : null,
    notes: null,
    testRequestStatus: test as Provider["testRequestStatus"],
    performanceScore: score as number | null,
    createdAt: at(-24 * 90),
  }));
  const provider = (name: string) => providers.find((p) => p.name === name)!.id;

  // Journeys
  const aspenJourney = id();
  const parisJourney = id();
  const journeys: Journey[] = [
    {
      id: parisJourney,
      memberId: DEMO_IDS.member,
      title: "Paris, autumn",
      summary: "Four nights. Gallery opening on the second evening.",
      status: "confirmed",
      startsOn: day(12),
      endsOn: day(16),
      primaryMarketId: market("paris"),
      createdAt: at(-24 * 20),
    },
    {
      id: aspenJourney,
      memberId: DEMO_IDS.member,
      title: "Aspen with the children",
      summary: "Ski week. Lessons for Sofia and Luca, a quiet chalet.",
      status: "planning",
      startsOn: day(74),
      endsOn: day(81),
      primaryMarketId: market("aspen"),
      createdAt: at(-24 * 3),
    },
  ];

  // Requests
  const req = (
    partial: Partial<ServiceRequest> & Pick<ServiceRequest, "title" | "brief" | "status" | "memberId">,
    createdHoursAgo: number,
  ): ServiceRequest => {
    const rid = id();
    const created = at(-createdHoursAgo);
    return {
      id: rid,
      reference: `BX-${rid.slice(-6).toUpperCase()}`,
      categorySlug: null,
      vertical: "concierge",
      priority: "standard",
      marketId: market("miami"),
      assigneeId: DEMO_IDS.concierge,
      startsAt: null,
      endsAt: null,
      timezone: "America/New_York",
      partySize: null,
      budget: null,
      location: null,
      firstResponseDueAt: new Date(new Date(created).getTime() + 240 * 60_000).toISOString(),
      firstRespondedAt: new Date(new Date(created).getTime() + 22 * 60_000).toISOString(),
      journeyId: null,
      details: {},
      createdAt: created,
      updatedAt: created,
      ...partial,
    };
  };

  const dinner = req(
    {
      memberId: DEMO_IDS.member,
      title: "Dinner for six, guests from Zurich",
      brief:
        "Dinner for six later this week — two of them are clients visiting from Zurich. Somewhere quiet enough to talk, excellent wine list. Around 8.",
      status: "options_ready",
      categorySlug: "dining",
      priority: "priority",
      partySize: 6,
      startsAt: at(76),
      location: "Miami",
      firstResponseDueAt: at(-28 + 1),
    },
    28,
  );
  const aspen = req(
    {
      memberId: DEMO_IDS.member,
      title: "Chalet and ski school, Aspen",
      brief:
        "Looking at the Aspen week in February with the kids. A chalet close to the lifts, private lessons for both children, and a car from the airport.",
      status: "sourcing",
      categorySlug: "stays",
      marketId: market("aspen"),
      timezone: "America/Denver",
      partySize: 4,
      startsAt: `${day(74)}T15:00:00.000Z`,
      endsAt: `${day(81)}T11:00:00.000Z`,
      journeyId: aspenJourney,
      location: "Aspen, Colorado",
    },
    70,
  );
  const gift = req(
    {
      memberId: DEMO_IDS.member,
      title: "Birthday gift for Sofia",
      brief: "Sofia turns ten next month. Something she will remember — not a thing that sits on a shelf.",
      status: "clarifying",
      categorySlug: "gifting",
    },
    5,
  );
  const car = req(
    {
      memberId: DEMO_IDS.member,
      title: "Car to MIA, early flight",
      brief: "Car to the airport Tuesday for the 7:10 to New York.",
      status: "completed",
      categorySlug: "ground",
      startsAt: at(-24 * 6),
    },
    24 * 8,
  );
  const marcusReq = req(
    {
      memberId: DEMO_IDS.member2,
      title: "Charter to Nassau, Saturday",
      brief: "Four passengers to Nassau Saturday morning, back Sunday evening. Light jet is fine.",
      status: "received",
      categorySlug: "aviation",
      vertical: "aviation",
      priority: "urgent",
      assigneeId: null,
      partySize: 4,
      firstResponseDueAt: at(0.15),
      firstRespondedAt: null,
    },
    0.05,
  );
  const priyaReq = req(
    {
      memberId: DEMO_IDS.member3,
      title: "Table at the chef's counter",
      brief: "Any chance of two seats at a chef's counter in London next Thursday?",
      status: "received",
      categorySlug: "dining",
      marketId: market("london"),
      timezone: "Europe/London",
      assigneeId: null,
      firstResponseDueAt: at(3),
      firstRespondedAt: null,
    },
    1,
  );
  const requests = [dinner, gift, aspen, car, marcusReq, priyaReq];

  const msg = (
    requestId: string,
    kind: RequestMessage["authorKind"],
    body: string,
    hoursAgo: number,
    visibility: RequestMessage["visibility"] = "member",
  ): RequestMessage => {
    const author =
      kind === "member"
        ? profiles.find((p) => p.id === requests.find((r) => r.id === requestId)!.memberId)!
        : kind === "concierge"
          ? profiles.find((p) => p.id === DEMO_IDS.concierge)!
          : null;
    return {
      id: id(),
      requestId,
      authorId: author?.id ?? null,
      authorKind: kind,
      authorName: author ? (author.preferredName ?? author.fullName) : "Biluxr",
      body,
      visibility,
      createdAt: at(-hoursAgo),
    };
  };

  const messages: RequestMessage[] = [
    msg(dinner.id, "member", dinner.brief, 28),
    msg(dinner.id, "concierge", "Lovely. I'll hold two rooms in mind — one with a private room, one at the bar-side banquette. Back to you this afternoon.", 27.6),
    msg(dinner.id, "concierge", "Zurich guests: one is a sommelier by training (per their assistant). Lean on the list.", 27.5, "internal"),
    msg(dinner.id, "concierge", "Two options below. Both can hold the table until tomorrow at noon.", 20),
    msg(gift.id, "member", gift.brief, 5),
    msg(gift.id, "concierge", "What a good age. Two directions I'd love your view on: an experience (a morning riding at a stable she can return to), or something botanical she grows herself. Is she more of a doer or a keeper?", 4.6),
    msg(aspen.id, "member", aspen.brief, 70),
    msg(aspen.id, "concierge", "Understood. I'm speaking with two chalets directly this week and holding lesson slots with an instructor we trust.", 69),
    msg(car.id, "member", car.brief, 24 * 8),
    msg(car.id, "concierge", "Confirmed for 5:15am from home. Driver details will arrive the night before.", 24 * 8 - 0.3),
    msg(car.id, "system", "Completed.", 24 * 6 - 3),
    msg(marcusReq.id, "member", marcusReq.brief, 0.05),
    msg(priyaReq.id, "member", priyaReq.brief, 1),
  ];

  const options: RequestOption[] = [
    {
      id: id(),
      requestId: dinner.id,
      providerId: provider("Maison Ardent"),
      title: "Maison Ardent — the private salon",
      summary:
        "A walled room for six off the main floor. The cellar list runs deep in Burgundy; the sommelier will pre-select three bottles if you share a range.",
      price: { amountMinor: 180000, currency: "USD" },
      status: "presented",
      expiresAt: at(22),
      respondedAt: null,
      sortOrder: 1,
      createdAt: at(-20),
    },
    {
      id: id(),
      requestId: dinner.id,
      providerId: null,
      title: "Chef's table, bar-side banquette",
      summary:
        "Livelier, still conversational. A fixed seasonal menu for the table; wine by pairing or by the bottle.",
      price: null,
      status: "presented",
      expiresAt: at(22),
      respondedAt: null,
      sortOrder: 2,
      createdAt: at(-20),
    },
  ];

  const events: RequestEvent[] = requests.flatMap((r) => {
    const out: RequestEvent[] = [
      { id: id(), requestId: r.id, kind: "created", fromStatus: null, toStatus: "received", actorId: r.memberId, note: null, createdAt: r.createdAt },
    ];
    if (r.status !== "received") {
      out.push({
        id: id(),
        requestId: r.id,
        kind: "status_changed",
        fromStatus: "received",
        toStatus: r.status === "completed" ? "confirmed" : r.status,
        actorId: DEMO_IDS.concierge,
        note: null,
        createdAt: new Date(new Date(r.createdAt).getTime() + 30 * 60_000).toISOString(),
      });
    }
    if (r.status === "completed") {
      out.push({ id: id(), requestId: r.id, kind: "status_changed", fromStatus: "confirmed", toStatus: "completed", actorId: DEMO_IDS.concierge, note: null, createdAt: at(-24 * 6 + 3) });
    }
    return out;
  });

  const journeyItems: JourneyItem[] = [
    { journeyId: parisJourney, kind: "flight", title: "MIA → CDG", detail: "Overnight, seats 2A / 2F", location: "Miami International", startsAt: `${day(12)}T23:30:00.000Z`, endsAt: `${day(13)}T13:05:00.000Z`, timezone: "America/New_York", status: "confirmed" },
    { journeyId: parisJourney, kind: "transfer", title: "Car to the hotel", detail: "Driver will meet at arrivals with a name card.", location: "Charles de Gaulle, Terminal 2", startsAt: `${day(13)}T13:40:00.000Z`, endsAt: null, timezone: "Europe/Paris", status: "confirmed" },
    { journeyId: parisJourney, kind: "stay", title: "Four nights, Left Bank", detail: "Courtyard-facing suite, high floor.", location: "Saint-Germain-des-Prés", startsAt: `${day(13)}T14:00:00.000Z`, endsAt: `${day(16)}T10:00:00.000Z`, timezone: "Europe/Paris", status: "confirmed" },
    { journeyId: parisJourney, kind: "event", title: "Gallery opening", detail: "Guest list confirmed for two.", location: "Le Marais", startsAt: `${day(14)}T17:30:00.000Z`, endsAt: null, timezone: "Europe/Paris", status: "confirmed" },
    { journeyId: parisJourney, kind: "dining", title: "Dinner after the opening", detail: "Holding a table for four at 9:30pm.", location: "Le Marais", startsAt: `${day(14)}T19:30:00.000Z`, endsAt: null, timezone: "Europe/Paris", status: "tentative" },
    { journeyId: aspenJourney, kind: "stay", title: "Chalet near the lifts", detail: "Two properties under discussion.", location: "Aspen", startsAt: null, endsAt: null, timezone: "America/Denver", status: "tentative", requestId: aspen.id },
    { journeyId: aspenJourney, kind: "experience", title: "Private ski lessons", detail: "Mornings, both children.", location: "Aspen Highlands", startsAt: null, endsAt: null, timezone: "America/Denver", status: "tentative", requestId: aspen.id },
  ].map((item, i) => ({ id: id(), requestId: null, sortOrder: i, ...item }) as JourneyItem);

  const accessOffers: AccessOffer[] = [
    {
      id: id(),
      title: "A morning in the cellar",
      summary: "A private tasting with the head sommelier at Maison Ardent, before service. Up to four guests.",
      detail: "Arranged on request, weekday mornings.",
      providerId: provider("Maison Ardent"),
      marketId: market("miami"),
      minimumTierSlug: null,
      availableFrom: at(-24 * 10),
      availableUntil: at(24 * 60),
      status: "published",
    },
  ];

  const invitations: Invitation[] = [
    {
      id: id(),
      inviterId: DEMO_IDS.member,
      email: "a.friend@example.com",
      inviteeName: "Camille Durand",
      code: "••••7Q2K",
      status: "issued",
      applicationId: null,
      expiresAt: at(24 * 45),
      createdAt: at(-24 * 15),
    },
  ];

  const applications: Application[] = [
    ["Jonah Whitcombe", "jonah.w@example.com", "Miami", "miami", "Private equity", "Referred by a member", "submitted", 6],
    ["Amara Osei", "amara.osei@example.com", "New York", "new-york", "Architecture practice founder", "Invitation", "in_review", 30],
    ["Lucien Faure", "l.faure@example.com", "Miami", "miami", "Family office principal", "Heard through a friend", "conversation", 72],
  ].map(([fullName, email, city, marketSlug, occupation, referral, status, hoursAgo]) => ({
    id: id(),
    fullName: fullName as string,
    email: email as string,
    phone: null,
    city: city as string,
    marketSlug: marketSlug as string,
    occupation: occupation as string,
    referralSource: referral as string,
    invitationCode: referral === "Invitation" ? "••••H8M3" : null,
    answers: {
      lifeInMotion: "Two homes, a young family, and a calendar that changes weekly. Travel most months.",
      whatWouldHelp: "One person who knows how we like things done, and can simply make them happen.",
    },
    status: status as Application["status"],
    reviewerId: status === "submitted" ? null : DEMO_IDS.concierge,
    decisionNote: null,
    submittedAt: at(-(hoursAgo as number)),
    decidedAt: null,
  }));

  const partnerApplications: PartnerApplication[] = [
    {
      id: id(),
      organization: "Salt & Cedar Yachting",
      contactName: "Reid Calloway",
      email: "reid@saltcedar.example",
      phone: null,
      categorySlug: "travel",
      city: "Fort Lauderdale",
      website: null,
      message: "Three crewed motor yachts, 70–110ft. Interested in a preferred arrangement for day charters.",
      status: "submitted",
      submittedAt: at(-40),
    },
  ];

  const aiEvents: AiEvent[] = [
    {
      id: id(),
      kind: "intent_extraction",
      requestId: priyaReq.id,
      memberId: DEMO_IDS.member3,
      model: "demo-heuristic",
      promptVersion: "intent.v1",
      output: {
        title: "Chef's counter for two, London",
        category: "dining",
        priority: "standard",
        partySize: 2,
        location: "London",
        timing: "Next Thursday, evening",
        budget: null,
        constraints: [],
        missingInformation: ["Preferred time", "Any dietary requirements"],
        clarifyingQuestions: ["What time suits you on Thursday — early or late seating?"],
        confidence: 0.72,
      },
      status: "proposed",
      reviewedBy: null,
      reviewedAt: null,
      latencyMs: 4,
      inputTokens: null,
      outputTokens: null,
      error: null,
      createdAt: at(-1),
    },
  ];

  const foundingMembers: FoundingMember[] = [
    [DEMO_IDS.member, "Elena Voss", "Personal introduction", DEMO_IDS.concierge, "established", true, at(-24 * 120), 5, "high"],
    [DEMO_IDS.member2, "Marcus Hale", "Member referral", DEMO_IDS.concierge2, "first_request", true, at(-0.05), null, "medium"],
    [DEMO_IDS.member3, "Priya Anand", "Personal introduction", DEMO_IDS.concierge, "preferences", false, at(-1), null, "high"],
    [DEMO_IDS.member4, "Theo Castellane", "Event introduction", null, "welcome_call", false, null, null, null],
  ].map(([memberId, displayName, referral, owner, onboarding, prefs, first, sat, potential]) => ({
    id: id(),
    memberId: memberId as string,
    applicationId: null,
    displayName: displayName as string,
    referralSource: referral as string,
    relationshipOwnerId: owner as string | null,
    onboardingStatus: onboarding as FoundingMember["onboardingStatus"],
    preferencesCompleted: prefs as boolean,
    firstRequestAt: first as string | null,
    satisfaction: sat as number | null,
    referralPotential: potential as FoundingMember["referralPotential"],
    notes: null,
  }));

  const foundingProviders: FoundingProvider[] = providers
    .filter((p) => p.isFounding)
    .map((p) => ({
      id: id(),
      providerId: p.id,
      vettingStatus: p.status === "vetting" ? "in_progress" : "passed",
      termsStatus: p.termsSummary ? "agreed" : "negotiating",
      testRequestStatus: p.testRequestStatus,
      performanceNote: p.performanceScore && p.performanceScore > 90 ? "Exceptional on short notice." : null,
      preferredStatus: p.status === "preferred",
    }));

  return {
    markets,
    tiers,
    privileges,
    categories,
    slas,
    fees,
    cardPrograms,
    templates,
    profiles,
    memberships,
    cards,
    preferences,
    people,
    applications,
    partnerApplications,
    invitations,
    providers,
    requests,
    messages,
    options,
    events,
    journeys,
    journeyItems,
    accessOffers,
    aiEvents,
    foundingMembers,
    foundingProviders,
    contact: [],
  };
}
