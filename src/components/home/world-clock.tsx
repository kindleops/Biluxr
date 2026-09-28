"use client";

import { useEffect, useState } from "react";

const CITIES = [
  { name: "Miami", tz: "America/New_York", wide: false },
  { name: "London", tz: "Europe/London", wide: false },
  { name: "Paris", tz: "Europe/Paris", wide: true },
  { name: "Dubai", tz: "Asia/Dubai", wide: true },
  { name: "Tokyo", tz: "Asia/Tokyo", wide: false },
];

/**
 * Local time in the cities members move between. A reference to the member's
 * world, not a claim of where Biluxr operates. Renders on the client only to
 * avoid server/client clock mismatch.
 */
export function WorldClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = window.setInterval(() => setNow(new Date()), 15_000);
    return () => window.clearInterval(t);
  }, []);

  return (
    <dl className="grid grid-cols-3 gap-x-6 gap-y-5 sm:grid-cols-5 sm:gap-x-10" aria-label="Local times">
      {CITIES.map((c) => (
        <div key={c.name} className={c.wide ? "hidden min-w-0 sm:block" : "min-w-0"}>
          <dt className="text-label text-bone-500">{c.name}</dt>
          <dd className="mt-1.5 font-mono text-body-sm tabular-nums text-bone-200">
            {now
              ? new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: c.tz }).format(now)
              : "——:——".slice(0, 5)}
          </dd>
        </div>
      ))}
    </dl>
  );
}
