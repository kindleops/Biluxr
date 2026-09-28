import Link from "next/link";
import { CommandPage, Panel } from "@/components/command/page";
import { StatusPill } from "@/components/ui/status";
import { requireStaff } from "@/lib/auth/session";
import { staffRepository } from "@/lib/data";
import { formatDateLong } from "@/lib/format";

export const metadata = { title: "Founding cohort" };

function Progress({ value, target, label }: { value: number; target: number; label: string }) {
  const pct = Math.min(100, Math.round((value / Math.max(1, target)) * 100));
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <p className="text-label text-bone-500">{label}</p>
        <p className="font-mono text-body-sm text-bone-200 tabular-nums">
          {value} / {target}
        </p>
      </div>
      <div className="mt-3 h-px bg-white/10" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={target} aria-label={label}>
        <div className="h-px bg-bone-200" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

const ONBOARDING_TONE = {
  not_started: "muted",
  welcome_call: "neutral",
  preferences: "active",
  first_request: "active",
  established: "positive",
} as const;

export default async function CohortPage() {
  const identity = await requireStaff();
  const repo = await staffRepository(identity);
  const cohort = await repo.cohort();
  return (
    <CommandPage eyebrow="Launch" title="Founding cohort">
      <p className="-mt-4 mb-8 max-w-2xl text-body-sm text-bone-400">
        Twenty-five extraordinary members and twenty-five extraordinary providers, curated by hand. Growth here is measured in
        relationships, not sign-ups.
      </p>
      <div className="grid gap-6 md:grid-cols-2">
        <Panel>
          <Progress value={cohort.members.length} target={cohort.target.members} label="Founding members" />
        </Panel>
        <Panel>
          <Progress value={cohort.providers.length} target={cohort.target.providers} label="Founding providers" />
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel title="Members">
          {cohort.members.length === 0 ? (
            <p className="text-body-sm text-bone-500">No founding members recorded yet.</p>
          ) : (
            <div className="-mx-4 overflow-x-auto">
              <table className="w-full min-w-[40rem] text-left text-body-sm">
                <thead className="text-caption text-bone-500">
                  <tr>
                    <th className="px-4 py-2 font-normal">Member</th>
                    <th className="px-4 py-2 font-normal">Onboarding</th>
                    <th className="px-4 py-2 font-normal">Prefs</th>
                    <th className="px-4 py-2 font-normal">First request</th>
                    <th className="px-4 py-2 font-normal">Sat.</th>
                    <th className="px-4 py-2 font-normal">Referral</th>
                  </tr>
                </thead>
                <tbody>
                  {cohort.members.map((m) => (
                    <tr key={m.id} className="border-t border-white/[0.05]">
                      <td className="px-4 py-2.5">
                        {m.memberId ? (
                          <Link href={`/command/members/${m.memberId}`} className="text-bone-100 hover:underline">
                            {m.displayName}
                          </Link>
                        ) : (
                          <span className="text-bone-100">{m.displayName}</span>
                        )}
                        <p className="text-caption text-bone-500">
                          {m.referralSource ?? "—"} · {m.owner?.name ?? "No owner"}
                        </p>
                      </td>
                      <td className="px-4 py-2.5">
                        <StatusPill tone={ONBOARDING_TONE[m.onboardingStatus]}>{m.onboardingStatus.replace("_", " ")}</StatusPill>
                      </td>
                      <td className="px-4 py-2.5 text-caption text-bone-300">{m.preferencesCompleted ? "Done" : "—"}</td>
                      <td className="px-4 py-2.5 text-caption text-bone-300">{m.firstRequestAt ? formatDateLong(m.firstRequestAt) : "—"}</td>
                      <td className="px-4 py-2.5 font-mono text-caption text-bone-300">{m.satisfaction ?? "—"}</td>
                      <td className="px-4 py-2.5 text-caption text-bone-300">{m.referralPotential ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel title="Providers">
          {cohort.providers.length === 0 ? (
            <p className="text-body-sm text-bone-500">No founding providers recorded yet.</p>
          ) : (
            <div className="-mx-4 overflow-x-auto">
              <table className="w-full min-w-[36rem] text-left text-body-sm">
                <thead className="text-caption text-bone-500">
                  <tr>
                    <th className="px-4 py-2 font-normal">Provider</th>
                    <th className="px-4 py-2 font-normal">Vetting</th>
                    <th className="px-4 py-2 font-normal">Terms</th>
                    <th className="px-4 py-2 font-normal">Test request</th>
                    <th className="px-4 py-2 font-normal">Preferred</th>
                  </tr>
                </thead>
                <tbody>
                  {cohort.providers.map((f) => (
                    <tr key={f.id} className="border-t border-white/[0.05]">
                      <td className="px-4 py-2.5">
                        <Link href={`/command/providers/${f.providerId}`} className="text-bone-100 hover:underline">
                          {f.provider.name}
                        </Link>
                        {f.performanceNote && <p className="text-caption text-bone-500">{f.performanceNote}</p>}
                      </td>
                      <td className="px-4 py-2.5 text-caption text-bone-300">{f.vettingStatus.replace("_", " ")}</td>
                      <td className="px-4 py-2.5 text-caption text-bone-300">{f.termsStatus.replace("_", " ")}</td>
                      <td className="px-4 py-2.5 text-caption text-bone-300">{f.testRequestStatus.replace("_", " ")}</td>
                      <td className="px-4 py-2.5 text-caption text-bone-300">{f.preferredStatus ? "Yes" : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    </CommandPage>
  );
}
