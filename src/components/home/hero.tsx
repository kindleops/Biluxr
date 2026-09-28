import Image from "next/image";
import { ScrollScene } from "@/components/motion/scroll";
import { SplitLines } from "@/components/motion/split-lines";
import { Arrow, LinkButton } from "@/components/ui/button";
import { WorldClock } from "./world-clock";

/**
 * Hero. One photograph, held like the opening shot of a film: a slow push-in
 * on arrival, then it sinks and dims beneath the page as you scroll.
 */
export function Hero() {
  return (
    <ScrollScene
      as="section"
      className="hero relative -mt-(--nav-height) flex h-[100svh] min-h-[38rem] flex-col overflow-hidden bg-ink-950"
    >
      <div aria-hidden className="hero-media absolute inset-0">
        <div className="kenburns absolute inset-0">
          <Image
            src="/images/terrace.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-[74%_50%] brightness-[0.62] contrast-[1.08] sm:object-[62%_50%]"
          />
        </div>
      </div>
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-48 bg-[linear-gradient(to_bottom,rgb(8_8_10/0.75),transparent)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_top,var(--color-ink-950)_0%,rgb(8_8_10/0.82)_26%,rgb(8_8_10/0.25)_60%,transparent_80%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_70%_at_20%_100%,rgb(8_8_10/0.7),transparent_70%)]" />
        <div className="hero-dim absolute inset-0 bg-ink-950" />
      </div>

      <div className="hero-copy page-gutter content-max relative z-[2] flex w-full flex-1 flex-col justify-end pt-[calc(var(--nav-height)+4rem)] pb-8 sm:pb-12">
        <p className="reveal text-label text-bone-300" style={{ animationDelay: "300ms" }}>
          Private membership · By application
        </p>
        <h1 className="mt-6 max-w-[15ch] font-display text-monument font-light tracking-[var(--tracking-tight-display)] text-bone-50">
          <SplitLines
            trigger="load"
            delay={380}
            stagger={140}
            lines={[
              "One relationship.",
              <em key="l2" className="text-shine font-light">
                Wherever life moves.
              </em>,
            ]}
          />
        </h1>
        <div
          className="reveal mt-9 grid gap-8 sm:mt-12 md:grid-cols-[minmax(0,34rem)_1fr] md:items-end"
          style={{ animationDelay: "900ms" }}
        >
          <p className="text-lede text-pretty text-bone-200">
            Biluxr coordinates travel, stays, tables, access and every detail between — for a small
            number of members whose time is worth more than the search.
          </p>
          <div className="flex flex-wrap items-center gap-x-8 gap-y-4 md:justify-end">
            <LinkButton href="/apply" size="lg" trailing={<Arrow />}>
              Request an invitation
            </LinkButton>
            <LinkButton href="#instrument" variant="quiet">
              See how it works
            </LinkButton>
          </div>
        </div>
        <div
          className="reveal mt-12 flex items-end justify-between gap-8 border-t border-white/[0.12] pt-5 sm:mt-16"
          style={{ animationDelay: "1150ms" }}
        >
          <WorldClock />
          <span aria-hidden className="hidden flex-col items-center gap-3 lg:flex">
            <span className="text-[0.625rem] tracking-[0.3em] text-bone-400 uppercase">Scroll</span>
            <span className="relative block h-10 w-px overflow-hidden bg-white/10">
              <span className="scroll-cue absolute inset-0 bg-bone-100" />
            </span>
          </span>
        </div>
      </div>
    </ScrollScene>
  );
}
