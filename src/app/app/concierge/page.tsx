import { RequestCard } from "@/components/member/cards";
import { CommandComposer } from "@/components/member/composer";
import { MemberContainer, MemberPageHeader, SectionHeading } from "@/components/member/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { requireMember } from "@/lib/auth/session";
import { memberRepository, publicRepository } from "@/lib/data";
import { isOpen } from "@/lib/domain/requests";

export const metadata = { title: "Concierge" };

export default async function ConciergePage() {
  const identity = await requireMember();
  const repo = await memberRepository(identity);
  const [requests, home, pub] = await Promise.all([repo.listRequests(), repo.home(), publicRepository()]);
  const categories = pub ? await pub.listCategories() : [];
  const categoryName = (slug: string | null) => categories.find((c) => c.slug === slug)?.name ?? null;
  const open = requests.filter((r) => isOpen(r.status));
  const past = requests.filter((r) => !isOpen(r.status));
  const active = home.viewer.membership?.status === "active";

  return (
    <MemberContainer>
      <MemberPageHeader eyebrow="Concierge" title="Request anything." />
      {active && <CommandComposer variant="compact" />}

      <section className="mt-12" aria-labelledby="open">
        <SectionHeading>
          <span id="open">Open</span>
        </SectionHeading>
        {open.length > 0 ? (
          <div className="grid gap-3">
            {open.map((r) => (
              <RequestCard key={r.id} request={r} options={r.options} lastActivity={r.lastMessageAt} categoryName={categoryName(r.categorySlug)} />
            ))}
          </div>
        ) : (
          <div className="rounded-card shadow-[inset_0_0_0_1px_var(--line-subtle)]">
            <EmptyState title="Nothing in motion." body="When you need something, Biluxr is here." />
          </div>
        )}
      </section>

      {past.length > 0 && (
        <section className="mt-14" aria-labelledby="past">
          <SectionHeading>
            <span id="past">Past</span>
          </SectionHeading>
          <div className="grid gap-3 sm:grid-cols-2">
            {past.map((r) => (
              <RequestCard key={r.id} request={r} options={r.options} lastActivity={r.lastMessageAt} categoryName={categoryName(r.categorySlug)} />
            ))}
          </div>
        </section>
      )}
    </MemberContainer>
  );
}
