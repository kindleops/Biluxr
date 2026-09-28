import Link from "next/link";

/**
 * Always visible in demo mode. Fixture data is fictional and must never be
 * mistaken for real members, providers or bookings.
 */
export function DemoBanner() {
  return (
    <div
      role="note"
      className="relative z-banner flex items-center justify-center gap-3 bg-sable-500/15 px-4 py-1.5 pt-[max(0.375rem,var(--safe-top))] text-center text-[0.6875rem] tracking-[0.08em] text-sable-300 shadow-[inset_0_-1px_0_0_rgb(194_171_130/0.2)]"
    >
      <span className="font-medium uppercase">Demo environment</span>
      <span aria-hidden className="text-sable-500">·</span>
      <span className="hidden sm:inline">Fictional people and bookings. Nothing here is real.</span>
      <span className="sm:hidden">Fictional data</span>
      <span aria-hidden className="text-sable-500">·</span>
      <Link href="/login" className="underline decoration-sable-500/60 underline-offset-4 hover:text-sable-300">
        Switch persona
      </Link>
    </div>
  );
}
