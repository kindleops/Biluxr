import { JourneyCard } from "@/components/member/cards";
import { MemberContainer, MemberPageHeader, SectionHeading } from "@/components/member/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { requireMember } from "@/lib/auth/session";
import { memberRepository, publicRepository } from "@/lib/data";

export const metadata = { title: "Journeys" };

export default async function JourneysPage() {
  const identity = await requireMember();
  const repo = await memberRepository(identity);
  const [journeys, pub] = await Promise.all([repo.listJourneys(), publicRepository()]);
  const markets = pub ? await pub.listMarkets() : [];
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = journeys.filter(
    (j) => j.status !== "cancelled" && j.status !== "completed" && (!j.endsOn || j.endsOn >= today),
  );
  const past = journeys.filter((j) => !upcoming.includes(j));
  const market = (id: string | null) => markets.find((m) => m.id === id)?.name;
  const slug = (id: string | null) => markets.find((m) => m.id === id)?.slug;

  return (
    <MemberContainer>
      <MemberPageHeader eyebrow="Journeys" title="Where life is moving." />
      <section aria-labelledby="upcoming">
        <SectionHeading>
          <span id="upcoming">Upcoming</span>
        </SectionHeading>
        {upcoming.length > 0 ? (
          <div className="grid gap-3">
            {upcoming.map((j, i) => (
              <JourneyCard
                key={j.id}
                journey={j}
                feature={i === 0}
                marketName={market(j.primaryMarketId)}
                marketSlug={slug(j.primaryMarketId)}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-card shadow-[inset_0_0_0_1px_var(--line-subtle)]">
            <EmptyState
              title="No journeys scheduled."
              body="When your concierge arranges travel, it gathers here — flights, stays, tables and transfers, day by day."
            />
          </div>
        )}
      </section>
      {past.length > 0 && (
        <section className="mt-14" aria-labelledby="past-journeys">
          <SectionHeading>
            <span id="past-journeys">Past</span>
          </SectionHeading>
          <div className="grid gap-3 sm:grid-cols-2">
            {past.map((j) => (
              <JourneyCard
                key={j.id}
                journey={j}
                marketName={market(j.primaryMarketId)}
                marketSlug={slug(j.primaryMarketId)}
              />
            ))}
          </div>
        </section>
      )}
    </MemberContainer>
  );
}
