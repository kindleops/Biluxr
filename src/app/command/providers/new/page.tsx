import Link from "next/link";
import { CommandPage } from "@/components/command/page";
import { ProviderForm } from "@/components/command/provider-form";
import { requireStaff } from "@/lib/auth/session";
import { publicRepository } from "@/lib/data";

export const metadata = { title: "New provider" };

export default async function NewProviderPage() {
  await requireStaff();
  const pub = await publicRepository();
  const [markets, categories] = pub ? await Promise.all([pub.listMarkets(), pub.listCategories()]) : [[], []];
  return (
    <CommandPage
      eyebrow={
        <Link href="/command/providers" className="hover:text-bone-200">
          ← Providers
        </Link>
      }
      title="Add a provider"
    >
      <ProviderForm markets={markets} categories={categories} />
    </CommandPage>
  );
}
