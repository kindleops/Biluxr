import type { Metadata } from "next";
import { PageIntro, Section } from "@/components/site/page-intro";
import { Arrow, LinkButton } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status";
import { publicRepository } from "@/lib/data";
import { REQUEST_STATUS_PRESENTATION } from "@/lib/domain/requests";

export const metadata: Metadata = {
  title: "Concierge",
  description:
    "How a Biluxr request moves: written once, answered with a considered choice, handled end to end.",
  alternates: { canonical: "/concierge" },
};

const FLOW = [
  "received",
  "sourcing",
  "options_ready",
  "confirmed",
  "in_progress",
  "completed",
] as const;
const FLOW_COPY: Record<(typeof FLOW)[number], string> = {
  received: "Your concierge has it. You will hear from a person, not an autoresponder.",
  sourcing: "We speak to the people who can actually say yes — directly.",
  options_ready: "A short, reasoned set of choices. Each held for you while you decide.",
  confirmed: "Only once the provider has confirmed. Never before.",
  in_progress: "We stay close while it happens, and adjust when plans change.",
  completed: "And we remember what you loved, and what you did not.",
};

export default async function ConciergePage() {
  const repo = await publicRepository();
  const categories = repo ? await repo.listCategories().catch(() => []) : [];

  return (
    <>
      <PageIntro
        image={{ src: "/images/table.jpg", position: "50% 22%" }}
        eyebrow="Concierge"
        title={
          <>
            Private service, <em className="text-bone-400">intelligently orchestrated.</em>
          </>
        }
        lede="A person who knows you, working with a system that forgets nothing. You write the way you would to a trusted friend; everything after that is ours to carry."
      />

      <Section eyebrow="The relationship" title="Someone who knows you.">
        <div className="grid gap-10 md:grid-cols-2">
          <p className="text-lede text-bone-300">
            Every member has a single concierge — a named person who learns your preferences, your
            people and your rhythms. Behind them sits a small team, so the relationship never pauses
            when someone is asleep or away.
          </p>
          <p className="text-body text-bone-400">
            You will never be asked to repeat yourself. Preferences you share are kept in your
            profile, visible to you, and editable at any time. What we learn on one request quietly
            improves the next.
          </p>
        </div>
      </Section>

      <Section tone="raised" eyebrow="How a request moves" title="Always clear where things stand.">
        <ol className="grid gap-px overflow-hidden rounded-card bg-white/[0.06]">
          {FLOW.map((s) => (
            <li
              key={s}
              className="grid gap-2 bg-ink-900 px-6 py-6 sm:grid-cols-[14rem_1fr] sm:items-baseline sm:gap-8"
            >
              <StatusPill tone={REQUEST_STATUS_PRESENTATION[s].tone}>
                {REQUEST_STATUS_PRESENTATION[s].member}
              </StatusPill>
              <p className="text-body-sm text-bone-400">{FLOW_COPY[s]}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section
        tone="paper"
        eyebrow="Intelligence, in service"
        title="The system drafts. People decide."
      >
        <div className="grid gap-8 md:grid-cols-2">
          <p className="text-lede text-ink-800/85">
            Biluxr&apos;s intelligence reads each request for what matters — dates, places, the
            people involved, what is still unclear — so your concierge can begin with understanding
            rather than admin.
          </p>
          <div className="grid gap-4 text-body text-ink-700/80">
            <p>
              It suggests; it never commits. Every question put to you and every option you receive
              has been reviewed by a person on our team.
            </p>
            <p>
              Your requests are never used to train public models, and what the system proposes is
              recorded so it can be reviewed and improved.
            </p>
          </div>
        </div>
      </Section>

      {categories.length > 0 && (
        <Section eyebrow="What members ask for" title="Anything, really.">
          <ul className="flex flex-wrap gap-x-10 gap-y-5">
            {categories.map((c) => (
              <li
                key={c.slug}
                className="font-display text-[clamp(1.5rem,1.2rem+1vw,2.1rem)] font-light text-bone-200"
              >
                {c.name}
              </li>
            ))}
          </ul>
        </Section>
      )}

      <section className="bg-ink-950">
        <div className="page-gutter content-max flex flex-col items-start gap-8 border-t border-white/[0.06] py-24 sm:flex-row sm:items-end sm:justify-between sm:py-32">
          <p className="max-w-[20ch] font-display text-headline font-light text-bone-50">
            Consider it handled.
          </p>
          <LinkButton href="/apply" size="lg" trailing={<Arrow />}>
            Apply for membership
          </LinkButton>
        </div>
      </section>
    </>
  );
}
