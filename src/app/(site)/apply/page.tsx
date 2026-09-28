import type { Metadata } from "next";
import Image from "next/image";
import { ApplicationForm } from "@/components/forms/application-form";
import { SplitLines } from "@/components/motion/split-lines";
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
        <div aria-hidden className="absolute inset-0">
          <div className="kenburns absolute inset-0">
            <Image
              src="/images/chalet.jpg"
              alt=""
              fill
              priority
              sizes="(min-width: 1024px) 42vw, 100vw"
              className="object-cover object-[48%_60%] brightness-[0.5] contrast-[1.05]"
            />
          </div>
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgb(8_8_10/0.75),rgb(8_8_10/0.25)_40%,rgb(8_8_10/0.9))]" />
        </div>
        <div className="page-gutter relative z-[2] flex h-full flex-col justify-between gap-16 pt-16 pb-12 lg:pt-20 lg:pb-16">
          <div>
            <p className="reveal text-label text-bone-300">
              {invited ? "By invitation" : "Application"}
            </p>
            <EditorialHeading as="h1" size="display" className="mt-7 max-w-[11ch] text-bone-50">
              <SplitLines
                trigger="load"
                delay={200}
                lines={["Tell us a little", <em key="l">about your life.</em>]}
              />
            </EditorialHeading>
            <p
              className="reveal mt-8 max-w-sm text-body text-bone-200"
              style={{ animationDelay: "600ms" }}
            >
              {invited
                ? "A member has invited you. Your application will be read first."
                : "There is no net-worth test and no right answer — only whether we can genuinely make your life easier."}
            </p>
          </div>
          <ol
            className="reveal liquid-glass grid gap-4 rounded-[20px] p-5 text-body-sm text-bone-200"
            style={{ animationDelay: "800ms" }}
          >
            <li className="flex gap-4">
              <span className="font-mono text-bone-400">01</span> Your application, read personally
            </li>
            <li className="flex gap-4">
              <span className="font-mono text-bone-400">02</span> A conversation, if it feels like a
              fit
            </li>
            <li className="flex gap-4">
              <span className="font-mono text-bone-400">03</span> An introduction to your concierge
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
