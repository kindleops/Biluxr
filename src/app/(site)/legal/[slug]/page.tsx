import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EditorialHeading } from "@/components/ui/typography";
import { LEGAL_DOCUMENTS, legalDocument } from "@/content/legal";
import { cn } from "@/lib/cn";
import { formatDateLong } from "@/lib/format";

export function generateStaticParams() {
  return LEGAL_DOCUMENTS.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const doc = legalDocument((await params).slug);
  if (!doc) return {};
  return { title: doc.title, description: doc.summary, alternates: { canonical: `/legal/${doc.slug}` } };
}

export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const doc = legalDocument(slug);
  if (!doc) notFound();

  return (
    <div data-surface="paper" className="-mt-(--nav-height) bg-paper-100 text-ink-900">
      <div className="page-gutter content-max grid gap-16 pt-[calc(var(--nav-height)+5rem)] pb-28 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-24 lg:pt-[calc(var(--nav-height)+7rem)]">
        <nav aria-label="Legal documents" className="lg:sticky lg:top-[calc(var(--nav-height)+2rem)] lg:self-start">
          <p className="text-label text-ink-700/60">Trust</p>
          <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-3 lg:grid lg:gap-3">
            {LEGAL_DOCUMENTS.map((d) => (
              <li key={d.slug}>
                <Link
                  href={`/legal/${d.slug}`}
                  aria-current={d.slug === slug ? "page" : undefined}
                  className={cn(
                    "text-body-sm transition-colors",
                    d.slug === slug ? "text-ink-900 underline underline-offset-[6px]" : "text-ink-700/65 hover:text-ink-900",
                  )}
                >
                  {d.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <article className="max-w-[var(--measure)]">
          <EditorialHeading as="h1" size="display">
            {doc.title}
          </EditorialHeading>
          <p className="mt-6 text-lede text-ink-700/80">{doc.summary}</p>
          <p className="mt-8 rounded-md px-4 py-3 text-caption text-ink-700/75 shadow-[inset_0_0_0_1px_var(--line-paper-strong)]">
            Working draft, last updated {formatDateLong(doc.updated)}. This document describes how Biluxr operates today
            and will be finalised following legal review before public launch.
          </p>
          <div className="mt-14 grid gap-12">
            {doc.sections.map((s) => (
              <section key={s.heading}>
                <h2 className="font-display text-title font-light">{s.heading}</h2>
                <div className="mt-4 grid gap-4 text-body text-ink-800/85">
                  {s.body.map((p) => (
                    <p key={p}>{p}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </article>
      </div>
    </div>
  );
}
