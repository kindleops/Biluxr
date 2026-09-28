/**
 * Legal documents. These are working drafts written to describe how the
 * product actually behaves. They must be reviewed by counsel before launch;
 * each page states that plainly.
 */

export interface LegalDocument {
  slug: string;
  title: string;
  summary: string;
  updated: string; // ISO date
  sections: { heading: string; body: string[] }[];
}

export const LEGAL_DOCUMENTS: LegalDocument[] = [
  {
    slug: "privacy",
    title: "Privacy",
    summary: "What we collect, why, and the choices you have.",
    updated: "2026-09-28",
    sections: [
      {
        heading: "The short version",
        body: [
          "We collect what we need to look after you, keep it private, and never sell it. You can see and change the preferences we hold, and ask us to delete your information.",
        ],
      },
      {
        heading: "What we collect",
        body: [
          "Application details you choose to share: your name, contact information, city, and your answers about how your life moves.",
          "As a member: your requests and messages, the preferences you tell us or confirm, the people you ask us to remember, and the arrangements we make on your behalf.",
          "Limited product analytics: anonymous counts of how features are used. These events never include your name, email address, request text or IP address.",
        ],
      },
      {
        heading: "How we use it",
        body: [
          "To consider your application, to fulfil your requests, to remember your preferences so you do not have to repeat them, and to improve the service.",
          "We share only what is necessary with the providers who fulfil a specific request — for example, the name on a reservation or a dietary requirement for a kitchen.",
        ],
      },
      {
        heading: "Biluxr's intelligence",
        body: [
          "We use a language model to help our team understand requests — extracting dates, places and open questions — and to draft summaries. Its suggestions are reviewed by a person before anything reaches you.",
          "Request content is sent to our model provider under terms that prohibit using it to train their models. Suggestions and their review outcomes are logged so our team can audit them.",
        ],
      },
      {
        heading: "Your choices",
        body: [
          "You can review and edit your profile and preferences at any time in the Biluxr app. To request a copy or deletion of your information, write to your concierge or use the contact page.",
        ],
      },
      {
        heading: "Retention",
        body: [
          "Applications that do not proceed are deleted after a reasonable period unless you ask us to keep them. Member records are kept for the life of the membership and as required by law thereafter.",
        ],
      },
    ],
  },
  {
    slug: "terms",
    title: "Terms of use",
    summary: "The terms that govern use of the Biluxr website and app.",
    updated: "2026-09-28",
    sections: [
      {
        heading: "Using Biluxr",
        body: [
          "These terms apply to the Biluxr website and member app. Membership itself is also governed by the Membership Terms.",
          "You agree to provide accurate information and to keep your sign-in credentials private.",
        ],
      },
      {
        heading: "Independent providers",
        body: [
          "Biluxr arranges services with independent providers — hotels, restaurants, operators and specialists. Each provider's own terms, cancellation policies and pricing apply to the services they deliver. We tell you what those are before you decide.",
        ],
      },
      {
        heading: "Accuracy",
        body: [
          "We take care to present options accurately. Availability and prices can change until a booking is confirmed by the provider; the app shows a request as confirmed only once that has happened.",
        ],
      },
      {
        heading: "Liability",
        body: ["The limits of our liability will be set out here following legal review."],
      },
    ],
  },
  {
    slug: "security",
    title: "Security",
    summary: "How we protect member information, stated plainly.",
    updated: "2026-09-28",
    sections: [
      {
        heading: "Our approach",
        body: [
          "Members trust us with details about their families, homes and movements. We design for that trust: least privilege, strong defaults, and records of who did what.",
          "Biluxr does not currently hold third-party security certifications. We will say so here when that changes, and not before.",
        ],
      },
      {
        heading: "Access control",
        body: [
          "Every table in our database enforces row-level security. Members can only ever read their own records; internal notes, provider records and system suggestions are visible only to our team.",
          "Staff roles are separated, role changes require an administrator, and sensitive changes are written to an audit log.",
        ],
      },
      {
        heading: "Sign-in",
        body: [
          "Members sign in with single-use links sent to their email address — there are no passwords to reuse or leak.",
        ],
      },
      {
        heading: "Data handling",
        body: [
          "Information is encrypted in transit. Invitation codes are stored only as one-way hashes. Payment card details, when payments are introduced, will be handled by a dedicated payment processor and never stored by Biluxr.",
        ],
      },
      {
        heading: "Reporting a concern",
        body: [
          "If you believe you have found a security issue, please contact us through the contact page and mark it 'Security'.",
        ],
      },
    ],
  },
  {
    slug: "membership-terms",
    title: "Membership terms",
    summary: "What membership includes, and how it begins, renews and ends.",
    updated: "2026-09-28",
    sections: [
      {
        heading: "Membership",
        body: [
          "Membership is personal and by application. It begins when your membership is activated and continues for the period agreed with you.",
        ],
      },
      {
        heading: "Fees",
        body: [
          "Membership fees are agreed with you before activation. Services you book through Biluxr are priced separately and shown to you before you choose them.",
        ],
      },
      {
        heading: "Invitations",
        body: [
          "Members may extend a limited number of invitations. An invitation allows the recipient to apply with priority; it does not guarantee membership.",
        ],
      },
      {
        heading: "Ending membership",
        body: [
          "Either party may end membership as described in the agreement provided at activation.",
        ],
      },
    ],
  },
  {
    slug: "payment-authorization",
    title: "Payment authorization",
    summary: "How and when Biluxr may charge you.",
    updated: "2026-09-28",
    sections: [
      {
        heading: "Explicit authorization",
        body: [
          "Biluxr will never charge you without your explicit authorization for a specific amount or a clearly described recurring fee.",
          "When you choose an option that carries a cost, the price, the provider's terms and any deposit or cancellation conditions are shown before you confirm.",
        ],
      },
      {
        heading: "Current status",
        body: [
          "Online payments are not yet enabled in the Biluxr app. Until they are, any payment is arranged directly with you by your concierge.",
        ],
      },
    ],
  },
];

export function legalDocument(slug: string): LegalDocument | undefined {
  return LEGAL_DOCUMENTS.find((d) => d.slug === slug);
}
