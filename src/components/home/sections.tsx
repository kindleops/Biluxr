import Link from "next/link";
import { Arrow, LinkButton } from "@/components/ui/button";
import { PaperSurface } from "@/components/ui/surface";
import { Reveal } from "@/components/motion/reveal";
import { EditorialHeading } from "@/components/ui/typography";

/* -------------------------------------------------------------------------- */
/* Premise                                                                     */
/* -------------------------------------------------------------------------- */

export function Premise() {
  return (
    <PaperSurface className="relative">
      <div className="page-gutter content-max grid gap-14 py-28 sm:py-40 lg:grid-cols-[1fr_1fr] lg:gap-24">
        <Reveal>
          <p className="text-label text-ink-700/75">The premise</p>
          <EditorialHeading as="h2" size="display" className="mt-8 text-ink-900">
            At a certain point, convenience <em className="italic">is</em> the luxury.
          </EditorialHeading>
        </Reveal>
        <Reveal
          delay={140}
          className="grid content-end gap-6 text-lede text-pretty text-ink-800/85 lg:pt-40"
        >
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
        </Reveal>
      </div>
    </PaperSurface>
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
          <Reveal className="lg:sticky lg:top-32 lg:self-start">
            <p className="text-label text-ink-700/75">What it covers</p>
            <EditorialHeading as="h2" size="headline" className="mt-6 max-w-[12ch] text-ink-900">
              Anything that moves your life forward.
            </EditorialHeading>
          </Reveal>
          <ul className="border-t border-(--line-paper-strong)">
            {INDEX.map(([title, line], i) => (
              <Reveal
                as="li"
                key={title}
                delay={i * 50}
                distance={16}
                className="group grid gap-1 border-b border-(--line-paper) py-6 sm:grid-cols-[1fr_1.2fr] sm:items-baseline sm:gap-8"
              >
                <span className="duration-slow font-display text-[clamp(1.6rem,1.2rem+1.4vw,2.4rem)] leading-tight font-light tracking-[-0.02em] text-ink-900 transition-transform ease-settle group-hover:translate-x-1.5">
                  {title}
                </span>
                <span className="text-body text-ink-700/75">{line}</span>
              </Reveal>
            ))}
          </ul>
        </div>
      </div>
    </PaperSurface>
  );
}

/* -------------------------------------------------------------------------- */
/* Founding                                                                    */
/* -------------------------------------------------------------------------- */

export function Founding() {
  return (
    <section className="grain relative overflow-hidden bg-ink-950">
      <div className="page-gutter content-max relative z-[2] py-28 sm:py-44">
        <Reveal className="mx-auto max-w-3xl text-center">
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
        </Reveal>
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-[-55vmax] z-[1] mx-auto size-[110vmax] rounded-full shadow-[inset_0_0_0_1px_rgb(243_239_232/0.08)]"
      />
    </section>
  );
}
