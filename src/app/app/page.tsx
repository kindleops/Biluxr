import Link from "next/link";
import { JourneyCard, RequestCard } from "@/components/member/cards";
import { CommandComposer } from "@/components/member/composer";
import { MemberContainer, SectionHeading } from "@/components/member/page-header";
import { ConciergeAvatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { requireMember } from "@/lib/auth/session";
import { memberRepository, publicRepository } from "@/lib/data";
import { formatDateLong, greeting } from "@/lib/format";

export const metadata = { title: "Home" };

export default async function MemberHome() {
  const identity = await requireMember();
  const repo = await memberRepository(identity);
  const [home, pub] = await Promise.all([repo.home(), publicRepository()]);
  const [categories, markets] = pub ? await Promise.all([pub.listCategories(), pub.listMarkets()]) : [[], []];
  const categoryName = (slug: string | null) => categories.find((c) => c.slug === slug)?.name ?? null;
  const { profile, membership } = home.viewer;
  const name = profile.preferredName ?? profile.fullName.split(" ")[0];
  const now = new Date();

  const needsYou = home.activeRequests.filter(
    (r) => r.status === "clarifying" || (r.status === "options_ready" && r.options.some((o) => o.status === "presented")),
  );
  const inMotion = home.activeRequests.filter((r) => !needsYou.includes(r));
  const pending = membership?.status !== "active";

  return (
    <MemberContainer>
      <section className="pt-10 pb-8 lg:pt-16">
        <p className="text-label text-bone-500">
          {new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: profile.timezone }).format(now)}
        </p>
        <h1 className="mt-4 font-display text-display font-light text-bone-50">
          {greeting(now, profile.timezone)}, <em className="text-bone-300">{name}.</em>
        </h1>
      </section>

      {pending ? (
        <div className="rounded-xl bg-ink-900 p-6 shadow-[inset_0_0_0_1px_var(--line)] sm:p-8">
          <p className="text-label text-status-amber">Membership awaiting activation</p>
          <p className="mt-3 max-w-lg text-body text-bone-300">
            Welcome. Your membership is being prepared. Once it is active you can send requests here — your concierge will
            be in touch to complete the last details.
          </p>
        </div>
      ) : (
        <CommandComposer placeholderName={name} />
      )}

      {needsYou.length > 0 && (
        <section className="mt-14" aria-labelledby="needs-you">
          <SectionHeading>
            <span id="needs-you">Awaiting you</span>
          </SectionHeading>
          <div className="grid gap-3">
            {needsYou.map((r) => (
              <RequestCard key={r.id} request={r} options={r.options} lastActivity={r.lastMessageAt} categoryName={categoryName(r.categorySlug)} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-14" aria-labelledby="in-motion">
        <SectionHeading
          action={
            home.activeRequests.length > 0 ? (
              <Link href="/app/concierge" className="text-caption text-bone-400 hover:text-bone-100">
                All requests
              </Link>
            ) : undefined
          }
        >
          <span id="in-motion">In motion</span>
        </SectionHeading>
        {inMotion.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {inMotion.map((r) => (
              <RequestCard key={r.id} request={r} options={r.options} lastActivity={r.lastMessageAt} categoryName={categoryName(r.categorySlug)} />
            ))}
          </div>
        ) : (
          <div className="rounded-card shadow-[inset_0_0_0_1px_var(--line-subtle)]">
            <EmptyState compact title="Nothing in motion." body="When you need something, Biluxr is here." />
          </div>
        )}
      </section>

      <section className="mt-14" aria-labelledby="ahead">
        <SectionHeading
          action={
            <Link href="/app/journeys" className="text-caption text-bone-400 hover:text-bone-100">
              All journeys
            </Link>
          }
        >
          <span id="ahead">Ahead</span>
        </SectionHeading>
        {home.upcomingJourneys.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {home.upcomingJourneys.slice(0, 2).map((j, i) => (
              <JourneyCard
                key={j.id}
                journey={j}
                feature={i === 0 && home.upcomingJourneys.length === 1}
                marketName={markets.find((m) => m.id === j.primaryMarketId)?.name}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-card shadow-[inset_0_0_0_1px_var(--line-subtle)]">
            <EmptyState compact title="No journeys scheduled." body="Trips we arrange for you gather here, day by day." />
          </div>
        )}
      </section>

      {home.relationshipOwner && (
        <section className="mt-14" aria-labelledby="relationship">
          <SectionHeading>
            <span id="relationship">Your concierge</span>
          </SectionHeading>
          <div className="flex items-center gap-4 rounded-card bg-ink-900 p-5 shadow-[inset_0_0_0_1px_var(--line-subtle)]">
            <ConciergeAvatar initials={home.relationshipOwner.initials} size="lg" ring />
            <div className="min-w-0 flex-1">
              <p className="text-body text-bone-100">{home.relationshipOwner.name}</p>
              <p className="text-caption text-bone-500">
                Your relationship at Biluxr{membership?.startedAt ? ` since ${formatDateLong(membership.startedAt)}` : ""}
              </p>
            </div>
          </div>
        </section>
      )}
    </MemberContainer>
  );
}
