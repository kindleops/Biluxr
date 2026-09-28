import Link from "next/link";
import { CommandPage, Panel } from "@/components/command/page";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusPill } from "@/components/ui/status";
import { requireStaff } from "@/lib/auth/session";
import { staffRepository } from "@/lib/data";
import type { ApplicationStatus } from "@/lib/domain/types";
import { formatRelative } from "@/lib/format";

export const metadata = { title: "Applications" };

const APPLICATION_TONE: Record<
  ApplicationStatus,
  "neutral" | "attention" | "active" | "positive" | "muted" | "negative"
> = {
  submitted: "attention",
  in_review: "active",
  conversation: "active",
  approved: "positive",
  waitlisted: "muted",
  declined: "negative",
  withdrawn: "muted",
};

export default async function ApplicationsPage() {
  const identity = await requireStaff();
  const repo = await staffRepository(identity);
  const [applications, partners] = await Promise.all([
    repo.listApplications(),
    repo.listPartnerApplications(),
  ]);
  const open = applications.filter((a) =>
    ["submitted", "in_review", "conversation"].includes(a.status),
  );
  const decided = applications.filter((a) => !open.includes(a));

  const list = (items: typeof applications) => (
    <ul className="grid gap-px overflow-hidden rounded-lg bg-white/[0.05]">
      {items.map((a) => (
        <li
          key={a.id}
          className="relative grid gap-1 bg-ink-950 px-4 py-3.5 hover:bg-ink-900 sm:grid-cols-[1.4fr_1fr_1fr_8rem] sm:items-center sm:gap-4"
        >
          <Link
            href={`/command/applications/${a.id}`}
            className="text-body-sm text-bone-50 after:absolute after:inset-0"
          >
            {a.fullName}
            {a.invitationCode && <span className="ml-2 text-caption text-sable-400">Invited</span>}
          </Link>
          <span className="text-caption text-bone-400">
            {a.city}
            {a.occupation ? ` · ${a.occupation}` : ""}
          </span>
          <StatusPill tone={APPLICATION_TONE[a.status]}>{a.status.replace("_", " ")}</StatusPill>
          <span className="text-caption text-bone-500 sm:text-right">
            {formatRelative(a.submittedAt)}
          </span>
        </li>
      ))}
    </ul>
  );

  return (
    <CommandPage eyebrow="Command" title="Applications">
      <section aria-labelledby="open-apps">
        <h2 id="open-apps" className="text-label mb-3 text-bone-400">
          To review ({open.length})
        </h2>
        {open.length ? (
          list(open)
        ) : (
          <div className="rounded-lg shadow-[inset_0_0_0_1px_var(--line-subtle)]">
            <EmptyState
              compact
              title="Nothing to review."
              body="New applications from the website arrive here."
            />
          </div>
        )}
      </section>
      {decided.length > 0 && (
        <section aria-labelledby="decided-apps" className="mt-10">
          <h2 id="decided-apps" className="text-label mb-3 text-bone-400">
            Decided
          </h2>
          {list(decided)}
        </section>
      )}
      <section aria-labelledby="partner-apps" className="mt-10">
        <Panel title={`Partner introductions (${partners.length})`}>
          {partners.length === 0 ? (
            <p className="text-body-sm text-bone-500">None yet.</p>
          ) : (
            <ul className="grid gap-4">
              {partners.map((p) => (
                <li key={p.id} className="grid gap-1">
                  <p className="text-body-sm text-bone-100">
                    {p.organization}{" "}
                    <span className="text-bone-500">
                      · {p.contactName} · {p.city}
                    </span>
                  </p>
                  <p className="text-caption text-bone-400">{p.message}</p>
                  <p className="text-caption text-bone-600">
                    {p.email} · {formatRelative(p.submittedAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </section>
    </CommandPage>
  );
}
