import Link from "next/link";
import { notFound } from "next/navigation";
import { updateProviderStatusAction } from "@/app/command/actions";
import { CommandPage, KeyValue, Panel } from "@/components/command/page";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/field";
import { requireStaff } from "@/lib/auth/session";
import { publicRepository, staffRepository } from "@/lib/data";
import { NotFoundError } from "@/lib/data/repository";
import { PROVIDER_STATUSES } from "@/lib/domain/types";

export const metadata = { title: "Provider" };

export default async function ProviderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const identity = await requireStaff();
  const repo = await staffRepository(identity);
  const p = await repo.getProvider(id).catch((e) => {
    if (e instanceof NotFoundError) notFound();
    throw e;
  });
  const pub = await publicRepository();
  const [markets, categories] = pub
    ? await Promise.all([pub.listMarkets(), pub.listCategories()])
    : [[], []];
  return (
    <CommandPage
      eyebrow={
        <Link href="/command/providers" className="hover:text-bone-200">
          ← Providers
        </Link>
      }
      title={p.name}
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="grid content-start gap-6">
          <Panel title="Profile">
            <KeyValue
              items={[
                ["Category", categories.find((c) => c.slug === p.categorySlug)?.name],
                ["Market", markets.find((m) => m.id === p.marketId)?.name],
                ["Website", p.website],
                [
                  "Contact",
                  [p.contactName, p.contactEmail, p.contactPhone].filter(Boolean).join(" · ") ||
                    null,
                ],
                ["Terms", p.termsSummary],
                ["Test request", p.testRequestStatus.replace("_", " ")],
                [
                  "Performance",
                  p.performanceScore !== null ? `${p.performanceScore} / 100` : "Not yet scored",
                ],
                ["Founding", p.isFounding ? "Yes" : "No"],
              ]}
            />
          </Panel>
          {p.notes && (
            <Panel title="Notes">
              <p className="text-body-sm whitespace-pre-line text-bone-200">{p.notes}</p>
            </Panel>
          )}
        </div>
        <Panel title="Stage">
          <form action={updateProviderStatusAction} className="grid gap-3">
            <input type="hidden" name="providerId" value={p.id} />
            <label htmlFor="status" className="sr-only">
              Stage
            </label>
            <Select id="status" name="status" defaultValue={p.status} dense>
              {PROVIDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
            <Button type="submit" size="sm" variant="secondary">
              Update stage
            </Button>
            <p className="text-caption text-bone-500">
              Prospect → vetting → approved → preferred. Paused and removed providers are hidden
              from option building.
            </p>
          </form>
        </Panel>
      </div>
    </CommandPage>
  );
}
