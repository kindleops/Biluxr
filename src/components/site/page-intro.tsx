import Image from "next/image";
import type { ReactNode } from "react";
import { Reveal } from "@/components/motion/reveal";
import { ScrollScene } from "@/components/motion/scroll";
import { SplitLines } from "@/components/motion/split-lines";
import { EditorialHeading } from "@/components/ui/typography";

export function PageIntro({
  eyebrow,
  title,
  lede,
  children,
  image,
}: {
  eyebrow: string;
  title: ReactNode;
  lede?: ReactNode;
  children?: ReactNode;
  /** A full-bleed photograph behind the intro (decorative). */
  image?: { src: string; position?: string };
}) {
  if (image) {
    return (
      <ScrollScene
        as="section"
        className="hero relative -mt-(--nav-height) flex min-h-[min(88svh,58rem)] flex-col justify-end overflow-hidden bg-ink-950"
      >
        <div aria-hidden className="hero-media absolute inset-0">
          <div className="kenburns absolute inset-0">
            <Image
              src={image.src}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover brightness-[0.58] contrast-[1.06]"
              style={image.position ? { objectPosition: image.position } : undefined}
            />
          </div>
        </div>
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute inset-x-0 top-0 h-48 bg-[linear-gradient(to_bottom,rgb(8_8_10/0.7),transparent)]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_top,var(--color-ink-950)_0%,rgb(8_8_10/0.75)_30%,rgb(8_8_10/0.15)_70%,transparent)]" />
          <div className="hero-dim absolute inset-0 bg-ink-950" />
        </div>
        <div className="hero-copy page-gutter content-max relative z-[2] w-full pt-[calc(var(--nav-height)+8rem)] pb-16 sm:pb-24">
          <p className="reveal text-label text-bone-300" style={{ animationDelay: "250ms" }}>
            {eyebrow}
          </p>
          <EditorialHeading as="h1" size="display" className="mt-7 max-w-[18ch] text-bone-50">
            <SplitLines trigger="load" delay={320} lines={[title]} />
          </EditorialHeading>
          {lede && (
            <p
              className="reveal mt-8 max-w-2xl text-lede text-pretty text-bone-200"
              style={{ animationDelay: "700ms" }}
            >
              {lede}
            </p>
          )}
          {children}
        </div>
      </ScrollScene>
    );
  }
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
          <Reveal>
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
          </Reveal>
        )}
        <Reveal delay={120} className={eyebrow || title ? "" : "lg:col-span-2"}>
          {children}
        </Reveal>
      </div>
    </section>
  );
}
