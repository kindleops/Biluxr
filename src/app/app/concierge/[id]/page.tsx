import Link from "next/link";
import { notFound } from "next/navigation";
import { CancelRequest } from "@/components/member/cancel-request";
import { OptionCard } from "@/components/member/option-card";
import { MemberContainer } from "@/components/member/page-header";
import { MessageThread, ReplyBox } from "@/components/member/thread";
import { FormMessage } from "@/components/ui/field";
import { StatusPill } from "@/components/ui/status";
import { Timeline, type TimelineEntry } from "@/components/ui/timeline";
import { requireMember } from "@/lib/auth/session";
import { memberRepository, publicRepository } from "@/lib/data";
import { NotFoundError } from "@/lib/data/repository";
import { REQUEST_STATUS_PRESENTATION, isOpen, memberCanCancel, memberStatusLabel } from "@/lib/domain/requests";
import type { RequestEvent } from "@/lib/domain/types";
import { formatDateRange, formatDateTime } from "@/lib/format";

export const metadata = { title: "Request" };

function eventTitle(e: RequestEvent): string | null {
  switch (e.kind) {
    case "created":
      return "Request received";
    case "status_changed":
      return e.toStatus ? REQUEST_STATUS_PRESENTATION[e.toStatus].member : null;
    case "option_presented":
      return "Option presented";
    case "option_accepted":
      return "You chose an option";
    case "option_declined":
      return "You declined an option";
    default:
      return null;
  }
}

export default async function RequestPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ new?: string }>;
}) {
  const [{ id }, { new: isNew }] = await Promise.all([params, searchParams]);
  const identity = await requireMember();
  const repo = await memberRepository(identity);
  const detail = await repo.getRequest(id).catch((e) => {
    if (e instanceof NotFoundError) notFound();
    throw e;
  });
  const { profile } = await repo.profile();
  const pub = await publicRepository();
  const categories = pub ? await pub.listCategories() : [];
  const { request, messages, options, events, assignee } = detail;
  const presentation = REQUEST_STATUS_PRESENTATION[request.status];
  const accepted = options.some((o) => o.status === "accepted");
  const visibleOptions = options.filter((o) => o.status !== "withdrawn" || accepted);
  const tz = request.timezone ?? profile.timezone;

  const timeline: TimelineEntry[] = events
    .map((e, i) => {
      const title = eventTitle(e);
      if (!title) return null;
      return {
        id: e.id,
        title,
        meta: formatDateTime(e.createdAt, profile.timezone),
        body: e.kind.startsWith("option_") ? e.note : undefined,
        state: i === events.length - 1 ? ("current" as const) : ("done" as const),
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const facts = [
    ["Category", categories.find((c) => c.slug === request.categorySlug)?.name],
    ["When", request.startsAt ? formatDateRange(request.startsAt.slice(0, 10), request.endsAt?.slice(0, 10) ?? null) : null],
    ["Where", request.location],
    ["Party", request.partySize ? `${request.partySize} ${request.partySize === 1 ? "person" : "people"}` : null],
  ].filter((f): f is [string, string] => Boolean(f[1]));

  return (
    <MemberContainer wide>
      <nav aria-label="Breadcrumb" className="pt-8 lg:pt-12">
        <Link href="/app/concierge" className="text-caption text-bone-500 hover:text-bone-200">
          ← Concierge
        </Link>
      </nav>

      <header className="mt-6 grid gap-4 border-b border-white/[0.06] pb-8">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <StatusPill tone={presentation.tone}>{memberStatusLabel(request.status, options)}</StatusPill>
          <span className="font-mono text-caption text-bone-600">{request.reference}</span>
          {request.priority === "urgent" && <span className="text-caption text-status-amber">Time-sensitive</span>}
        </div>
        <h1 className="font-display text-headline font-light text-bone-50 text-balance">{request.title}</h1>
        {facts.length > 0 && (
          <dl className="flex flex-wrap gap-x-8 gap-y-2 text-body-sm">
            {facts.map(([k, v]) => (
              <div key={k} className="flex gap-2">
                <dt className="text-bone-500">{k}</dt>
                <dd className="text-bone-200">{v}</dd>
              </div>
            ))}
          </dl>
        )}
      </header>

      {isNew && (
        <div className="mt-6">
          <FormMessage kind="success">Received. {assignee ? `${assignee.name.split(" ")[0]} has it` : "Your concierge has it"} and will be in touch.</FormMessage>
        </div>
      )}

      <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="grid content-start gap-12">
          {visibleOptions.length > 0 && (
            <section aria-labelledby="options">
              <h2 id="options" className="mb-4 text-label text-bone-400">
                {accepted ? "Your choice" : "Options for you"}
              </h2>
              <div className="grid gap-3">
                {visibleOptions.map((o, i) => (
                  <OptionCard key={o.id} option={o} index={i} total={visibleOptions.length} timezone={tz} locked={accepted || !isOpen(request.status)} />
                ))}
              </div>
            </section>
          )}

          <section aria-labelledby="conversation">
            <h2 id="conversation" className="mb-5 text-label text-bone-400">
              Conversation
            </h2>
            <MessageThread messages={messages} viewerId={identity.userId} timezone={profile.timezone} />
            <div className="mt-8">
              <ReplyBox requestId={request.id} disabled={!isOpen(request.status)} />
            </div>
          </section>
        </div>

        <aside className="grid content-start gap-10 lg:sticky lg:top-8 lg:self-start">
          <section aria-labelledby="with">
            <h2 id="with" className="mb-3 text-label text-bone-400">
              With
            </h2>
            <p className="text-body-sm text-bone-200">{assignee?.name ?? "Your concierge team"}</p>
          </section>
          {timeline.length > 0 && (
            <section aria-labelledby="history">
              <h2 id="history" className="mb-5 text-label text-bone-400">
                History
              </h2>
              <Timeline entries={timeline} />
            </section>
          )}
          {memberCanCancel(request.status) && (
            <div>
              <CancelRequest requestId={request.id} />
            </div>
          )}
        </aside>
      </div>
    </MemberContainer>
  );
}
