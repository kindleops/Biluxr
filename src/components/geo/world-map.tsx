import { cn } from "@/lib/cn";
import { WORLD_BOUNDS, WORLD_DOTS, WORLD_HEIGHT, WORLD_WIDTH } from "./world-dots";

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

// All dots as one path of zero-length round-capped segments: one DOM node.
const DOT_PATH = WORLD_DOTS.split(" ")
  .map((p) => {
    const [x, y] = p.split(",");
    return `M${x} ${y}h0`;
  })
  .join("");

/**
 * Dotted world map with optional routes. Pure SVG, server-rendered; route
 * drawing is CSS (stroke-dash), disabled under reduced motion.
 */
export function WorldMap({
  routes = [],
  markers = [],
  className,
  dotClassName = "stroke-bone-100/[0.16]",
  label = "Map",
  animate = true,
  latitudes,
  arcLift = 1,
  preserveAspectRatio,
}: {
  routes?: [Place, Place][];
  markers?: (Place & { emphasis?: boolean })[];
  className?: string;
  dotClassName?: string;
  label?: string;
  animate?: boolean;
  /** Crop to a latitude band, e.g. [70, 12]. */
  latitudes?: [number, number];
  arcLift?: number;
  preserveAspectRatio?: string;
}) {
  const top = latitudes ? project({ lon: 0, lat: latitudes[0] })[1] : 0;
  const bottom = latitudes ? project({ lon: 0, lat: latitudes[1] })[1] : WORLD_HEIGHT;
  return (
    <svg
      viewBox={`0 ${top.toFixed(1)} ${WORLD_WIDTH} ${(bottom - top).toFixed(1)}`}
      preserveAspectRatio={preserveAspectRatio}
      className={cn("block h-auto w-full", className)}
      role="img"
      aria-label={label}
    >
      <path
        d={DOT_PATH}
        className={dotClassName}
        strokeWidth={2.1}
        strokeLinecap="round"
        fill="none"
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
