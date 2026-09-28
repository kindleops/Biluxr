import type { Metadata } from "next";
import { ApplicationForm } from "@/components/forms/application-form";
import { EditorialHeading } from "@/components/ui/typography";
import { publicRepository } from "@/lib/data";

export const metadata: Metadata = {
  title: "Apply",
  description: "Apply for Biluxr membership. Every application is read personally.",
  alternates: { canonical: "/apply" },
};

export default async function ApplyPage({
  searchParams,
}: {
  searchParams: Promise<{ invitation?: string }>;
}) {
  const { invitation } = await searchParams;
  const repo = await publicRepository();
  const markets = repo ? await repo.listMarkets().catch(() => []) : [];
  const invited =
    invitation && repo ? await repo.checkInvitation(invitation).catch(() => false) : false;

  return (
    <div className="grid min-h-[calc(100dvh-var(--nav-height))] lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <aside className="grain relative overflow-hidden bg-ink-950 lg:sticky lg:top-(--nav-height) lg:h-[calc(100dvh-var(--nav-height))]">
        <div className="page-gutter relative z-[2] flex h-full flex-col justify-between gap-16 pt-16 pb-12 lg:pt-20 lg:pb-16">
          <div>
            <p className="text-label text-bone-500">{invited ? "By invitation" : "Application"}</p>
            <EditorialHeading as="h1" size="display" className="mt-7 max-w-[11ch] text-bone-50">
              Tell us a little about your life.
            </EditorialHeading>
            <p className="mt-8 max-w-sm text-body text-bone-400">
              {invited
                ? "A member has invited you. Your application will be read first."
                : "There is no net-worth test and no right answer — only whether we can genuinely make your life easier."}
            </p>
          </div>
          <ol className="grid gap-4 text-body-sm text-bone-400">
            <li className="flex gap-4">
              <span className="font-mono text-bone-600">01</span> Your application, read personally
            </li>
            <li className="flex gap-4">
              <span className="font-mono text-bone-600">02</span> A conversation, if it feels like a
              fit
            </li>
            <li className="flex gap-4">
              <span className="font-mono text-bone-600">03</span> An introduction to your concierge
            </li>
          </ol>
        </div>
      </aside>
      <section data-surface="paper" className="bg-paper-100 text-ink-900">
        <div className="page-gutter mx-auto max-w-3xl pt-16 pb-24 lg:pt-20">
          <ApplicationForm
            markets={markets.map((m) => ({ slug: m.slug, name: m.name }))}
            invitationCode={invited ? invitation : undefined}
            available={repo !== null}
          />
        </div>
      </section>
    </div>
  );
}
