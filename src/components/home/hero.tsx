import { PLACES, WorldMap } from "@/components/geo/world-map";
import { Arrow, LinkButton } from "@/components/ui/button";
import { WorldClock } from "./world-clock";

const ROUTES = [
  [PLACES.miami, PLACES.paris],
  [PLACES.miami, PLACES.london],
  [PLACES.miami, PLACES.aspen],
  [PLACES.london, PLACES.dubai],
  [PLACES.paris, PLACES.tokyo],
] as const;

/**
 * Hero. The world, rendered as quiet points of light, with the routes a
 * member's life actually takes. It describes the member's world — not a claim
 * about where Biluxr operates.
 */
export function Hero() {
  return (
    <section className="grain relative -mt-(--nav-height) flex min-h-[min(100svh,62rem)] flex-col overflow-hidden bg-ink-950">
      <div aria-hidden className="pointer-events-none absolute inset-0 z-[1]">
        <div className="absolute inset-x-0 top-0 h-[70%] bg-[radial-gradient(ellipse_60%_55%_at_70%_0%,rgb(194_171_130/0.09),transparent_70%)]" />
        <div className="hero-map absolute top-[calc(var(--nav-height)+1.5rem)] left-1/2 w-[260%] -translate-x-[42%] sm:w-[170%] sm:-translate-x-[44%] lg:top-[calc(var(--nav-height)-0.5rem)] lg:w-[118%] lg:-translate-x-1/2">
          <WorldMap
            label="A world map with routes between Miami, Paris, London, Aspen, Dubai and Tokyo"
            latitudes={[64, 21]}
            arcLift={0.45}
            routes={ROUTES.map(([a, b]) => [a, b])}
            markers={[
              { ...PLACES.miami, emphasis: true },
              PLACES.paris,
              PLACES.london,
              PLACES.aspen,
              PLACES.dubai,
              PLACES.tokyo,
            ]}
          />
        </div>
        <div className="absolute inset-x-0 bottom-0 h-[38%] bg-[linear-gradient(to_top,var(--color-ink-950)_15%,transparent)]" />
      </div>

      <div className="page-gutter content-max relative z-[2] flex w-full flex-1 flex-col justify-end pt-[calc(var(--nav-height)+5rem)] pb-10 sm:pb-14">
        <p className="reveal text-label text-bone-400" style={{ animationDelay: "150ms" }}>
          Private membership · By application
        </p>
        <h1
          className="reveal-slow mt-6 max-w-[14ch] font-display text-monument font-light tracking-[var(--tracking-tight-display)] text-bone-50"
          style={{ animationDelay: "250ms" }}
        >
          One relationship.
          <br />
          <em className="text-shine font-light">Wherever life moves.</em>
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
            <LinkButton href="#product" variant="quiet">
              See how it works
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
