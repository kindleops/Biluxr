import type { Metadata } from "next";
import { CredentialShowcase } from "@/components/home/showcase";
import { CinematicImage } from "@/components/motion/cinematic-image";
import { LiquidSilk } from "@/components/motion/liquid-silk";
import { Reveal } from "@/components/motion/reveal";
import { ScrollScene } from "@/components/motion/scroll";
import { SplitLines } from "@/components/motion/split-lines";
import { ClosingCTA, Manifesto } from "@/components/site/cinematic";
import { PageIntro } from "@/components/site/page-intro";
import { JOINING_STEPS, MEMBERSHIP_FAQ, MEMBERSHIP_PRIVILEGES } from "@/content/membership";
import { publicRepository } from "@/lib/data";
import { formatMoney } from "@/lib/format";

export const metadata: Metadata = {
  title: "Membership",
  description:
    "Biluxr membership: one relationship, considered options, remembered preferences. By application.",
  alternates: { canonical: "/membership" },
};

export default async function MembershipPage() {
  const repo = await publicRepository();
  const tiers = repo ? await repo.listPublicTiers().catch(() => []) : [];
  const tier = tiers[0];
  const privileges = tier?.privileges.length ? tier.privileges : MEMBERSHIP_PRIVILEGES;
  const feesPublished = Boolean(tier?.annualFee);

  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: MEMBERSHIP_FAQ.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }}
      />
      <PageIntro
        image={{ src: "/images/suite.jpg", position: "62% 50%" }}
        eyebrow="Membership"
        title={
          <>
            Fewer members. <em className="text-bone-400">More attention.</em>
          </>
        }
        lede="Biluxr is deliberately small. Membership is a relationship with people who come to know how you live — and a system built so nothing you tell them is ever lost."
      />

      <Manifesto
        eyebrow="The idea"
        lines={["Not a number you call.", <em key="r">A relationship that remembers.</em>]}
        body="The same person, the same thread, every time. What you tell us once shapes everything that follows — the seat, the room, the table, the people you bring."
      />

      {/* What membership holds */}
      <section data-surface="paper" className="bg-paper-100 text-ink-900">
        <div className="page-gutter content-max grid gap-16 py-28 sm:py-40 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-24">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <Reveal bare>
              <p className="text-label text-ink-700/75">What membership holds</p>
              <h2 className="mt-7 font-display text-display font-light tracking-[var(--tracking-editorial)] text-ink-900">
                <SplitLines lines={["The substance,", <em key="b">not the badge.</em>]} />
              </h2>
            </Reveal>
            <CinematicImage
              src="/images/window.jpg"
              alt=""
              sizes="(min-width: 1024px) 34vw, 0px"
              className="mt-12 hidden aspect-[4/5] max-h-[62vh] rounded-[22px] lg:block"
              imageClassName="brightness-[0.85]"
            />
          </div>
          <ol className="border-t border-(--line-paper-strong)">
            {privileges.map((p, i) => (
              <Reveal
                as="li"
                key={p.title}
                distance={20}
                className="group grid grid-cols-[3rem_1fr] gap-x-4 gap-y-3 border-b border-(--line-paper) py-10 sm:grid-cols-[5rem_1fr] sm:py-14"
              >
                <span className="pt-2 font-mono text-caption text-ink-700/75 tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="duration-slow font-display text-[clamp(1.8rem,1.3rem+1.6vw,2.75rem)] leading-[1.08] font-light tracking-[-0.02em] text-ink-900 transition-transform ease-settle group-hover:translate-x-1.5">
                  {p.title}
                </h3>
                <p className="col-start-2 max-w-lg text-lede text-ink-700/80">{p.description}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <CredentialShowcase />

      {/* Joining */}
      <section className="relative overflow-hidden bg-ink-950" aria-labelledby="joining">
        <LiquidSilk tint="sable" intensity={0.85} />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,var(--color-ink-950),transparent_25%,transparent_75%,var(--color-ink-950))]"
        />
        <div className="page-gutter content-max relative py-28 sm:py-40">
          <Reveal bare>
            <p className="text-label text-bone-400">Joining</p>
            <h2
              id="joining"
              className="mt-7 font-display text-display font-light tracking-[var(--tracking-editorial)] text-bone-50"
            >
              <SplitLines lines={["Three steps,", <em key="t">taken personally.</em>]} />
            </h2>
          </Reveal>
          <ScrollScene className="joining relative mt-16 sm:mt-24">
            <span
              aria-hidden
              className="absolute top-[3.1rem] right-[16%] left-[16%] hidden h-px bg-white/[0.1] md:block"
            >
              <span className="joining-fill absolute inset-0 origin-left bg-bone-100/70" />
            </span>
            <ol className="relative grid gap-4 md:grid-cols-3 md:gap-5">
              {JOINING_STEPS.map((s, i) => (
                <Reveal
                  as="li"
                  key={s.title}
                  delay={i * 140}
                  distance={36}
                  className="liquid-glass flex flex-col rounded-[26px] p-7 sm:p-8 md:min-h-[19rem]"
                >
                  <span className="flex size-12 items-center justify-center rounded-full bg-ink-950/60 font-display text-title text-bone-100 italic shadow-[inset_0_0_0_1px_rgb(255_255_255/0.2)]">
                    {["I", "II", "III"][i]}
                  </span>
                  <h3 className="mt-auto pt-8 font-display text-headline font-light text-bone-50 md:pt-12">
                    {s.title}
                  </h3>
                  <p className="mt-3 text-body text-bone-300">{s.body}</p>
                </Reveal>
              ))}
            </ol>
          </ScrollScene>
        </div>
      </section>

      {/* Fees */}
      <section className="bg-ink-900">
        <div className="page-gutter content-max grid gap-12 py-28 sm:py-36 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-24">
          <Reveal bare>
            <p className="text-label text-bone-500">Fees</p>
            <h2 className="mt-7 font-display text-headline font-light text-bone-50">
              <SplitLines lines={["Discussed openly,", "before you commit."]} />
            </h2>
          </Reveal>
          <Reveal delay={150} className="grid gap-10">
            {feesPublished && tier ? (
              <dl className="grid gap-8 sm:grid-cols-2">
                <div className="border-t border-white/10 pt-5">
                  <dt className="text-label text-bone-500">Annual membership</dt>
                  <dd className="mt-3 font-display text-display font-light text-bone-50">
                    {formatMoney(tier.annualFee)}
                  </dd>
                </div>
                {tier.initiationFee && (
                  <div className="border-t border-white/10 pt-5">
                    <dt className="text-label text-bone-500">Initiation</dt>
                    <dd className="mt-3 font-display text-display font-light text-bone-50">
                      {formatMoney(tier.initiationFee)}
                    </dd>
                  </div>
                )}
              </dl>
            ) : (
              <p className="font-display text-[clamp(1.6rem,1.2rem+1.3vw,2.4rem)] leading-[1.2] font-light text-balance text-bone-100">
                Founding membership fees are shared personally during our conversation — never as a
                surprise, and never before you have met the people who will look after you.
              </p>
            )}
            <p className="max-w-xl border-t border-white/[0.08] pt-8 text-body text-bone-400">
              Services you choose to book — a stay, a flight, a table with a minimum — are priced
              clearly, option by option, before you decide. Nothing is charged without your explicit
              authorization.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Questions */}
      <section data-surface="paper" className="bg-paper-100 text-ink-900">
        <div className="page-gutter content-max grid gap-12 py-28 sm:py-40 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-24">
          <Reveal bare className="lg:sticky lg:top-28 lg:self-start">
            <p className="text-label text-ink-700/75">Questions</p>
            <h2 className="mt-7 font-display text-display font-light tracking-[var(--tracking-editorial)] text-ink-900">
              <SplitLines lines={["Asked often."]} />
            </h2>
          </Reveal>
          <div className="border-t border-(--line-paper-strong)">
            {MEMBERSHIP_FAQ.map((f, i) => (
              <Reveal key={f.q} delay={i * 60} distance={14}>
                <details className="disclosure group border-b border-(--line-paper) [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-7 font-display text-[clamp(1.35rem,1.15rem+0.6vw,1.75rem)] font-light text-ink-900 transition-colors hover:text-ink-700">
                    {f.q}
                    <span
                      aria-hidden
                      className="relative flex size-9 shrink-0 items-center justify-center rounded-full shadow-[inset_0_0_0_1px_var(--line-paper-strong)] transition-transform duration-500 ease-settle group-open:rotate-45"
                    >
                      <span className="absolute h-px w-3 bg-ink-900" />
                      <span className="absolute h-3 w-px bg-ink-900" />
                    </span>
                  </summary>
                  <p className="max-w-2xl pb-8 text-lede text-ink-700/85">{f.a}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <ClosingCTA
        image="/images/chalet.jpg"
        position="50% 60%"
        lines={["If this is the help", <em key="m">you have been missing.</em>]}
        lede="Applications are read personally, and every one receives a reply."
      />
    </>
  );
}
