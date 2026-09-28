import type { Metadata } from "next";
import { ContactForm } from "@/components/forms/contact-form";
import { CinematicImage } from "@/components/motion/cinematic-image";
import { Reveal } from "@/components/motion/reveal";
import { SplitLines } from "@/components/motion/split-lines";
import { EditorialHeading } from "@/components/ui/typography";
import { publicRepository } from "@/lib/data";

export const metadata: Metadata = {
  title: "Contact",
  description: "Write to Biluxr. Every message is read by a person.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const repo = await publicRepository();
  return (
    <div className="-mt-(--nav-height)">
      <section data-surface="paper" className="bg-paper-100 text-ink-900">
        <div className="page-gutter content-max grid gap-16 pt-[calc(var(--nav-height)+5rem)] pb-28 lg:grid-cols-[1fr_1.3fr] lg:gap-24 lg:pt-[calc(var(--nav-height)+8rem)]">
          <div>
            <p className="reveal text-label text-ink-700/75">Contact</p>
            <EditorialHeading as="h1" size="display" className="mt-7 max-w-[10ch]">
              <SplitLines trigger="load" delay={150} lines={["Write", <em key="u">to us.</em>]} />
            </EditorialHeading>
            <p
              className="reveal mt-8 max-w-sm text-body text-ink-700/80"
              style={{ animationDelay: "500ms" }}
            >
              Every message is read by a person. Members should write through the Biluxr app, where
              your concierge will see it first.
            </p>
            <CinematicImage
              src="/images/suite.jpg"
              alt=""
              position="64% 50%"
              sizes="(min-width: 1024px) 36vw, 0px"
              className="mt-12 hidden aspect-[16/10] max-w-md rounded-[22px] lg:block"
              imageClassName="brightness-[0.8]"
            />
          </div>
          <Reveal delay={200} distance={32}>
            <div className="rounded-[28px] bg-paper-50 p-6 shadow-[inset_0_0_0_1px_var(--line-paper),0_40px_90px_-50px_rgb(40_30_10/0.45)] sm:p-10">
              <ContactForm available={repo !== null} />
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
