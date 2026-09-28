import Link from "next/link";
import { CommandPage } from "@/components/command/page";
import { SlaBadge } from "@/components/command/sla";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusPill } from "@/components/ui/status";
import { cn } from "@/lib/cn";
import { requireStaff } from "@/lib/auth/session";
import { staffRepository } from "@/lib/data";
import type { QueueFilters } from "@/lib/data/repository";
import { PRIORITY_LABEL, REQUEST_STATUS_PRESENTATION } from "@/lib/domain/requests";
import { formatRelative } from "@/lib/format";

export const metadata = { title: "Queue" };

const VIEWS: { key: string; label: string; filters: QueueFilters }[] = [
  { key: "open", label: "Open", filters: { status: "open" } },
  { key: "mine", label: "Mine", filters: { status: "open", assignee: "me" } },
  { key: "unassigned", label: "Unassigned", filters: { status: "open", assignee: "unassigned" } },
  { key: "urgent", label: "Urgent", filters: { status: "open", priority: "urgent" } },
  { key: "all", label: "All", filters: { status: "all" } },
];

export default async function QueuePage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { view = "open" } = await searchParams;
  const current = VIEWS.find((v) => v.key === view) ?? VIEWS[0]!;
  const identity = await requireStaff();
  const repo = await staffRepository(identity);
  const items = await repo.queue(current.filters);
  const now = new Date();

  return (
    <CommandPage eyebrow="Command" title="Request queue">
      <nav aria-label="Queue views" className="mb-5 flex gap-1 overflow-x-auto scrollbar-none">
        {VIEWS.map((v) => (
          <Link
            key={v.key}
            href={v.key === "open" ? "/command" : `/command?view=${v.key}`}
            aria-current={v.key === current.key ? "page" : undefined}
            className={cn(
              "shrink-0 rounded-sm px-3 py-1.5 text-body-sm transition-colors",
              v.key === current.key ? "bg-white/[0.08] text-bone-50" : "text-bone-400 hover:text-bone-100",
            )}
          >
            {v.label}
          </Link>
        ))}
      </nav>

      {items.length === 0 ? (
        <div className="rounded-lg shadow-[inset_0_0_0_1px_var(--line-subtle)]">
          <EmptyState title="The queue is clear." body="New requests from members appear here the moment they are sent." />
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg shadow-[inset_0_0_0_1px_var(--line-subtle)]">
          <table className="w-full border-collapse text-left text-body-sm">
            <thead className="hidden bg-ink-900 text-caption text-bone-500 md:table-header-group">
              <tr>
                <th scope="col" className="w-2 p-0" aria-label="Priority" />
                <th scope="col" className="px-4 py-2.5 font-normal">Request</th>
                <th scope="col" className="px-4 py-2.5 font-normal">Member</th>
                <th scope="col" className="px-4 py-2.5 font-normal">Status</th>
                <th scope="col" className="px-4 py-2.5 font-normal">First response</th>
                <th scope="col" className="px-4 py-2.5 font-normal">Owner</th>
                <th scope="col" className="px-4 py-2.5 text-right font-normal">Updated</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => {
                const p = REQUEST_STATUS_PRESENTATION[r.status];
                return (
                  <tr key={r.id} className="group relative grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 border-t border-white/[0.05] bg-ink-950 px-4 py-3 transition-colors first:border-t-0 hover:bg-ink-900 md:table-row md:p-0">
                    <td className="hidden p-0 md:table-cell">
                      <span
                        aria-label={PRIORITY_LABEL[r.priority]}
                        className={cn(
                          "block h-full min-h-14 w-0.5",
                          r.priority === "urgent" && "bg-status-clay",
                          r.priority === "priority" && "bg-status-amber",
                        )}
                      />
                    </td>
                    <td className="min-w-0 md:px-4 md:py-3">
                      <Link href={`/command/requests/${r.id}`} className="block after:absolute after:inset-0">
                        <span className="block truncate text-bone-50">{r.title}</span>
                        <span className="mt-0.5 block font-mono text-caption text-bone-600">
                          {r.reference}
                          {r.priority !== "standard" && <span className="ml-2 font-sans text-status-amber">{PRIORITY_LABEL[r.priority]}</span>}
                        </span>
                      </Link>
                    </td>
                    <td className="col-start-1 text-bone-300 md:px-4 md:py-3">
                      {r.member.name}
                      {r.isFounding && (
                        <span className="ml-2 inline-block size-1.5 rounded-full bg-sable-400 align-middle" title="Founding member">
                          <span className="sr-only">Founding member</span>
                        </span>
                      )}
                    </td>
                    <td className="col-start-2 row-start-1 md:px-4 md:py-3">
                      <StatusPill tone={p.tone}>{p.staff}</StatusPill>
                    </td>
                    <td className="col-start-2 row-start-2 text-right md:px-4 md:py-3 md:text-left">
                      <SlaBadge dueAt={r.firstResponseDueAt} respondedAt={r.firstRespondedAt} now={now} />
                    </td>
                    <td className="hidden text-bone-400 md:table-cell md:px-4 md:py-3">{r.assignee?.name ?? <span className="text-bone-600">Unassigned</span>}</td>
                    <td className="hidden text-right text-caption text-bone-500 md:table-cell md:px-4 md:py-3">{formatRelative(r.updatedAt, now)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </CommandPage>
  );
}
