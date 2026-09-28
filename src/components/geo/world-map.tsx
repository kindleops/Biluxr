import { cn } from "@/lib/cn";
import { WORLD_BOUNDS, WORLD_DOTS_URL, WORLD_HEIGHT, WORLD_WIDTH } from "./world-dots";

export interface Place {
  name: string;
  lon: number;
  lat: number;
}

/** Reference coordinates for cities Biluxr members move between. */
export const PLACES = {
  miami: { name: "Miami", lon: -80.19, lat: 25.76 },
  newYork: { name: "New York", lon: -74.0, lat: 40.71 },
  losAngeles: { name: "Los Angeles", lon: -118.24, lat: 34.05 },
  aspen: { name: "Aspen", lon: -106.82, lat: 39.19 },
  stBarts: { name: "St. Barts", lon: -62.83, lat: 17.9 },
  london: { name: "London", lon: -0.13, lat: 51.51 },
  paris: { name: "Paris", lon: 2.35, lat: 48.86 },
  milan: { name: "Milan", lon: 9.19, lat: 45.46 },
  monaco: { name: "Monaco", lon: 7.42, lat: 43.74 },
  ibiza: { name: "Ibiza", lon: 1.43, lat: 38.91 },
  mykonos: { name: "Mykonos", lon: 25.33, lat: 37.45 },
  dubai: { name: "Dubai", lon: 55.27, lat: 25.2 },
  tokyo: { name: "Tokyo", lon: 139.69, lat: 35.69 },
  singapore: { name: "Singapore", lon: 103.82, lat: 1.35 },
} satisfies Record<string, Place>;

const MARKET_PLACES: Record<string, Place> = {
  miami: PLACES.miami,
  "new-york": PLACES.newYork,
  "los-angeles": PLACES.losAngeles,
  aspen: PLACES.aspen,
  "st-barts": PLACES.stBarts,
  london: PLACES.london,
  paris: PLACES.paris,
  milan: PLACES.milan,
  monaco: PLACES.monaco,
  ibiza: PLACES.ibiza,
  mykonos: PLACES.mykonos,
  dubai: PLACES.dubai,
  tokyo: PLACES.tokyo,
  singapore: PLACES.singapore,
};

export function placeForMarket(slug: string | null | undefined): Place | null {
  return slug ? (MARKET_PLACES[slug] ?? null) : null;
}

/** A viewBox framing the given places at a target aspect ratio, with padding. */
export function framePlaces(places: Place[], aspect = 2.6, padding = 70): string {
  const pts = places.map(project);
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  let x0 = Math.min(...xs) - padding;
  const x1 = Math.max(...xs) + padding;
  let y0 = Math.min(...ys) - padding * 1.3;
  const y1 = Math.max(...ys) + padding * 0.7;
  let w = x1 - x0;
  let h = y1 - y0;
  if (w / h < aspect) {
    const nw = h * aspect;
    x0 -= (nw - w) / 2;
    w = nw;
  } else {
    const nh = w / aspect;
    y0 -= (nh - h) / 2;
    h = nh;
  }
  return `${x0.toFixed(1)} ${y0.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}`;
}

export function project(p: Pick<Place, "lon" | "lat">): [number, number] {
  const lon = p.lon < WORLD_BOUNDS.west ? p.lon + 360 : p.lon;
  const x = ((lon - WORLD_BOUNDS.west) / (WORLD_BOUNDS.east - WORLD_BOUNDS.west)) * WORLD_WIDTH;
  const y =
    ((WORLD_BOUNDS.north - p.lat) / (WORLD_BOUNDS.north - WORLD_BOUNDS.south)) * WORLD_HEIGHT;
  return [x, y];
}

/** A flight-like arc: a quadratic curve lifted in proportion to its length. */
export function arcPath(a: Place, b: Place, liftScale = 1): string {
  const [x1, y1] = project(a);
  const [x2, y2] = project(b);
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy);
  const lift = Math.min(dist * 0.28, 120) * liftScale;
  const mx = (x1 + x2) / 2 + (dy / dist) * lift * 0.15;
  const my = (y1 + y2) / 2 - lift;
  return `M${x1.toFixed(1)} ${y1.toFixed(1)} Q${mx.toFixed(1)} ${my.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`;
}

/**
 * Dotted world map with optional routes. Pure SVG, server-rendered; route
 * drawing is CSS (stroke-dash), disabled under reduced motion.
 */
export function WorldMap({
  routes = [],
  markers = [],
  className,
  dotOpacity = 0.16,
  label = "Map",
  animate = true,
  latitudes,
  arcLift = 1,
  preserveAspectRatio,
  viewBox,
}: {
  routes?: [Place, Place][];
  markers?: (Place & { emphasis?: boolean })[];
  className?: string;
  /** Opacity of the land dots (they are bone-coloured). */
  dotOpacity?: number;
  label?: string;
  animate?: boolean;
  /** Crop to a latitude band, e.g. [70, 12]. */
  latitudes?: [number, number];
  arcLift?: number;
  preserveAspectRatio?: string;
  /** Explicit viewBox (e.g. from framePlaces); overrides latitudes. */
  viewBox?: string;
}) {
  const top = latitudes ? project({ lon: 0, lat: latitudes[0] })[1] : 0;
  const bottom = latitudes ? project({ lon: 0, lat: latitudes[1] })[1] : WORLD_HEIGHT;
  return (
    <svg
      viewBox={viewBox ?? `0 ${top.toFixed(1)} ${WORLD_WIDTH} ${(bottom - top).toFixed(1)}`}
      preserveAspectRatio={preserveAspectRatio}
      className={cn("block h-auto w-full", className)}
      role="img"
      aria-label={label}
    >
      <image
        href={WORLD_DOTS_URL}
        x={0}
        y={0}
        width={WORLD_WIDTH}
        height={WORLD_HEIGHT}
        opacity={dotOpacity}
        preserveAspectRatio="none"
      />
      <g fill="none" strokeLinecap="round">
        {routes.map(([a, b], i) => {
          const d = arcPath(a, b, arcLift);
          return (
            <g key={`${a.name}-${b.name}`}>
              <path d={d} stroke="rgb(243 239 232 / 0.08)" strokeWidth={1} />
              <path
                d={d}
                stroke="url(#route-gradient)"
                strokeWidth={1.25}
                pathLength={1000}
                className={animate ? "route-draw" : undefined}
                style={animate ? { animationDelay: `${0.6 + i * 0.35}s` } : undefined}
                strokeDasharray={animate ? 1000 : undefined}
              />
            </g>
          );
        })}
      </g>
      {markers.map((m) => {
        const [x, y] = project(m);
        return (
          <g key={m.name} transform={`translate(${x} ${y})`}>
            {m.emphasis && <circle r={9} className="marker-pulse fill-bone-100/[0.06]" />}
            <circle
              r={m.emphasis ? 3 : 2.1}
              className={m.emphasis ? "fill-bone-50" : "fill-bone-300"}
            />
          </g>
        );
      })}
      <defs>
        <linearGradient id="route-gradient" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="rgb(215 198 165)" stopOpacity="0.2" />
          <stop offset="0.5" stopColor="rgb(243 239 232)" stopOpacity="0.95" />
          <stop offset="1" stopColor="rgb(215 198 165)" stopOpacity="0.35" />
        </linearGradient>
      </defs>
    </svg>
  );
}
