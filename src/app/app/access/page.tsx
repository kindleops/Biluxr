import { InviteButton } from "@/components/member/invite";
import { MemberContainer, MemberPageHeader, SectionHeading } from "@/components/member/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusPill } from "@/components/ui/status";
import { requireMember } from "@/lib/auth/session";
import { memberRepository } from "@/lib/data";
import { formatDateLong } from "@/lib/format";

export const metadata = { title: "Access" };

const INVITE_STATUS = {
  issued: { label: "Awaiting application", tone: "neutral" },
  accepted: { label: "Applied", tone: "positive" },
  expired: { label: "Expired", tone: "muted" },
  revoked: { label: "Withdrawn", tone: "muted" },
} as const;

export default async function AccessPage() {
  const identity = await requireMember();
  const repo = await memberRepository(identity);
  const [offers, invitations, membership] = await Promise.all([repo.listAccessOffers(), repo.listInvitations(), repo.membership()]);
  const remaining = Math.max(0, membership.invitationAllowance - membership.invitationsUsed);
  const active = membership.membership?.status === "active";

  return (
    <MemberContainer>
      <MemberPageHeader eyebrow="Access" title="Doors, opened quietly." />

      <section aria-labelledby="offers">
        <SectionHeading>
          <span id="offers">For you</span>
        </SectionHeading>
        {offers.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {offers.map((o) => (
              <article key={o.id} className="flex flex-col justify-between gap-8 rounded-card bg-ink-900 p-6 shadow-[inset_0_0_0_1px_var(--line-subtle)]">
                <div>
                  <p className="text-label text-bone-500">{o.availableUntil ? `Until ${formatDateLong(o.availableUntil)}` : "Ongoing"}</p>
                  <h3 className="mt-4 font-display text-title font-light text-bone-50">{o.title}</h3>
                  <p className="mt-3 text-body-sm text-bone-400">{o.summary}</p>
                </div>
                {o.detail && <p className="text-caption text-bone-500">{o.detail} Ask your concierge to arrange it.</p>}
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-card shadow-[inset_0_0_0_1px_var(--line-subtle)]">
            <EmptyState title="New invitations will appear here." body="Openings, previews and privileges arranged with our partners — only when they are real and available to you." />
          </div>
        )}
      </section>

      <section className="mt-14" aria-labelledby="extend">
        <SectionHeading action={active ? <InviteButton remaining={remaining} /> : undefined}>
          <span id="extend">Invitations to extend</span>
        </SectionHeading>
        <p className="mb-5 text-body-sm text-bone-400">
          {active
            ? `${remaining} of ${membership.invitationAllowance} remaining. An invitation means their application is read first — not that it is accepted.`
            : "Available once your membership is active."}
        </p>
        {invitations.length > 0 && (
          <ul className="grid gap-px overflow-hidden rounded-card bg-white/[0.05]">
            {invitations.map((i) => (
              <li key={i.id} className="flex flex-wrap items-center justify-between gap-4 bg-ink-900 px-5 py-4">
                <div className="min-w-0">
                  <p className="text-body-sm text-bone-100">{i.inviteeName ?? i.email ?? "Invitation"}</p>
                  <p className="mt-0.5 font-mono text-caption text-bone-500">
                    {i.code} · issued {formatDateLong(i.createdAt)}
                  </p>
                </div>
                <StatusPill tone={INVITE_STATUS[i.status].tone}>{INVITE_STATUS[i.status].label}</StatusPill>
              </li>
            ))}
          </ul>
        )}
      </section>
    </MemberContainer>
  );
}
