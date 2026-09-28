/**
 * Illustrative destination photography, keyed by market slug. Mood only — an
 * image never implies a booking, a venue or a partner. Markets without an
 * image simply render without one.
 */
export interface DestinationImage {
  src: string;
  alt: string;
  position?: string;
}

const DESTINATIONS: Record<string, DestinationImage> = {
  paris: {
    src: "/images/paris.jpg",
    alt: "A Paris street at night after rain.",
    position: "60% 55%",
  },
  aspen: {
    src: "/images/chalet.jpg",
    alt: "A snow-covered chalet at dusk, windows lit.",
    position: "50% 60%",
  },
};

export function destinationImage(slug: string | null | undefined): DestinationImage | null {
  return slug ? (DESTINATIONS[slug] ?? null) : null;
}
