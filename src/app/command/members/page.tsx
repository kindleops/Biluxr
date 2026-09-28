import Link from "next/link";
import { CommandPage } from "@/components/command/page";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusPill } from "@/components/ui/status";
import { requireStaff } from "@/lib/auth/session";
import { staffRepository } from "@/lib/data";
import { formatRelative } from "@/lib/format";

export const metadata = { title: "Members" };

const TONE = { active: "positive", pending_activation: "attention", paused: "muted", lapsed: "muted", cancelled: "negative" } as const;

export default async function MembersPage() {
  const identity = await requireStaff();
  const repo = await staffRepository(identity);
  const members = await repo.listMembers();
  return (
    <CommandPage eyebrow="Command" title="Members">
      {members.length === 0 ? (
        <div className="rounded-lg shadow-[inset_0_0_0_1px_var(--line-subtle)]">
          <EmptyState title="No members yet." body="Approved applicants appear here once they sign in for the first time." />
        </div>
      ) : (
        <ul className="grid gap-px overflow-hidden rounded-lg bg-white/[0.05]">
          {members.map((m) => (
            <li key={m.profile.id} className="relative grid gap-1 bg-ink-950 px-4 py-3.5 transition-colors hover:bg-ink-900 sm:grid-cols-[4rem_1.4fr_1fr_1fr_8rem] sm:items-center sm:gap-4">
              <span className="font-mono text-caption text-bone-500">№ {m.membership?.memberNumber ?? "—"}</span>
              <Link href={`/command/members/${m.profile.id}`} className="text-body-sm text-bone-50 after:absolute after:inset-0">
                {m.profile.fullName}
                {m.membership?.isFounding && <span className="ml-2 text-caption text-sable-400">Founding</span>}
              </Link>
              <span>
                {m.membership ? (
                  <StatusPill tone={TONE[m.membership.status]}>{m.membership.status.replace("_", " ")}</StatusPill>
                ) : (
                  <span className="text-caption text-bone-600">No membership</span>
                )}
              </span>
              <span className="text-caption text-bone-400">{m.relationshipOwner?.name ?? "No owner"}</span>
              <span className="text-caption text-bone-500 sm:text-right">
                {m.openRequests > 0 ? `${m.openRequests} open` : m.lastRequestAt ? `Last ${formatRelative(m.lastRequestAt)}` : "No requests"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </CommandPage>
  );
}
