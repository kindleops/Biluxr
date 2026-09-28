import Link from "next/link";
import { notFound } from "next/navigation";
import { CommandComposer } from "@/components/member/composer";
import { MemberContainer } from "@/components/member/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/cn";
import { requireMember } from "@/lib/auth/session";
import { memberRepository, publicRepository } from "@/lib/data";
import { WorldMap, framePlaces, placeForMarket } from "@/components/geo/world-map";
import { NotFoundError } from "@/lib/data/repository";
import type { JourneyItem } from "@/lib/domain/types";
import { formatDateRange, formatTime } from "@/lib/format";

export const metadata = { title: "Journey" };

const KIND_LABEL: Record<JourneyItem["kind"], string> = {
  flight: "Flight",
  stay: "Stay",
  dining: "Dining",
  transfer: "Transfer",
  experience: "Experience",
  event: "Event",
  note: "Note",
};

/** Group items by local calendar day in each item's own time zone. */
function groupByDay(items: JourneyItem[]) {
  const groups = new Map<string, { label: string; items: JourneyItem[] }>();
  for (const item of items) {
    if (!item.startsAt) {
      const g = groups.get("unscheduled") ?? { label: "Still being arranged", items: [] };
      g.items.push(item);
      groups.set("unscheduled", g);
      continue;
    }
    const tz = item.timezone ?? "UTC";
    const key = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(item.startsAt));
    const label = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      weekday: "long",
      month: "long",
      day: "numeric",
    }).format(new Date(item.startsAt));
    const g = groups.get(key) ?? { label, items: [] };
    g.items.push(item);
    groups.set(key, g);
  }
  return [...groups.entries()].sort(([a], [b]) =>
    a === "unscheduled" ? 1 : b === "unscheduled" ? -1 : a.localeCompare(b),
  );
}

export default async function JourneyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const identity = await requireMember();
  const repo = await memberRepository(identity);
  const { journey, items } = await repo.getJourney(id).catch((e) => {
    if (e instanceof NotFoundError) notFound();
    throw e;
  });
  const [home, pub] = await Promise.all([repo.home(), publicRepository()]);
  const active = home.viewer.membership?.status === "active";
  const markets = pub ? await pub.listMarkets() : [];
  const slugFor = (marketId: string | null) => markets.find((m) => m.id === marketId)?.slug;
  const origin = placeForMarket(slugFor(home.viewer.profile.homeMarketId));
  const destination = placeForMarket(slugFor(journey.primaryMarketId));
  const route =
    origin && destination && origin.name !== destination.name
      ? ([origin, destination] as const)
      : null;
  const days = groupByDay(items);

  return (
    <MemberContainer>
      <nav aria-label="Breadcrumb" className="pt-8 lg:pt-12">
        <Link href="/app/journeys" className="text-caption text-bone-500 hover:text-bone-200">
          ← Journeys
        </Link>
      </nav>
      {route && (
        <figure className="relative mt-6 overflow-hidden rounded-xl bg-ink-900 shadow-[inset_0_0_0_1px_var(--line-subtle)]">
          <WorldMap
            label={`Route from ${route[0].name} to ${route[1].name}`}
            viewBox={framePlaces([route[0], route[1]], 3)}
            routes={[[route[0], route[1]]]}
            markers={[route[0], { ...route[1], emphasis: true }]}
            dotOpacity={0.1}
            className="h-40 sm:h-56"
            preserveAspectRatio="xMidYMid slice"
          />
          <figcaption className="absolute top-3 left-4 flex items-center gap-2 text-caption text-bone-400">
            {route[0].name} <span aria-hidden>→</span>{" "}
            <span className="text-bone-100">{route[1].name}</span>
          </figcaption>
        </figure>
      )}
      <header className="mt-6 border-b border-white/[0.06] pb-10">
        <p className="text-label text-bone-500">
          {formatDateRange(journey.startsOn, journey.endsOn)}
        </p>
        <h1 className="mt-4 font-display text-display font-light text-balance text-bone-50">
          {journey.title}
        </h1>
        {journey.summary && (
          <p className="mt-5 max-w-xl text-lede text-bone-400">{journey.summary}</p>
        )}
      </header>

      {days.length === 0 ? (
        <EmptyState
          title="Nothing arranged yet."
          body="As your concierge confirms each part of this journey, it appears here."
        />
      ) : (
        <div className="mt-12 grid gap-14">
          {days.map(([key, day]) => (
            <section key={key} aria-label={day.label}>
              <h2 className="font-display text-title font-light text-bone-200">{day.label}</h2>
              <ol className="mt-6 grid gap-px overflow-hidden rounded-card bg-white/[0.05]">
                {day.items.map((item) => (
                  <li
                    key={item.id}
                    className="grid grid-cols-[4.5rem_1fr] gap-4 bg-ink-900 px-5 py-5 sm:grid-cols-[6rem_1fr_auto] sm:gap-6"
                  >
                    <div className="font-mono text-body-sm text-bone-300 tabular-nums">
                      {item.startsAt ? formatTime(item.startsAt, item.timezone) : "—"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-label text-bone-500">{KIND_LABEL[item.kind]}</p>
                      <p className="mt-1.5 text-body text-bone-50">{item.title}</p>
                      {item.detail && (
                        <p className="mt-1 text-body-sm text-bone-400">{item.detail}</p>
                      )}
                      {item.location && (
                        <p className="mt-2 text-caption text-bone-500">{item.location}</p>
                      )}
                    </div>
                    <p
                      className={cn(
                        "col-start-2 text-caption sm:col-start-3 sm:text-right",
                        item.status === "confirmed" ? "text-status-moss" : "text-bone-500",
                      )}
                    >
                      {item.status === "confirmed" ? "Confirmed" : "Being arranged"}
                    </p>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      )}

      {active && journey.status !== "completed" && journey.status !== "cancelled" && (
        <section className="mt-16" aria-label="Add to this journey">
          <CommandComposer variant="compact" journeyId={journey.id} />
        </section>
      )}
    </MemberContainer>
  );
}
