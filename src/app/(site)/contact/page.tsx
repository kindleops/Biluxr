import type { Metadata } from "next";
import { ContactForm } from "@/components/forms/contact-form";
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
            <p className="text-label text-ink-700/60">Contact</p>
            <EditorialHeading as="h1" size="display" className="mt-7 max-w-[10ch]">
              Write to us.
            </EditorialHeading>
            <p className="mt-8 max-w-sm text-body text-ink-700/80">
              Every message is read by a person. Members should write through the Biluxr app, where your concierge will
              see it first.
            </p>
          </div>
          <ContactForm available={repo !== null} />
        </div>
      </section>
    </div>
  );
}
