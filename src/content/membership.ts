/**
 * Canonical public copy for membership. Tier configuration (fees, invitation
 * allowance, privileges) is read from the database when available; this copy
 * is the fallback when the site runs without a backend.
 */
export const MEMBERSHIP_PRIVILEGES = [
  {
    title: "A single relationship",
    description: "One concierge who knows your life, supported by a team that keeps it moving.",
  },
  {
    title: "Considered options",
    description: "Every request returns a short, reasoned set of options — never a search result.",
  },
  {
    title: "Remembered preferences",
    description: "Seats, rooms, tables, allergies, the people you travel with. Said once.",
  },
  {
    title: "Journeys, held together",
    description: "Flights, stays, tables and transfers gathered into one living itinerary.",
  },
  {
    title: "Invitations to extend",
    description: "A small number of invitations to share Biluxr with people you trust.",
  },
];

export const JOINING_STEPS = [
  {
    title: "Apply",
    body: "A short application — who you are, how your life moves, and what would make it easier. Ten minutes, no more.",
  },
  {
    title: "A conversation",
    body: "If it feels like a fit, a founding member of our team will call. We listen more than we talk.",
  },
  {
    title: "Welcome",
    body: "You are introduced to your concierge, we learn your preferences, and your first request can be as small or as ambitious as you like.",
  },
];

export const MEMBERSHIP_FAQ = [
  {
    q: "Who is Biluxr for?",
    a: "People whose lives are complicated enough that coordination itself has become the cost — founders, principals, families who travel, and those who simply value their time. There is no net-worth test; there is a fit test.",
  },
  {
    q: "Is membership by invitation only?",
    a: "Anyone may apply. Members may also extend a small number of invitations, and an invitation means your application is read first — not that it is automatically accepted.",
  },
  {
    q: "What does membership cost?",
    a: "Fees are shared personally during our conversation, before you commit to anything. Services you choose to book are priced transparently, option by option.",
  },
  {
    q: "Where does Biluxr operate?",
    a: "We are opening first in Miami and South Florida, and arranging travel beyond it. New markets open only when we can serve them properly.",
  },
  {
    q: "How do I reach my concierge?",
    a: "Through the Biluxr app, in writing, whenever it suits you. Your concierge replies personally; urgent requests are prioritised.",
  },
];
