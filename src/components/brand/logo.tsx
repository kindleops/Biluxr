import { cn } from "@/lib/cn";

/**
 * Biluxr logo system.
 *
 * The wordmark is drawn, not typeset: six geometric line letterforms on a
 * 20-unit cap height with open tracking. It renders identically everywhere,
 * needs no font, and inherits `currentColor`.
 *
 * The mark is the wordmark's B enclosed in a single continuous circle:
 * one relationship, held.
 */

const WORDMARK_PATHS = [
  // B
  "M0 0V20 M0 0H6.5A4.75 4.75 0 0 1 6.5 9.5H0 M0 9.5H7.5A5.25 5.25 0 0 1 7.5 20H0",
  // I
  "M20.25 0V20",
  // L
  "M27.75 0V20H37.75",
  // U
  "M45.25 0V13A6 6 0 0 0 57.25 13V0",
  // X
  "M64.75 0L76.75 20 M76.75 0L64.75 20",
  // R
  "M84.25 0V20 M84.25 0H90.75A5 5 0 0 1 90.75 10H84.25 M90.25 10L96.25 20",
] as const;

type Weight = "whisper" | "hairline" | "light" | "regular";

const STROKE: Record<Weight, number> = {
  whisper: 0.45,
  hairline: 1.3,
  light: 1.9,
  regular: 2.6,
};

export function BiluxrWordmark({
  className,
  weight = "light",
  title = "Biluxr",
}: {
  className?: string;
  weight?: Weight;
  title?: string;
}) {
  const sw = STROKE[weight];
  const pad = sw;
  return (
    <svg
      viewBox={`${-pad} ${-pad} ${96.25 + pad * 2} ${20 + pad * 2}`}
      className={cn("h-4 w-auto", className)}
      role="img"
      aria-label={title}
      fill="none"
      stroke="currentColor"
      strokeWidth={sw}
      strokeLinecap="butt"
      strokeLinejoin="miter"
    >
      <title>{title}</title>
      {WORDMARK_PATHS.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

export function BiluxrMark({
  className,
  title = "Biluxr",
  decorative = false,
}: {
  className?: string;
  title?: string;
  decorative?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={cn("size-8", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.25}
      role={decorative ? "presentation" : "img"}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : title}
    >
      {!decorative && <title>{title}</title>}
      <circle cx="20" cy="20" r="19" />
      <g transform="translate(13.8 10)">
        <path d="M0 0V20 M0 0H6.5A4.75 4.75 0 0 1 6.5 9.5H0 M0 9.5H7.5A5.25 5.25 0 0 1 7.5 20H0" />
      </g>
    </svg>
  );
}

/** Lockup: mark + wordmark, used in navigation and documents. */
export function BiluxrLogo({
  className,
  showMark = true,
  weight = "light",
}: {
  className?: string;
  showMark?: boolean;
  weight?: Weight;
}) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      {showMark && <BiluxrMark decorative className="size-7" />}
      <BiluxrWordmark weight={weight} className="h-[0.8rem]" />
    </span>
  );
}
