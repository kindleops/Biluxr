import { resetDemoAction } from "@/app/command/actions";
import { CommandPage, Panel } from "@/components/command/page";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status";
import { requireAdmin } from "@/lib/auth/session";
import { staffRepository } from "@/lib/data";
import { integrationStatus, isDemo } from "@/lib/env";
import { formatMoney } from "@/lib/format";

export const metadata = { title: "Configuration" };

const MARKET_TONE = {
  planned: "muted",
  preparing: "attention",
  active: "positive",
  paused: "negative",
} as const;

export default async function SettingsPage() {
  const identity = await requireAdmin();
  const repo = await staffRepository(identity);
  const s = await repo.settings();
  const integrations = integrationStatus();

  return (
    <CommandPage eyebrow="Administration" title="Configuration">
      <p className="-mt-4 mb-8 max-w-2xl text-body-sm text-bone-400">
        Business assumptions live in configuration, not code. Changes are made in the database (and
        audited); this view is the source of truth for what the product currently believes.
      </p>
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Integrations">
          <ul className="grid gap-3">
            {integrations.map((i) => (
              <li key={i.key} className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-body-sm text-bone-100">{i.label}</p>
                  <p className="text-caption text-bone-500">{i.purpose}</p>
                  {!i.configured && (
                    <p className="mt-1 font-mono text-caption text-bone-600">
                      {i.requiredEnv.join(", ")}
                    </p>
                  )}
                </div>
                <StatusPill tone={i.configured ? "positive" : "muted"}>
                  {i.configured ? "Configured" : "Not configured"}
                </StatusPill>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Membership tiers">
          <ul className="grid gap-4">
            {s.tiers.map((t) => (
              <li key={t.id}>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-body-sm text-bone-100">{t.name}</p>
                  <StatusPill tone={t.isActive ? "positive" : "muted"}>
                    {t.isActive ? "Active" : "Inactive"}
                  </StatusPill>
                </div>
                <p className="mt-1 text-caption text-bone-500">
                  Annual {t.annualFee ? formatMoney(t.annualFee) : "unpublished"} · Initiation{" "}
                  {t.initiationFee ? formatMoney(t.initiationFee) : "unpublished"} ·{" "}
                  {t.invitationAllowance} invitations · {t.privileges.length} privileges
                </p>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Service levels">
          <table className="w-full text-left text-body-sm">
            <thead className="text-caption text-bone-500">
              <tr>
                <th className="py-1 font-normal">Priority</th>
                <th className="py-1 font-normal">First response</th>
                <th className="py-1 font-normal">Options within</th>
              </tr>
            </thead>
            <tbody>
              {s.slas.map((x) => (
                <tr key={x.priority} className="border-t border-white/[0.05]">
                  <td className="py-2 text-bone-200">{x.priority}</td>
                  <td className="py-2 font-mono text-bone-300">{x.firstResponseMinutes}m</td>
                  <td className="py-2 font-mono text-bone-300">{x.optionsWithinHours}h</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel title="Revenue rules">
          <ul className="grid gap-3">
            {s.fees.map((f) => (
              <li key={f.id} className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-body-sm text-bone-100">{f.label}</p>
                  <p className="font-mono text-caption text-bone-500">
                    {f.key} ·{" "}
                    {f.kind === "percentage"
                      ? `${(f.basisPoints ?? 0) / 100}%`
                      : formatMoney(f.amount)}{" "}
                    · {f.appliesTo}
                  </p>
                </div>
                <StatusPill tone={f.isActive ? "positive" : "muted"}>
                  {f.isActive ? "Active" : "Inactive"}
                </StatusPill>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Service regions">
          <ul className="grid gap-2 sm:grid-cols-2">
            {s.markets.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-3 text-body-sm">
                <span className="text-bone-200">{m.name}</span>
                <StatusPill tone={MARKET_TONE[m.status]}>{m.status}</StatusPill>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Categories, cards & notifications">
          <p className="text-caption text-bone-500">Categories</p>
          <p className="mt-1 text-body-sm text-bone-300">
            {s.categories
              .map((c) => `${c.name}${c.vertical !== "concierge" ? ` (${c.vertical})` : ""}`)
              .join(" · ")}
          </p>
          <p className="mt-4 text-caption text-bone-500">Card programs</p>
          <p className="mt-1 text-body-sm text-bone-300">
            {s.cardPrograms
              .map((c) => `${c.name} — ${c.isActive ? "active" : "not launched"}`)
              .join(" · ") || "None"}
          </p>
          <p className="mt-4 text-caption text-bone-500">Notification templates</p>
          <p className="mt-1 font-mono text-caption text-bone-300">
            {s.templates.map((t) => `${t.key}:${t.channel}`).join("  ")}
          </p>
        </Panel>

        {isDemo() && (
          <Panel title="Demo environment">
            <form action={resetDemoAction} className="flex items-center justify-between gap-4">
              <p className="text-body-sm text-bone-400">
                Restore the fictional fixtures to their original state.
              </p>
              <Button type="submit" size="sm" variant="danger">
                Reset demo data
              </Button>
            </form>
          </Panel>
        )}
      </div>
    </CommandPage>
  );
}
