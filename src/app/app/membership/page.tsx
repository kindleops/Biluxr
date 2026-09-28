import { MembershipCard, membershipStatusLine } from "@/components/member/membership-card";
import { MemberContainer, MemberPageHeader, SectionHeading } from "@/components/member/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { requireMember } from "@/lib/auth/session";
import { memberRepository } from "@/lib/data";
import { formatDateLong } from "@/lib/format";

export const metadata = { title: "Membership" };

const CARD_STATUS: Record<string, string> = {
  not_issued: "Not yet issued",
  requested: "Requested",
  in_production: "Being made",
  issued: "Issued",
  suspended: "Suspended",
};

export default async function MembershipPage() {
  const identity = await requireMember();
  const repo = await memberRepository(identity);
  const [detail, bundle, home] = await Promise.all([repo.membership(), repo.profile(), repo.home()]);
  const { membership, tier } = detail;

  return (
    <MemberContainer>
      <MemberPageHeader eyebrow="Membership" title="Your membership." />
      {!membership ? (
        <EmptyState title="No membership on record." body="If you believe this is a mistake, write to us from the contact page." />
      ) : (
        <>
          <div className="grid gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-center">
            <MembershipCard name={bundle.profile.fullName} membership={membership} tierName={tier?.name ?? null} />
            <dl className="grid gap-5">
              <div>
                <dt className="text-label text-bone-500">Status</dt>
                <dd className="mt-1.5 text-body text-bone-100">{membershipStatusLine(membership)}</dd>
              </div>
              <div>
                <dt className="text-label text-bone-500">Member since</dt>
                <dd className="mt-1.5 text-body text-bone-100">{membership.startedAt ? formatDateLong(membership.startedAt) : "On activation"}</dd>
              </div>
              <div>
                <dt className="text-label text-bone-500">Concierge</dt>
                <dd className="mt-1.5 text-body text-bone-100">{home.relationshipOwner?.name ?? "Being assigned"}</dd>
              </div>
              {detail.cards.map((c) => (
                <div key={c.id}>
                  <dt className="text-label text-bone-500">{c.program.name}</dt>
                  <dd className="mt-1.5 text-body text-bone-100">
                    {c.program.isActive ? CARD_STATUS[c.status] : "Not yet available"}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {tier && tier.privileges.length > 0 && (
            <section className="mt-16" aria-labelledby="privileges">
              <SectionHeading>
                <span id="privileges">What your membership holds</span>
              </SectionHeading>
              <ol className="grid gap-px overflow-hidden rounded-card bg-white/[0.05]">
                {tier.privileges.map((p) => (
                  <li key={p.id} className="grid gap-1 bg-ink-900 px-5 py-5 sm:grid-cols-[14rem_1fr] sm:gap-8">
                    <p className="text-body text-bone-100">{p.title}</p>
                    <p className="text-body-sm text-bone-400">{p.description}</p>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </>
      )}
    </MemberContainer>
  );
}
