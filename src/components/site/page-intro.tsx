import type { ReactNode } from "react";
import { EditorialHeading } from "@/components/ui/typography";

export function PageIntro({
  eyebrow,
  title,
  lede,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  lede?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="grain relative -mt-(--nav-height) overflow-hidden bg-ink-950">
      <div
        aria-hidden
        className="pointer-events-none absolute top-[-30vmax] right-[-40vmax] z-[1] size-[80vmax] rounded-full shadow-[inset_0_0_0_1px_rgb(243_239_232/0.07)]"
      />
      <div className="page-gutter content-max relative z-[2] pt-[calc(var(--nav-height)+6rem)] pb-20 sm:pt-[calc(var(--nav-height)+9rem)] sm:pb-28">
        <p className="reveal text-label text-bone-500">{eyebrow}</p>
        <EditorialHeading
          as="h1"
          size="display"
          className="reveal-slow mt-7 max-w-[18ch] text-bone-50"
        >
          {title}
        </EditorialHeading>
        {lede && (
          <p className="reveal mt-8 max-w-2xl text-lede text-pretty text-bone-400">{lede}</p>
        )}
        {children}
      </div>
    </section>
  );
}

export function Section({
  eyebrow,
  title,
  children,
  tone = "dark",
  id,
}: {
  eyebrow?: string;
  title?: ReactNode;
  children: ReactNode;
  tone?: "dark" | "paper" | "raised";
  id?: string;
}) {
  const bg =
    tone === "paper"
      ? "bg-paper-100 text-ink-900"
      : tone === "raised"
        ? "bg-ink-900"
        : "bg-ink-950";
  return (
    <section id={id} data-surface={tone === "paper" ? "paper" : undefined} className={bg}>
      <div className="page-gutter content-max grid gap-12 py-24 sm:py-32 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-20">
        {(eyebrow || title) && (
          <div>
            {eyebrow && (
              <p className={`text-label ${tone === "paper" ? "text-ink-700/75" : "text-bone-500"}`}>
                {eyebrow}
              </p>
            )}
            {title && (
              <EditorialHeading
                as="h2"
                size="headline"
                className={`mt-6 ${tone === "paper" ? "text-ink-900" : "text-bone-50"}`}
              >
                {title}
              </EditorialHeading>
            )}
          </div>
        )}
        <div className={eyebrow || title ? "" : "lg:col-span-2"}>{children}</div>
      </div>
    </section>
  );
}
