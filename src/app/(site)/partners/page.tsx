import type { Metadata } from "next";
import { PartnerForm } from "@/components/forms/partner-form";
import { PageIntro, Section } from "@/components/site/page-intro";
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
      <Section tone="paper" eyebrow="How we work together" title="A network, not a marketplace.">
        <dl className="grid gap-x-12 gap-y-10 sm:grid-cols-2">
          {PRINCIPLES.map(([t, d]) => (
            <div key={t} className="border-t border-(--line-paper-strong) pt-6">
              <dt className="font-display text-title font-light text-ink-900">{t}</dt>
              <dd className="mt-3 text-body text-ink-700/80">{d}</dd>
            </div>
          ))}
        </dl>
      </Section>
      <Section eyebrow="Introduce your business" title="Start with a note.">
        <PartnerForm categories={categories} available={repo !== null} />
      </Section>
    </>
  );
}
