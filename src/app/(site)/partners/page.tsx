import type { Metadata } from "next";
import { PartnerForm } from "@/components/forms/partner-form";
import { LiquidSilk } from "@/components/motion/liquid-silk";
import { Reveal } from "@/components/motion/reveal";
import { SplitLines } from "@/components/motion/split-lines";
import { Manifesto } from "@/components/site/cinematic";
import { PageIntro } from "@/components/site/page-intro";
import { publicRepository } from "@/lib/data";

export const metadata: Metadata = {
  title: "Partners",
  description:
    "Biluxr works with a small network of exceptional providers. Introduce your business.",
  alternates: { canonical: "/partners" },
};

const PRINCIPLES = [
  [
    "Introduced properly",
    "Every request arrives with context: who the member is, what they value, and what would delight them.",
  ],
  [
    "Vetted, then trusted",
    "We begin with a conversation and a test request. Partners who deliver become preferred — and hear from us first.",
  ],
  [
    "Clear terms",
    "Agreed in writing, honoured in practice. We never resell what we have not confirmed with you.",
  ],
  [
    "Discretion, both ways",
    "Members' details are shared only as needed to serve them. We expect the same of you.",
  ],
];

const BRIEF: [string, string][] = [
  ["Guest", "E. V. · founding member"],
  ["Party", "Four, Thursday evening"],
  ["Looking for", "A quiet room — conversation, not a scene"],
  ["Please note", "Shellfish allergy, severe. Flag to the kitchen in advance."],
];

export default async function PartnersPage() {
  const repo = await publicRepository();
  const categories = repo ? await repo.listCategories().catch(() => []) : [];

  return (
    <>
      <PageIntro
        image={{ src: "/images/paris.jpg", position: "58% 60%" }}
        eyebrow="Partners"
        title={
          <>
            The clients you want, <em className="text-bone-400">introduced properly.</em>
          </>
        }
        lede="Biluxr works with a small network of hotels, restaurants, operators and specialists who are exceptional at what they do. We bring them members who notice."
      />

      <Manifesto
        tone="paper"
        eyebrow="How we work together"
        lines={["A network,", <em key="n">not a marketplace.</em>]}
        body="No listings, no bidding, no race to the bottom. A small number of partners we know by name, and requests that arrive already understood."
      />

      {/* Principles + what a partner receives */}
      <section className="bg-ink-950" aria-labelledby="principles">
        <h2 id="principles" className="sr-only">
          Principles
        </h2>
        <div className="page-gutter content-max grid gap-16 py-28 sm:py-40 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-20">
          <ol className="border-t border-white/[0.1]">
            {PRINCIPLES.map(([t, d], i) => (
              <Reveal
                as="li"
                key={t}
                distance={20}
                className="group grid grid-cols-[3rem_1fr] gap-x-4 gap-y-3 border-b border-white/[0.07] py-10 sm:grid-cols-[5rem_1fr] sm:py-12"
              >
                <span className="pt-2 font-mono text-caption text-bone-500 tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="duration-slow font-display text-[clamp(1.8rem,1.3rem+1.6vw,2.75rem)] leading-[1.08] font-light tracking-[-0.02em] text-bone-50 transition-transform ease-settle group-hover:translate-x-1.5">
                  {t}
                </h3>
                <p className="col-start-2 max-w-lg text-lede text-bone-400">{d}</p>
              </Reveal>
            ))}
          </ol>

          <div className="lg:sticky lg:top-32 lg:self-start">
            <Reveal distance={40}>
              <p className="text-label text-bone-500">What arrives with a request</p>
              <figure className="liquid-glass liquid-glass-strong mt-6 rounded-[26px] p-6 sm:p-8">
                <div className="flex items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
                  <p className="font-display text-title font-light text-bone-50">An introduction</p>
                  <p className="font-mono text-caption text-bone-500">BX-000112</p>
                </div>
                <dl className="grid gap-5 pt-6">
                  {BRIEF.map(([k, v]) => (
                    <div key={k} className="grid gap-1">
                      <dt className="text-[0.625rem] tracking-[0.16em] text-bone-500 uppercase">
                        {k}
                      </dt>
                      <dd className="text-body text-bone-100">{v}</dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-7 border-t border-white/[0.08] pt-5 text-body-sm text-bone-400">
                  Reply with availability. We confirm with the member before anything is held.
                </p>
                <figcaption className="sr-only">
                  An illustrative request brief as a partner receives it. Fictional member.
                </figcaption>
              </figure>
              <p className="mt-4 text-caption text-bone-500">Illustrative. Fictional member.</p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Introduce your business */}
      <section className="relative overflow-hidden bg-ink-950" aria-labelledby="introduce">
        <LiquidSilk tint="sable" intensity={0.7} />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,var(--color-ink-950),rgb(8_8_10/0.3)_30%,rgb(8_8_10/0.3)_70%,var(--color-ink-950))]"
        />
        <div className="page-gutter content-max relative grid gap-12 py-28 sm:py-40 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20">
          <Reveal bare className="lg:sticky lg:top-32 lg:self-start">
            <p className="text-label text-bone-400">Introduce your business</p>
            <h2
              id="introduce"
              className="mt-7 font-display text-display font-light tracking-[var(--tracking-editorial)] text-bone-50"
            >
              <SplitLines lines={["Start with", <em key="n">a note.</em>]} />
            </h2>
            <p className="mt-8 max-w-sm text-body text-bone-300">
              Our partnerships team reads every introduction. If there is a fit, we arrange a
              conversation — and, in time, a first request.
            </p>
          </Reveal>
          <Reveal delay={120} distance={36}>
            <div className="liquid-glass liquid-glass-strong rounded-[28px] p-6 sm:p-10">
              <PartnerForm categories={categories} available={repo !== null} />
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
