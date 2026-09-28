import { Arrow, LinkButton } from "@/components/ui/button";
import { WorldClock } from "./world-clock";

/**
 * Hero. No photography, no gradient: a single hairline circle drawn in over
 * a dark field — the Biluxr mark's enclosure, at the scale of a horizon.
 */
export function Hero() {
  return (
    <section className="grain relative -mt-(--nav-height) flex min-h-[min(100svh,60rem)] flex-col overflow-hidden bg-ink-950">
      <HorizonArt />
      <div className="page-gutter content-max relative z-[2] flex w-full flex-1 flex-col justify-end pt-[calc(var(--nav-height)+4rem)] pb-10 sm:pb-14">
        <p className="reveal text-label text-bone-400" style={{ animationDelay: "150ms" }}>
          Private membership · By application
        </p>
        <h1
          className="reveal-slow mt-6 max-w-[14ch] font-display text-monument font-light tracking-[var(--tracking-tight-display)] text-bone-50"
          style={{ animationDelay: "250ms" }}
        >
          One relationship.
          <br />
          <em className="font-light text-bone-300">Wherever life moves.</em>
        </h1>
        <div
          className="reveal mt-10 grid gap-8 sm:mt-14 md:grid-cols-[minmax(0,34rem)_1fr] md:items-end"
          style={{ animationDelay: "550ms" }}
        >
          <p className="text-lede text-pretty text-bone-300">
            Biluxr coordinates travel, stays, tables, access and every detail between — for a small
            number of members whose time is worth more than the search.
          </p>
          <div className="flex flex-wrap items-center gap-x-8 gap-y-4 md:justify-end">
            <LinkButton href="/apply" size="lg" trailing={<Arrow />}>
              Request an invitation
            </LinkButton>
            <LinkButton href="#how" variant="quiet">
              How it works
            </LinkButton>
          </div>
        </div>
        <div
          className="reveal mt-16 border-t border-white/[0.08] pt-6 sm:mt-20"
          style={{ animationDelay: "800ms" }}
        >
          <WorldClock />
        </div>
      </div>
    </section>
  );
}

function HorizonArt() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-[1]">
      {/* soft light, off-center — like the last light over water */}
      <div className="absolute top-[18%] right-[-20%] size-[70vmax] [animation:breathe_9s_ease-in-out_infinite] rounded-full bg-[radial-gradient(closest-side,rgb(194_171_130/0.10),transparent)]" />
      <svg
        className="absolute top-[4%] right-[-62vmax] size-[108vmax] sm:right-[-55vmax] md:top-[2%] md:right-[-48vmax] md:size-[96vmax]"
        viewBox="0 0 1000 1000"
        fill="none"
      >
        <circle
          cx="500"
          cy="500"
          r="498"
          stroke="rgb(243 239 232 / 0.16)"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
          className="draw-in"
          style={{ ["--path-length" as string]: 3130 }}
          pathLength={3130}
        />
        <circle
          cx="500"
          cy="500"
          r="380"
          stroke="rgb(243 239 232 / 0.06)"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
          className="draw-in"
          style={{ ["--path-length" as string]: 2390, animationDelay: "0.6s" }}
          pathLength={2390}
        />
      </svg>
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[linear-gradient(to_top,var(--color-ink-950),transparent)]" />
    </div>
  );
}
