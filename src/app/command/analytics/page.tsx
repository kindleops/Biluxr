import { CommandPage, Panel } from "@/components/command/page";
import { requireStaff } from "@/lib/auth/session";
import { staffRepository } from "@/lib/data";

export const metadata = { title: "Analytics" };

function Metric({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-lg bg-ink-900 p-4 shadow-[inset_0_0_0_1px_var(--line-subtle)]">
      <p className="text-label text-bone-500">{label}</p>
      <p className="mt-3 font-display text-[1.75rem] leading-none font-light text-bone-50 tabular-nums">
        {value}
      </p>
      {note && <p className="mt-2 text-caption text-bone-500">{note}</p>}
    </div>
  );
}

const pct = (v: number | null) => (v === null ? "—" : `${Math.round(v * 100)}%`);

/**
 * Operating metrics computed live from records. No projections, no invented
 * baselines; rates show "—" until there is data behind them.
 */
export default async function AnalyticsPage() {
  const identity = await requireStaff();
  const repo = await staffRepository(identity);
  const a = await repo.analytics();
  const max = Math.max(1, ...a.requests.byCategory.map((c) => c.count));

  return (
    <CommandPage eyebrow="Operations" title="Analytics">
      <p className="-mt-4 mb-8 max-w-2xl text-body-sm text-bone-400">
        Computed from live records. A dash means there is not yet enough data to say anything
        honest.
      </p>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric
          label="Applications"
          value={String(a.applications.total)}
          note={`${a.applications.pending} awaiting review · ${a.applications.approved} approved`}
        />
        <Metric
          label="Active members"
          value={String(a.members.active)}
          note={`${a.members.pendingActivation} awaiting activation · ${a.members.founding} founding`}
        />
        <Metric
          label="Requests"
          value={String(a.requests.total)}
          note={`${a.requests.open} open · ${a.requests.completed} completed · ${a.requests.cancelled} cancelled`}
        />
        <Metric
          label="Providers"
          value={String(a.providers.total)}
          note={`${a.providers.approved} approved or preferred`}
        />
        <Metric
          label="Median first response"
          value={
            a.medianFirstResponseMinutes === null
              ? "—"
              : `${Math.round(a.medianFirstResponseMinutes)}m`
          }
        />
        <Metric label="First response within SLA" value={pct(a.slaMetRate)} />
        <Metric
          label="Option acceptance"
          value={pct(a.optionAcceptanceRate)}
          note="Of options the member decided on"
        />
        <Metric
          label="AI suggestions"
          value={String(a.ai.total)}
          note={`${a.ai.accepted} accepted · ${a.ai.edited} edited · ${a.ai.dismissed} dismissed · ${a.ai.failed} failed`}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Requests by category">
          {a.requests.byCategory.length === 0 ? (
            <p className="text-body-sm text-bone-500">No requests yet.</p>
          ) : (
            <ul className="grid gap-3">
              {a.requests.byCategory.map((c) => (
                <li
                  key={c.category}
                  className="grid grid-cols-[9rem_1fr_2rem] items-center gap-3 text-body-sm"
                >
                  <span className="truncate text-bone-300">{c.category}</span>
                  <span className="h-1.5 rounded-full bg-white/[0.05]">
                    <span
                      className="block h-1.5 rounded-full bg-bone-300"
                      style={{ width: `${(c.count / max) * 100}%` }}
                    />
                  </span>
                  <span className="text-right font-mono text-caption text-bone-400 tabular-nums">
                    {c.count}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Not yet measured">
          <p className="text-body-sm text-bone-400">
            GMV, take rate, retention, referral conversion and provider response rate require
            payments and a longer operating history. The schema and event log are in place; these
            appear once the underlying data exists.
          </p>
        </Panel>
      </div>
    </CommandPage>
  );
}
