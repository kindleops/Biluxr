import Link from "next/link";
import { Arrow, LinkButton } from "@/components/ui/button";
import { PaperSurface } from "@/components/ui/surface";
import { EditorialHeading } from "@/components/ui/typography";

/* -------------------------------------------------------------------------- */
/* Premise                                                                     */
/* -------------------------------------------------------------------------- */

export function Premise() {
  return (
    <PaperSurface className="relative">
      <div className="page-gutter content-max grid gap-14 py-28 sm:py-40 lg:grid-cols-[1fr_1fr] lg:gap-24">
        <div>
          <p className="text-label text-ink-700/75">The premise</p>
          <EditorialHeading as="h2" size="display" className="mt-8 text-ink-900">
            At a certain point, convenience <em className="italic">is</em> the luxury.
          </EditorialHeading>
        </div>
        <div className="grid content-end gap-6 text-lede text-pretty text-ink-800/85 lg:pt-40">
          <p>
            Most people with complicated lives already have access. What they lack is a single place
            where it all comes together — someone who remembers the details, knows the right people,
            and simply takes care of it.
          </p>
          <p>
            Biluxr is that relationship. You tell us what you need, in your own words, whenever it
            occurs to you. We return with a considered choice, arrange it, and carry what we learn
            into everything that follows.
          </p>
          <p className="text-body text-ink-700/70">No forms. No hold music. No starting over.</p>
        </div>
      </div>
    </PaperSurface>
  );
}

/* -------------------------------------------------------------------------- */
/* How it moves — an illustrative exchange                                     */
/* -------------------------------------------------------------------------- */

const STEPS = [
  {
    n: "I",
    title: "Say it once.",
    body: "Write the way you would to someone who knows you. A sentence is enough; we will ask only what matters.",
  },
  {
    n: "II",
    title: "Receive a considered choice.",
    body: "Not a list of links. Two or three options, each with a reason, held for you while you decide.",
  },
  {
    n: "III",
    title: "Consider it handled.",
    body: "We confirm, coordinate and follow through — and remember how you like it for next time.",
  },
];

export function HowItMoves() {
  return (
    <section id="how" className="relative scroll-mt-(--nav-height) overflow-hidden bg-ink-950">
      <div className="page-gutter content-max py-28 sm:py-40">
        <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
          <EditorialHeading as="h2" size="display" className="max-w-[16ch] text-bone-50">
            Request anything. Biluxr coordinates the rest.
          </EditorialHeading>
          <p className="max-w-xs text-body-sm text-bone-400 md:text-right">
            An illustration of a typical exchange. Names and details are fictional.
          </p>
        </div>

        <div className="mt-20 grid gap-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-24">
          <ol className="grid content-start gap-12">
            {STEPS.map((s) => (
              <li
                key={s.n}
                className="grid grid-cols-[3rem_1fr] gap-4 border-t border-white/[0.08] pt-6"
              >
                <span className="font-display text-title font-light text-bone-500 italic">
                  {s.n}
                </span>
                <div>
                  <h3 className="font-display text-title font-light text-bone-100">{s.title}</h3>
                  <p className="mt-3 max-w-md text-body text-bone-400">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
          <Exchange />
        </div>
      </div>
    </section>
  );
}

function Exchange() {
  return (
    <figure
      aria-label="Illustrative conversation between a member and Biluxr"
      className="relative rounded-xl bg-ink-900 p-5 shadow-[inset_0_0_0_1px_var(--line-subtle),var(--shadow-float)] sm:p-8"
    >
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
        <span className="text-label text-bone-500">Concierge</span>
        <span className="font-mono text-caption text-bone-600">BX-4Q7K</span>
      </div>
      <div className="grid gap-5 pt-6">
        <Bubble side="member" who="You" time="9:12">
          Paris next Thursday, four nights. Somewhere quiet on the Left Bank — and a table after the
          gallery opening on Friday.
        </Bubble>
        <Bubble side="biluxr" who="Isabel" time="9:31">
          Lovely. I&apos;ll hold two stays and a table for four after the opening. You&apos;ll have
          options by this evening — and yes, a high floor, away from the lift.
        </Bubble>
        <div className="ml-auto w-full max-w-[26rem] rounded-lg bg-ink-850 p-4 shadow-[inset_0_0_0_1px_var(--line)]">
          <div className="flex items-baseline justify-between gap-4">
            <p className="text-label text-bone-500">Option 1 of 2</p>
            <p className="text-caption text-bone-500">Held until 12:00 tomorrow</p>
          </div>
          <p className="mt-3 font-display text-[1.35rem] leading-snug font-light text-bone-50">
            A courtyard suite in Saint-Germain
          </p>
          <p className="mt-2 text-body-sm text-bone-400">
            Quiet, high floor, a ten-minute walk to the gallery. Breakfast in the garden.
          </p>
          <div className="mt-4 flex gap-2">
            <span className="inline-flex h-8 items-center rounded-sm bg-bone-100 px-3 text-caption font-medium text-ink-950">
              Choose this
            </span>
            <span className="inline-flex h-8 items-center rounded-sm px-3 text-caption text-bone-300 shadow-[inset_0_0_0_1px_var(--line-strong)]">
              See the other
            </span>
          </div>
        </div>
        <p className="flex items-center gap-2 text-caption text-bone-500">
          <span className="size-1.5 rounded-full bg-status-moss" aria-hidden />
          Remembered: high floor, away from the lift.
        </p>
      </div>
    </figure>
  );
}

function Bubble({
  side,
  who,
  time,
  children,
}: {
  side: "member" | "biluxr";
  who: string;
  time: string;
  children: React.ReactNode;
}) {
  const member = side === "member";
  return (
    <div className={member ? "mr-auto max-w-[28rem]" : "ml-auto max-w-[28rem]"}>
      <p className={`mb-1.5 text-caption text-bone-500 ${member ? "" : "text-right"}`}>
        {who} · {time}
      </p>
      <p
        className={
          member
            ? "rounded-lg rounded-tl-xs bg-ink-800 px-4 py-3 text-body-sm text-bone-100"
            : "rounded-lg rounded-tr-xs bg-bone-100 px-4 py-3 text-body-sm text-ink-900"
        }
      >
        {children}
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Index of what Biluxr covers                                                 */
/* -------------------------------------------------------------------------- */

const INDEX = [
  ["Travel", "Itineraries composed around you, not a fare grid."],
  ["Stays", "The right room in the right house — and the one after that."],
  ["Tables", "The reservation that seemed impossible, and the quiet corner within it."],
  ["Private aviation", "Aircraft, crews and timings arranged with care."],
  ["Access", "Openings, previews and evenings worth being at."],
  ["Wellness", "Practitioners, retreats and recovery, discreetly."],
  ["Gifting", "Thoughtful, on time, and never generic."],
  ["The household", "The errands and arrangements that quietly consume a week."],
];

export function ServiceIndex() {
  return (
    <PaperSurface>
      <div className="page-gutter content-max py-28 sm:py-40">
        <div className="grid gap-10 lg:grid-cols-[1fr_2fr]">
          <div>
            <p className="text-label text-ink-700/75">What it covers</p>
            <EditorialHeading as="h2" size="headline" className="mt-6 max-w-[12ch] text-ink-900">
              Anything that moves your life forward.
            </EditorialHeading>
          </div>
          <ul className="border-t border-(--line-paper-strong)">
            {INDEX.map(([title, line]) => (
              <li
                key={title}
                className="group grid gap-1 border-b border-(--line-paper) py-6 sm:grid-cols-[1fr_1.2fr] sm:items-baseline sm:gap-8"
              >
                <span className="duration-slow font-display text-[clamp(1.6rem,1.2rem+1.4vw,2.4rem)] leading-tight font-light tracking-[-0.02em] text-ink-900 transition-transform ease-settle group-hover:translate-x-1.5">
                  {title}
                </span>
                <span className="text-body text-ink-700/75">{line}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </PaperSurface>
  );
}

/* -------------------------------------------------------------------------- */
/* Remembered                                                                  */
/* -------------------------------------------------------------------------- */

const REMEMBERED = [
  "Window, forward cabin",
  "Shellfish — always flag to the kitchen",
  "High floor, away from the lift",
  "Corner tables over scene",
  "Messages before calls",
  "Sofia — horses, anything botanical",
];

export function Remembered() {
  return (
    <section className="relative overflow-hidden bg-ink-900">
      <div className="page-gutter content-max grid gap-16 py-28 sm:py-40 lg:grid-cols-[1.1fr_1fr] lg:items-center">
        <EditorialHeading as="h2" size="display" className="text-bone-50">
          Your preferences. Your people. Your world. <em className="text-bone-400">Remembered.</em>
        </EditorialHeading>
        <div>
          <p className="max-w-md text-lede text-bone-300">
            Every request teaches us something. Seats, rooms, allergies, the names of the people you
            travel with — said once, carried forward, and always yours to see and change.
          </p>
          <ul
            className="mt-10 flex flex-wrap gap-2.5"
            aria-label="Examples of remembered preferences"
          >
            {REMEMBERED.map((r) => (
              <li
                key={r}
                className="rounded-sm px-3 py-2 text-body-sm text-bone-300 shadow-[inset_0_0_0_1px_var(--line)]"
              >
                {r}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Founding                                                                    */
/* -------------------------------------------------------------------------- */

export function Founding() {
  return (
    <section className="grain relative overflow-hidden bg-ink-950">
      <div className="page-gutter content-max relative z-[2] py-28 sm:py-44">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-label text-bone-500">By application</p>
          <EditorialHeading as="h2" size="display" className="mt-8 text-bone-50">
            A small founding membership, beginning in Miami.
          </EditorialHeading>
          <p className="mx-auto mt-8 max-w-xl text-lede text-pretty text-bone-400">
            We are opening deliberately — a limited number of members, served by people who know
            them. Applications are read personally, and every one receives a reply.
          </p>
          <div className="mt-12 flex flex-col items-center justify-center gap-5 sm:flex-row sm:gap-8">
            <LinkButton href="/apply" size="lg" trailing={<Arrow />}>
              Apply for membership
            </LinkButton>
            <Link
              href="/membership"
              className="text-body-sm text-bone-300 underline decoration-white/25 underline-offset-[6px] hover:decoration-white/60"
            >
              What membership includes
            </Link>
          </div>
        </div>
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-[-55vmax] z-[1] mx-auto size-[110vmax] rounded-full shadow-[inset_0_0_0_1px_rgb(243_239_232/0.08)]"
      />
    </section>
  );
}
