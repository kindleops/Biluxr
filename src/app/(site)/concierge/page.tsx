import type { Metadata } from "next";
import { LiquidSilk } from "@/components/motion/liquid-silk";
import { BiluxrOrb } from "@/components/motion/orb";
import { Reveal } from "@/components/motion/reveal";
import { SplitLines } from "@/components/motion/split-lines";
import { ClosingCTA, Manifesto, Marquee, ScrollTimeline } from "@/components/site/cinematic";
import { PageIntro } from "@/components/site/page-intro";
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

const PRINCIPLES = [
  [
    "It reads, so people can begin with understanding.",
    "Dates, places, the people involved and what is still unclear — gathered before your concierge opens the request.",
  ],
  [
    "It suggests; it never commits.",
    "Every question put to you and every option you receive has been reviewed by a person on our team.",
  ],
  [
    "It is accountable.",
    "What the system proposes is recorded so it can be reviewed and improved. Your requests are never used to train public models.",
  ],
] as const;

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

      <Manifesto
        eyebrow="The relationship"
        lines={["Someone who knows you.", <em key="t">And a team behind them.</em>]}
        body="Every member has a single concierge — a named person who learns your preferences, your people and your rhythms — with a small team behind them, so the relationship never pauses when someone is asleep or away. You will never be asked to repeat yourself."
      />

      {/* How a request moves */}
      <section className="bg-ink-900" aria-labelledby="flow">
        <div className="page-gutter content-max grid gap-16 py-28 sm:py-40 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-24">
          <Reveal bare className="lg:sticky lg:top-32 lg:self-start">
            <p className="text-label text-bone-500">How a request moves</p>
            <h2
              id="flow"
              className="mt-7 font-display text-display font-light tracking-[var(--tracking-editorial)] text-bone-50"
            >
              <SplitLines lines={["Always clear", <em key="w">where things stand.</em>]} />
            </h2>
            <p className="mt-8 max-w-sm text-body text-bone-400">
              The same words you see in the app — each one true only when it is.
            </p>
          </Reveal>
          <ScrollTimeline
            items={FLOW.map((s) => ({
              key: s,
              marker: (
                <StatusPill tone={REQUEST_STATUS_PRESENTATION[s].tone}>
                  {REQUEST_STATUS_PRESENTATION[s].member}
                </StatusPill>
              ),
              body: (
                <p className="font-display text-[clamp(1.3rem,1.1rem+0.6vw,1.7rem)] leading-snug font-light text-bone-100">
                  {FLOW_COPY[s]}
                </p>
              ),
            }))}
          />
        </div>
      </section>

      {/* Intelligence, in service */}
      <section className="relative overflow-hidden bg-ink-950" aria-labelledby="intelligence">
        <LiquidSilk tint="tide" intensity={0.8} />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,var(--color-ink-950),transparent_25%,transparent_75%,var(--color-ink-950))]"
        />
        <div className="page-gutter content-max relative grid items-center gap-12 py-28 sm:py-40 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20">
          <div className="relative mx-auto w-[min(22rem,80vw)] lg:w-full lg:max-w-[30rem]">
            <BiluxrOrb state="listening" className="w-full" />
          </div>
          <div>
            <Reveal bare>
              <p className="text-label text-bone-400">Intelligence, in service</p>
              <h2
                id="intelligence"
                className="mt-7 font-display text-display font-light tracking-[var(--tracking-editorial)] text-bone-50"
              >
                <SplitLines lines={["The system drafts.", <em key="p">People decide.</em>]} />
              </h2>
            </Reveal>
            <ol className="mt-12 grid gap-3">
              {PRINCIPLES.map(([t, d], i) => (
                <Reveal
                  as="li"
                  key={t}
                  delay={i * 120}
                  distance={20}
                  className="liquid-glass rounded-[22px] p-6 sm:p-7"
                >
                  <h3 className="font-display text-title font-light text-bone-50">{t}</h3>
                  <p className="mt-2 text-body-sm text-bone-300">{d}</p>
                </Reveal>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {categories.length > 0 && (
        <section className="overflow-hidden bg-ink-950 py-28 sm:py-40" aria-labelledby="asks">
          <Reveal bare className="page-gutter content-max">
            <p className="text-label text-bone-500">What members ask for</p>
            <h2
              id="asks"
              className="mt-7 font-display text-headline font-light tracking-[var(--tracking-editorial)] text-bone-50"
            >
              <SplitLines lines={["Anything, really."]} />
            </h2>
          </Reveal>
          <div className="page-gutter mt-14 sm:mt-20">
            <Marquee items={categories.map((c) => c.name)} label="Categories of request" />
          </div>
        </section>
      )}

      <ClosingCTA
        image="/images/terrace.jpg"
        position="70% 50%"
        lines={["Consider it", <em key="h">handled.</em>]}
        lede="Write once. We return with a considered choice, arrange it, and remember."
      />
    </>
  );
}
