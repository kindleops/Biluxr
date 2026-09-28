"use client";

import { useEffect, useRef, useState } from "react";
import { BiluxrOrb, type OrbState } from "@/components/motion/orb";
import { LiquidSilk } from "@/components/motion/liquid-silk";
import { Reveal } from "@/components/motion/reveal";
import { SplitLines } from "@/components/motion/split-lines";
import { cn } from "@/lib/cn";

const EXAMPLES = [
  {
    text: "Dinner for four in Paris on Thursday — somewhere quiet, not a scene.",
    understood: ["Dining", "Paris", "Thursday", "Four guests", "A quiet room"],
  },
  {
    text: "Two nights in Aspen over New Year’s, and ski school for the children.",
    understood: ["Stay", "Aspen", "New Year’s", "Two nights", "Ski school"],
  },
  {
    text: "Something for Sofia’s birthday. She’s been talking about ceramics.",
    understood: ["Gifting", "For Sofia", "Birthday", "Ceramics"],
  },
] as const;

type Phase = "typing" | "reading" | "received" | "clearing";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * The instrument: how a request is written and read. An illustrative loop —
 * a sentence is typed, the orb gathers as it reads, and what was understood
 * appears beneath. Runs only while on screen; still under reduced motion.
 */
export function Instrument() {
  const ref = useRef<HTMLDivElement>(null);
  const [example, setExample] = useState(0);
  const [typed, setTyped] = useState<number>(EXAMPLES[0].text.length);
  const [phase, setPhase] = useState<Phase>("received");
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(!!e?.isIntersecting), {
      threshold: 0.35,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let cancelled = false;
    (async () => {
      let i = 0;
      while (!cancelled) {
        const ex = EXAMPLES[i % EXAMPLES.length]!;
        setPhase("clearing");
        await sleep(700);
        if (cancelled) return;
        setExample(i % EXAMPLES.length);
        setTyped(0);
        setPhase("typing");
        await sleep(500);
        for (let c = 1; c <= ex.text.length && !cancelled; c++) {
          setTyped(c);
          const ch = ex.text[c - 1];
          await sleep(ch === " " ? 70 : ch === "," || ch === "." || ch === "—" ? 220 : 34);
        }
        if (cancelled) return;
        await sleep(450);
        setPhase("reading");
        await sleep(1700);
        if (cancelled) return;
        setPhase("received");
        await sleep(4200);
        i++;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [inView]);

  const ex = EXAMPLES[example]!;
  const orb: OrbState =
    phase === "typing"
      ? "listening"
      : phase === "reading"
        ? "thinking"
        : phase === "received"
          ? "sent"
          : "idle";
  const showChips = phase === "reading" || phase === "received";

  return (
    <section
      id="instrument"
      className="relative scroll-mt-(--nav-height) overflow-hidden bg-ink-950"
      aria-labelledby="instrument-title"
    >
      <LiquidSilk tint="pearl" intensity={0.9} />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,var(--color-ink-950),transparent_22%,transparent_78%,var(--color-ink-950))]"
      />
      <div
        ref={ref}
        className="page-gutter content-max relative z-[2] flex flex-col items-center py-28 text-center sm:py-40"
      >
        <Reveal bare>
          <p className="text-label text-bone-400">The instrument</p>
          <h2
            id="instrument-title"
            className="mt-7 font-display text-display font-light tracking-[var(--tracking-editorial)] text-bone-50"
          >
            <SplitLines
              lines={[
                "Request anything.",
                <em key="b" className="text-bone-300">
                  Biluxr coordinates the rest.
                </em>,
              ]}
            />
          </h2>
        </Reveal>

        <div className="relative mt-4 w-[min(24rem,88vw)] sm:mt-2 sm:w-[28rem]">
          <BiluxrOrb state={orb} activity={typed} className="w-full" />
        </div>

        <div
          aria-hidden
          className="liquid-glass relative -mt-10 w-full max-w-2xl rounded-[26px] p-5 text-left sm:-mt-16 sm:p-7"
        >
          <div className="flex items-center justify-between gap-4">
            <p className="text-label text-bone-400">What can we arrange?</p>
            <p
              className={cn(
                "flex items-center gap-2 text-caption transition-opacity duration-500",
                phase === "received" ? "text-status-moss opacity-100" : "opacity-0",
              )}
            >
              <span className="inline-block size-1.5 rounded-full bg-status-moss" /> Received
            </p>
          </div>
          <p
            className={cn(
              "mt-4 min-h-[4.2em] font-display text-[1.35rem] leading-snug font-light text-bone-50 transition-[opacity,filter] duration-500 sm:min-h-[3em] sm:text-[1.75rem]",
              phase === "clearing" && "opacity-0 blur-[6px]",
            )}
          >
            {ex.text.slice(0, typed)}
            <span
              className={cn(
                "caret ml-0.5 inline-block h-[1.05em] w-px translate-y-[0.15em] bg-bone-100",
                phase !== "typing" && "opacity-0",
              )}
            />
          </p>
          <div className="mt-5 flex min-h-8 flex-wrap items-center gap-2 border-t border-white/[0.08] pt-4">
            <span className="mr-1 text-[0.625rem] tracking-[0.16em] text-bone-500 uppercase">
              Understood
            </span>
            {ex.understood.map((u, i) => (
              <span
                key={`${example}-${u}`}
                className={cn(
                  "rounded-full px-3 py-1 text-caption text-bone-100 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.14)] transition-[opacity,transform,filter] duration-700 ease-settle",
                  showChips
                    ? "blur-0 translate-y-0 opacity-100"
                    : "translate-y-2 opacity-0 blur-[4px]",
                )}
                style={{ transitionDelay: showChips ? `${i * 160}ms` : "0ms" }}
              >
                {u}
              </span>
            ))}
          </div>
        </div>
        <p className="sr-only">
          Example: a member writes “{EXAMPLES[0].text}” Biluxr understands{" "}
          {EXAMPLES[0].understood.join(", ")}, and a concierge replies.
        </p>
        <p className="mt-6 max-w-md text-caption text-bone-500">
          Illustrative. Biluxr reads every request; a person replies to every one.
        </p>
      </div>
    </section>
  );
}
