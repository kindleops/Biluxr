import Link from "next/link";
import { CommandPage } from "@/components/command/page";
import { LinkButton } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusPill } from "@/components/ui/status";
import { requireStaff } from "@/lib/auth/session";
import { publicRepository, staffRepository } from "@/lib/data";
import type { ProviderStatus } from "@/lib/domain/types";

export const metadata = { title: "Providers" };

const PROVIDER_TONE: Record<
  ProviderStatus,
  "neutral" | "attention" | "active" | "positive" | "muted" | "negative"
> = {
  prospect: "neutral",
  vetting: "active",
  approved: "positive",
  preferred: "positive",
  paused: "muted",
  removed: "negative",
};

export default async function ProvidersPage() {
  const identity = await requireStaff();
  const repo = await staffRepository(identity);
  const pub = await publicRepository();
  const [providers, markets, categories] = await Promise.all([
    repo.listProviders(),
    pub ? pub.listMarkets() : [],
    pub ? pub.listCategories() : [],
  ]);
  return (
    <CommandPage
      eyebrow="Biluxr Network"
      title="Providers"
      actions={
        <LinkButton href="/command/providers/new" size="sm" variant="secondary">
          Add provider
        </LinkButton>
      }
    >
      {providers.length === 0 ? (
        <div className="rounded-lg shadow-[inset_0_0_0_1px_var(--line-subtle)]">
          <EmptyState
            title="No providers yet."
            body="Add the hotels, restaurants, operators and specialists you trust. Vet them, test them, then prefer them."
          />
        </div>
      ) : (
        <ul className="grid gap-px overflow-hidden rounded-lg bg-white/[0.05]">
          {providers.map((p) => (
            <li
              key={p.id}
              className="relative grid gap-1 bg-ink-950 px-4 py-3.5 hover:bg-ink-900 sm:grid-cols-[1.4fr_1fr_1fr_1fr_5rem] sm:items-center sm:gap-4"
            >
              <Link
                href={`/command/providers/${p.id}`}
                className="text-body-sm text-bone-50 after:absolute after:inset-0"
              >
                {p.name}
                {p.isFounding && <span className="ml-2 text-caption text-sable-400">Founding</span>}
              </Link>
              <span className="text-caption text-bone-400">
                {categories.find((c) => c.slug === p.categorySlug)?.name ?? "—"}
              </span>
              <span className="text-caption text-bone-400">
                {markets.find((m) => m.id === p.marketId)?.name ?? "—"}
              </span>
              <StatusPill tone={PROVIDER_TONE[p.status]}>{p.status}</StatusPill>
              <span className="font-mono text-caption text-bone-500 sm:text-right">
                {p.performanceScore ?? "—"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </CommandPage>
  );
}
