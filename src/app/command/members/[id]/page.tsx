import Link from "next/link";
import { notFound } from "next/navigation";
import { activateMembershipAction, assignOwnerAction, summarizeMemberAction } from "@/app/command/actions";
import { AddMemberPreference } from "@/components/command/member-tools";
import { CommandPage, KeyValue, Panel } from "@/components/command/page";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/field";
import { StatusPill } from "@/components/ui/status";
import { parseSummary } from "@/lib/ai/schemas";
import { aiAvailable } from "@/lib/ai/service";
import { requireStaff } from "@/lib/auth/session";
import { staffRepository } from "@/lib/data";
import { NotFoundError } from "@/lib/data/repository";
import { REQUEST_STATUS_PRESENTATION } from "@/lib/domain/requests";
import { formatDateLong, formatDateRange, formatRelative } from "@/lib/format";

export const metadata = { title: "Member" };

export default async function Member360Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const identity = await requireStaff();
  const repo = await staffRepository(identity);
  const m = await repo.member360(id).catch((e) => {
    if (e instanceof NotFoundError) notFound();
    throw e;
  });
  const latestSummary = m.summaries.find((s) => s.status !== "dismissed" && s.status !== "failed");
  const summary = latestSummary ? parseSummary(latestSummary.output) : null;

  return (
    <CommandPage
      eyebrow={
        <Link href="/command/members" className="hover:text-bone-200">
          ← Members
        </Link>
      }
      title={
        <>
          {m.profile.fullName}
          {m.profile.preferredName && <span className="text-bone-500"> · “{m.profile.preferredName}”</span>}
        </>
      }
      actions={
        m.membership?.status === "pending_activation" ? (
          <form action={activateMembershipAction}>
            <input type="hidden" name="memberId" value={m.profile.id} />
            <Button type="submit" size="sm">
              Activate membership
            </Button>
          </form>
        ) : undefined
      }
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="grid content-start gap-6">
          <Panel title="Briefing">
            {summary && latestSummary ? (
              <div className="grid gap-3">
                <p className="text-body text-bone-100">{summary.headline}</p>
                <ul className="list-disc pl-5 text-body-sm text-bone-300">
                  {summary.keyPoints.map((k) => (
                    <li key={k}>{k}</li>
                  ))}
                </ul>
                {summary.openItems.length > 0 && <p className="text-caption text-bone-400">Open: {summary.openItems.join(" · ")}</p>}
                {summary.watchOuts.length > 0 && <p className="text-caption text-status-amber">Watch: {summary.watchOuts.join(" · ")}</p>}
                <p className="text-caption text-bone-600">
                  Drafted by Biluxr AI ({latestSummary.model}) {formatRelative(latestSummary.createdAt)} — verify before relying on it.
                </p>
              </div>
            ) : aiAvailable() ? (
              <form action={summarizeMemberAction} className="flex items-center justify-between gap-4">
                <p className="text-body-sm text-bone-400">Draft a briefing from this member&apos;s records.</p>
                <input type="hidden" name="memberId" value={m.profile.id} />
                <Button type="submit" size="sm" variant="secondary">
                  Draft briefing
                </Button>
              </form>
            ) : (
              <p className="text-body-sm text-bone-500">Briefings are drafted by Biluxr AI, which is not configured in this environment.</p>
            )}
          </Panel>

          <Panel title={`Requests (${m.requests.length})`}>
            {m.requests.length === 0 ? (
              <p className="text-body-sm text-bone-500">No requests yet.</p>
            ) : (
              <ul className="grid gap-px overflow-hidden rounded-md bg-white/[0.05]">
                {m.requests.map((r) => (
                  <li key={r.id} className="relative flex items-center justify-between gap-4 bg-ink-900 px-4 py-3 hover:bg-ink-850">
                    <Link href={`/command/requests/${r.id}`} className="min-w-0 truncate text-body-sm text-bone-100 after:absolute after:inset-0">
                      {r.title}
                    </Link>
                    <span className="flex shrink-0 items-center gap-4">
                      <StatusPill tone={REQUEST_STATUS_PRESENTATION[r.status].tone}>{REQUEST_STATUS_PRESENTATION[r.status].staff}</StatusPill>
                      <span className="hidden text-caption text-bone-500 sm:inline">{formatRelative(r.createdAt)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <div className="grid gap-6 md:grid-cols-2">
            <Panel title="Preferences" action={<AddMemberPreference memberId={m.profile.id} />}>
              {m.preferences.length === 0 ? (
                <p className="text-body-sm text-bone-500">Nothing recorded yet.</p>
              ) : (
                <ul className="grid gap-2.5">
                  {m.preferences.map((p) => (
                    <li key={p.id} className="text-body-sm">
                      <span className="text-caption text-bone-500">{p.domain} · </span>
                      <span className="text-bone-300">{p.label}: </span>
                      <span className="text-bone-100">{p.value}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
            <Panel title="People">
              {m.people.length === 0 ? (
                <p className="text-body-sm text-bone-500">None recorded.</p>
              ) : (
                <ul className="grid gap-2.5">
                  {m.people.map((p) => (
                    <li key={p.id} className="text-body-sm">
                      <span className="text-bone-100">{p.name}</span> <span className="text-bone-500">· {p.relationship}</span>
                      {p.notes && <p className="text-caption text-bone-400">{p.notes}</p>}
                      {p.birthday && <p className="text-caption text-bone-500">Birthday {formatDateLong(p.birthday)}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        </div>

        <aside className="grid content-start gap-6">
          <Panel title="Membership">
            <KeyValue
              items={[
                ["Number", m.membership ? <span className="font-mono">№ {m.membership.memberNumber}</span> : "—"],
                ["Status", m.membership?.status.replace("_", " ") ?? "None"],
                ["Tier", m.tier?.name ?? "—"],
                ["Since", m.membership?.startedAt ? formatDateLong(m.membership.startedAt) : "—"],
                ["Renews", m.membership?.renewsAt ? formatDateLong(m.membership.renewsAt) : "—"],
                ["Founding", m.membership?.isFounding ? "Yes" : "No"],
                ["Email", m.profile.email],
                ["Time zone", m.profile.timezone],
              ]}
            />
          </Panel>
          <Panel title="Relationship owner">
            <form action={assignOwnerAction} className="grid gap-3">
              <input type="hidden" name="memberId" value={m.profile.id} />
              <label htmlFor="ownerId" className="sr-only">
                Relationship owner
              </label>
              <Select id="ownerId" name="ownerId" defaultValue={m.membership?.relationshipOwnerId ?? ""} dense>
                <option value="">Unassigned</option>
                {m.staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
              <Button type="submit" size="sm" variant="secondary">
                Save owner
              </Button>
            </form>
          </Panel>
          {m.founding && (
            <Panel title="Founding cohort">
              <KeyValue
                items={[
                  ["Referral", m.founding.referralSource],
                  ["Onboarding", m.founding.onboardingStatus.replace("_", " ")],
                  ["Preferences", m.founding.preferencesCompleted ? "Complete" : "Incomplete"],
                  ["First request", m.founding.firstRequestAt ? formatDateLong(m.founding.firstRequestAt) : "Not yet"],
                  ["Satisfaction", m.founding.satisfaction ? `${m.founding.satisfaction} / 5` : "Not rated"],
                  ["Referral potential", m.founding.referralPotential ?? "—"],
                ]}
              />
            </Panel>
          )}
          <Panel title="Journeys">
            {m.journeys.length === 0 ? (
              <p className="text-body-sm text-bone-500">None.</p>
            ) : (
              <ul className="grid gap-2">
                {m.journeys.map((j) => (
                  <li key={j.id} className="text-body-sm">
                    <p className="text-bone-100">{j.title}</p>
                    <p className="text-caption text-bone-500">
                      {formatDateRange(j.startsOn, j.endsOn)} · {j.status}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </aside>
      </div>
    </CommandPage>
  );
}
