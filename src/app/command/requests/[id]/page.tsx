import Link from "next/link";
import { notFound } from "next/navigation";
import { setOptionStatusAction } from "@/app/command/actions";
import { AiPanel } from "@/components/command/ai-panel";
import { KeyValue, Panel } from "@/components/command/page";
import { OptionBuilder, RequestControls, StaffComposer } from "@/components/command/request-tools";
import { SlaBadge } from "@/components/command/sla";
import { StatusPill } from "@/components/ui/status";
import { Timeline } from "@/components/ui/timeline";
import { aiAvailable } from "@/lib/ai/service";
import { cn } from "@/lib/cn";
import { requireStaff } from "@/lib/auth/session";
import { publicRepository, staffRepository } from "@/lib/data";
import { NotFoundError } from "@/lib/data/repository";
import { PRIORITY_LABEL, REQUEST_STATUS_PRESENTATION, isOpen } from "@/lib/domain/requests";
import { isDemo } from "@/lib/env";
import { formatDateTime, formatMoney } from "@/lib/format";

export const metadata = { title: "Request" };

const OPTION_TONE = {
  draft: "neutral",
  presented: "attention",
  accepted: "positive",
  declined: "muted",
  expired: "muted",
  withdrawn: "negative",
} as const;

export default async function StaffRequestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const identity = await requireStaff();
  const repo = await staffRepository(identity);
  const d = await repo.getRequest(id).catch((e) => {
    if (e instanceof NotFoundError) notFound();
    throw e;
  });
  const pub = await publicRepository();
  const categories = pub ? await pub.listCategories() : [];
  const {
    request,
    member,
    membership,
    messages,
    options,
    events,
    aiEvents,
    staff,
    providers,
    preferences,
  } = d;
  const p = REQUEST_STATUS_PRESENTATION[request.status];
  const tz = request.timezone ?? member.timezone;
  const personName = (pid: string | null) =>
    staff.find((s) => s.id === pid)?.name ?? (pid === member.id ? member.fullName : "System");

  return (
    <div className="px-4 pt-6 pb-16 sm:px-8 lg:pt-8">
      <nav aria-label="Breadcrumb">
        <Link href="/command" className="text-caption text-bone-500 hover:text-bone-200">
          ← Queue
        </Link>
      </nav>
      <header className="mt-4 flex flex-wrap items-start justify-between gap-4 border-b border-white/[0.06] pb-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <StatusPill tone={p.tone}>{p.staff}</StatusPill>
            <span className="font-mono text-caption text-bone-500">{request.reference}</span>
            <span
              className={cn(
                "text-caption",
                request.priority === "standard" ? "text-bone-500" : "text-status-amber",
              )}
            >
              {PRIORITY_LABEL[request.priority]}
            </span>
            <SlaBadge dueAt={request.firstResponseDueAt} respondedAt={request.firstRespondedAt} />
          </div>
          <h1 className="mt-3 font-display text-[1.9rem] leading-tight font-light text-bone-50">
            {request.title}
          </h1>
          <p className="mt-1 text-body-sm text-bone-400">
            <Link href={`/command/members/${member.id}`} className="text-bone-200 hover:underline">
              {member.fullName}
            </Link>
            {membership && (
              <span className="font-mono text-bone-500"> · № {membership.memberNumber}</span>
            )}
            {membership?.isFounding && <span className="text-sable-400"> · Founding</span>}
            <span> · received {formatDateTime(request.createdAt, member.timezone)}</span>
          </p>
        </div>
      </header>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="grid content-start gap-6">
          <Panel title="Brief">
            <p className="text-body whitespace-pre-line text-bone-100">{request.brief}</p>
          </Panel>

          <Panel
            title={`Options (${options.length})`}
            action={
              isOpen(request.status) ? (
                <OptionBuilder requestId={request.id} providers={providers} />
              ) : undefined
            }
          >
            {options.length === 0 ? (
              <p className="text-body-sm text-bone-500">
                No options yet. Draft privately, then present when ready.
              </p>
            ) : (
              <ul className="grid gap-2">
                {options.map((o) => (
                  <li
                    key={o.id}
                    className="flex flex-wrap items-start justify-between gap-3 rounded-md bg-ink-950 px-4 py-3 shadow-[inset_0_0_0_1px_var(--line-subtle)]"
                  >
                    <div className="min-w-0">
                      <p className="text-body-sm text-bone-100">{o.title}</p>
                      <p className="mt-0.5 text-caption text-bone-500">
                        {o.price ? formatMoney(o.price) : "Price on request"}
                        {o.providerId &&
                          ` · ${providers.find((pr) => pr.id === o.providerId)?.name ?? "Provider"}`}
                        {o.expiresAt && ` · held until ${formatDateTime(o.expiresAt, tz)}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusPill tone={OPTION_TONE[o.status]}>{o.status}</StatusPill>
                      {(o.status === "draft" || o.status === "presented") && (
                        <form action={setOptionStatusAction} className="flex gap-1">
                          <input type="hidden" name="optionId" value={o.id} />
                          <input type="hidden" name="requestId" value={request.id} />
                          {o.status === "draft" && (
                            <button
                              type="submit"
                              name="status"
                              value="presented"
                              className="rounded-xs px-2 py-1 text-caption text-bone-200 shadow-[inset_0_0_0_1px_var(--line)] hover:bg-white/5"
                            >
                              Present
                            </button>
                          )}
                          <button
                            type="submit"
                            name="status"
                            value="withdrawn"
                            className="rounded-xs px-2 py-1 text-caption text-bone-500 hover:text-status-clay"
                          >
                            Withdraw
                          </button>
                        </form>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {options.some((o) => o.status === "accepted") &&
              request.status !== "confirmed" &&
              isOpen(request.status) && (
                <p className="mt-3 text-caption text-status-amber">
                  The member has chosen an option. Confirm with the provider, then set the status to
                  Confirmed.
                </p>
              )}
          </Panel>

          <Panel title="Conversation">
            <ol className="grid gap-4">
              {messages.map((m) => (
                <li
                  key={m.id}
                  className={cn(
                    "rounded-md px-4 py-3",
                    m.visibility === "internal"
                      ? "bg-status-amber/[0.04] shadow-[inset_0_0_0_1px_rgb(207_166_106/0.25)]"
                      : m.authorKind === "member"
                        ? "bg-ink-800"
                        : "bg-ink-950 shadow-[inset_0_0_0_1px_var(--line-subtle)]",
                  )}
                >
                  <p className="text-caption text-bone-500">
                    {m.visibility === "internal" && (
                      <span className="mr-2 text-status-amber">Internal</span>
                    )}
                    <span className="text-bone-300">
                      {m.authorKind === "member" ? member.fullName : m.authorName || "Biluxr"}
                    </span>{" "}
                    · {formatDateTime(m.createdAt, member.timezone)}
                  </p>
                  <p className="mt-1.5 text-body-sm whitespace-pre-line text-bone-100">{m.body}</p>
                </li>
              ))}
            </ol>
            <div className="mt-5">
              <StaffComposer requestId={request.id} closed={!isOpen(request.status)} />
            </div>
          </Panel>
        </div>

        <aside className="grid content-start gap-6">
          <Panel title="Controls">
            <RequestControls
              requestId={request.id}
              status={request.status}
              assigneeId={request.assigneeId}
              priority={request.priority}
              categorySlug={request.categorySlug}
              staff={staff}
              categories={categories}
            />
          </Panel>

          <Panel title="Biluxr AI">
            <AiPanel
              request={request}
              events={aiEvents}
              categories={categories}
              canAnalyze={aiAvailable() || isDemo()}
              canSummarize={aiAvailable()}
            />
          </Panel>

          <Panel
            title="Member context"
            action={
              <Link
                href={`/command/members/${member.id}`}
                className="text-caption text-bone-400 hover:text-bone-100"
              >
                360 →
              </Link>
            }
          >
            <KeyValue
              items={[
                ["Time zone", member.timezone],
                ["Membership", membership ? membership.status.replace("_", " ") : "None"],
                ["Owner", personName(membership?.relationshipOwnerId ?? null)],
              ]}
            />
            {preferences.length > 0 && (
              <ul className="mt-4 grid gap-2 border-t border-white/[0.05] pt-4">
                {preferences.slice(0, 6).map((pref) => (
                  <li key={pref.id} className="text-caption">
                    <span className="text-bone-500">{pref.label}: </span>
                    <span className="text-bone-200">{pref.value}</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="History">
            <Timeline
              entries={events.map((e, i) => ({
                id: e.id,
                title:
                  e.kind === "status_changed" && e.toStatus
                    ? `→ ${REQUEST_STATUS_PRESENTATION[e.toStatus].staff}`
                    : e.kind === "assigned"
                      ? `Assigned to ${personName(e.note)}`
                      : e.kind.replace("_", " ").replace(/^./, (c) => c.toUpperCase()),
                meta: formatDateTime(e.createdAt, member.timezone),
                body: e.kind.startsWith("option") ? e.note : `by ${personName(e.actorId)}`,
                state: i === events.length - 1 ? "current" : "done",
              }))}
            />
          </Panel>
        </aside>
      </div>
    </div>
  );
}
