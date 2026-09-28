import type { Metadata } from "next";
import { PageIntro, Section } from "@/components/site/page-intro";
import { Arrow, LinkButton } from "@/components/ui/button";
import { EditorialHeading } from "@/components/ui/typography";
import { JOINING_STEPS, MEMBERSHIP_FAQ, MEMBERSHIP_PRIVILEGES } from "@/content/membership";
import { publicRepository } from "@/lib/data";
import { formatMoney } from "@/lib/format";

export const metadata: Metadata = {
  title: "Membership",
  description: "Biluxr membership: one relationship, considered options, remembered preferences. By application.",
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
    mainEntity: MEMBERSHIP_FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} />
      <PageIntro
        eyebrow="Membership"
        title={
          <>
            Fewer members. <em className="text-bone-400">More attention.</em>
          </>
        }
        lede="Biluxr is deliberately small. Membership is a relationship with people who come to know how you live — and a system built so nothing you tell them is ever lost."
      />

      <Section tone="paper" eyebrow="What membership holds" title="The substance, not the badge.">
        <ol className="border-t border-(--line-paper-strong)">
          {privileges.map((p, i) => (
            <li key={p.title} className="grid grid-cols-[2.5rem_1fr] gap-4 border-b border-(--line-paper) py-8 sm:grid-cols-[4rem_1fr_1.3fr] sm:gap-8">
              <span className="font-mono text-caption text-ink-700/50">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="font-display text-title font-light text-ink-900">{p.title}</h3>
              <p className="col-start-2 text-body text-ink-700/80 sm:col-start-3">{p.description}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section eyebrow="Joining" title="Three steps, taken personally.">
        <ol className="grid gap-10 md:grid-cols-3 md:gap-8">
          {JOINING_STEPS.map((s, i) => (
            <li key={s.title} className="border-t border-white/10 pt-6">
              <p className="font-display text-title font-light text-bone-500 italic">{["I", "II", "III"][i]}</p>
              <h3 className="mt-4 font-display text-title font-light text-bone-50">{s.title}</h3>
              <p className="mt-3 text-body-sm text-bone-400">{s.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section tone="raised" eyebrow="Fees" title="Discussed openly, before you commit.">
        <div className="grid gap-8 md:grid-cols-2">
          {feesPublished && tier ? (
            <dl className="grid gap-6">
              <div>
                <dt className="text-label text-bone-500">Annual membership</dt>
                <dd className="mt-2 font-display text-headline font-light">{formatMoney(tier.annualFee)}</dd>
              </div>
              {tier.initiationFee && (
                <div>
                  <dt className="text-label text-bone-500">Initiation</dt>
                  <dd className="mt-2 font-display text-headline font-light">{formatMoney(tier.initiationFee)}</dd>
                </div>
              )}
            </dl>
          ) : (
            <p className="text-lede text-bone-300">
              Founding membership fees are shared personally during our conversation — never as a surprise, and never
              before you have met the people who will look after you.
            </p>
          )}
          <p className="text-body text-bone-400">
            Services you choose to book — a stay, a flight, a table with a minimum — are priced clearly, option by option,
            before you decide. Nothing is charged without your explicit authorization.
          </p>
        </div>
      </Section>

      <Section tone="paper" eyebrow="Questions" title="Asked often.">
        <div className="border-t border-(--line-paper-strong)">
          {MEMBERSHIP_FAQ.map((f) => (
            <details key={f.q} className="group border-b border-(--line-paper) py-6 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-display text-title font-light text-ink-900">
                {f.q}
                <span aria-hidden className="relative size-3 shrink-0">
                  <span className="absolute top-1/2 left-0 h-px w-3 bg-ink-900" />
                  <span className="absolute top-0 left-1/2 h-3 w-px bg-ink-900 transition-transform duration-base group-open:scale-y-0" />
                </span>
              </summary>
              <p className="mt-4 max-w-2xl text-body text-ink-700/80">{f.a}</p>
            </details>
          ))}
        </div>
      </Section>

      <section className="bg-ink-950">
        <div className="page-gutter content-max flex flex-col items-start gap-8 py-24 sm:flex-row sm:items-end sm:justify-between sm:py-32">
          <EditorialHeading size="headline" className="max-w-[18ch] text-bone-50">
            If this sounds like the help you have been missing, apply.
          </EditorialHeading>
          <LinkButton href="/apply" size="lg" trailing={<Arrow />}>
            Apply for membership
          </LinkButton>
        </div>
      </section>
    </>
  );
}
