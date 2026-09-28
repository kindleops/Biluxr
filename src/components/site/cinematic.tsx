import type { ReactNode } from "react";
import { CinematicImage } from "@/components/motion/cinematic-image";
import { Reveal } from "@/components/motion/reveal";
import { ScrollScene } from "@/components/motion/scroll";
import { SplitLines } from "@/components/motion/split-lines";
import { Arrow, LinkButton } from "@/components/ui/button";
import { cn } from "@/lib/cn";

/**
 * Building blocks for the public sub pages. All are server components; motion
 * comes from the shared scroll driver and CSS, and every one reads correctly
 * without JavaScript or with reduced motion.
 */

/** A closing band: one photograph, one line, one action. */
export function ClosingCTA({
  image,
  position,
  lines,
  lede,
  href = "/apply",
  label = "Apply for membership",
}: {
  image: string;
  position?: string;
  lines: ReactNode[];
  lede?: string;
  href?: string;
  label?: string;
}) {
  return (
    <section className="relative isolate flex min-h-[min(88svh,52rem)] items-end overflow-hidden bg-ink-950">
      <CinematicImage
        src={image}
        alt=""
        position={position}
        parallax={14}
        fill
        className="-z-10"
        imageClassName="brightness-[0.5] contrast-[1.06]"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[linear-gradient(to_top,var(--color-ink-950)_2%,rgb(8_8_10/0.6)_40%,rgb(8_8_10/0.2)_75%,var(--color-ink-950))]"
      />
      <Reveal
        bare
        className="page-gutter content-max flex w-full flex-col gap-10 pt-40 pb-20 sm:pb-28 lg:flex-row lg:items-end lg:justify-between"
      >
        <div>
          <h2 className="max-w-[20ch] font-display text-display font-light tracking-[var(--tracking-editorial)] text-bone-50">
            <SplitLines lines={lines} />
          </h2>
          {lede && <p className="mt-6 max-w-md text-lede text-pretty text-bone-300">{lede}</p>}
        </div>
        <LinkButton href={href} size="lg" trailing={<Arrow />} className="shrink-0">
          {label}
        </LinkButton>
      </Reveal>
    </section>
  );
}

/** A large statement, set centre stage, revealed line by line. */
export function Manifesto({
  eyebrow,
  lines,
  body,
  tone = "dark",
}: {
  eyebrow?: string;
  lines: ReactNode[];
  body?: string;
  tone?: "dark" | "paper";
}) {
  const paper = tone === "paper";
  return (
    <section
      data-surface={paper ? "paper" : undefined}
      className={paper ? "bg-paper-100 text-ink-900" : "bg-ink-950"}
    >
      <Reveal bare className="page-gutter content-max py-32 text-center sm:py-48">
        {eyebrow && (
          <p className={cn("text-label", paper ? "text-ink-700/75" : "text-bone-500")}>{eyebrow}</p>
        )}
        <h2
          className={cn(
            "mx-auto mt-8 max-w-[18ch] font-display text-display font-light tracking-[var(--tracking-editorial)] text-balance",
            paper ? "text-ink-900" : "text-bone-50",
          )}
        >
          <SplitLines lines={lines} stagger={130} />
        </h2>
        {body && (
          <Reveal delay={450}>
            <p
              className={cn(
                "mx-auto mt-10 max-w-xl text-lede text-pretty",
                paper ? "text-ink-700/80" : "text-bone-400",
              )}
            >
              {body}
            </p>
          </Reveal>
        )}
      </Reveal>
    </section>
  );
}

/**
 * A vertical timeline whose rail fills as you scroll through it; each node
 * lights as it is reached.
 */
export function ScrollTimeline({
  items,
}: {
  items: { key: string; marker: ReactNode; body: ReactNode }[];
}) {
  return (
    <ScrollScene className="scroll-timeline relative">
      <span aria-hidden className="absolute top-3 bottom-3 left-[5px] w-px bg-white/[0.08]">
        <span className="timeline-fill absolute inset-0 origin-top bg-[linear-gradient(to_bottom,var(--color-bone-100),var(--color-sable-300))]" />
      </span>
      <ol className="grid">
        {items.map((item, i) => (
          <Reveal
            as="li"
            key={item.key}
            distance={18}
            delay={i * 40}
            className="relative grid gap-3 pb-12 pl-10 last:pb-0 sm:grid-cols-[15rem_1fr] sm:items-baseline sm:gap-10"
          >
            <span aria-hidden className="timeline-node absolute top-[0.45rem] left-0 size-[11px]" />
            <div>{item.marker}</div>
            <div>{item.body}</div>
          </Reveal>
        ))}
      </ol>
    </ScrollScene>
  );
}

/**
 * Two slow rows of words drifting in opposite directions. The list is read
 * once by assistive tech; the repeats are hidden.
 */
export function Marquee({ items, label }: { items: string[]; label: string }) {
  const half = Math.ceil(items.length / 2);
  const rows = [items.slice(0, half), items.slice(half)].filter((r) => r.length);
  return (
    <div className="marquee relative -mx-(--gutter) overflow-hidden py-4">
      <ul className="sr-only" aria-label={label}>
        {items.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
      {rows.map((row, r) => (
        <div
          key={r}
          aria-hidden
          className={cn("marquee-track flex w-max", r === 1 && "marquee-reverse")}
        >
          {[0, 1].map((copy) => (
            <div key={copy} className="flex shrink-0 items-center">
              {row.concat(row).map((item, i) => (
                <span
                  key={`${copy}-${i}`}
                  className="flex items-center font-display text-[clamp(2.4rem,1.6rem+3vw,4.75rem)] leading-[1.15] font-light tracking-[-0.02em] whitespace-nowrap text-bone-200"
                >
                  <span className={i % 2 ? "text-bone-500 italic" : undefined}>{item}</span>
                  <span className="mx-8 inline-block size-1.5 rounded-full bg-bone-600 sm:mx-12" />
                </span>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
