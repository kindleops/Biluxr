import type { Metadata } from "next";
import { CommandNav } from "@/components/command/nav";
import { CommandShortcuts } from "@/components/command/shortcuts";
import { CommandPalette, type PaletteItem } from "@/components/ui/command-palette";
import { requireStaff } from "@/lib/auth/session";
import { staffRepository } from "@/lib/data";
import { initials } from "@/lib/format";

export const metadata: Metadata = {
  title: { default: "Command", template: "%s · Command" },
  robots: { index: false, follow: false },
};

export default async function CommandLayout({ children }: { children: React.ReactNode }) {
  const identity = await requireStaff();
  const repo = await staffRepository(identity);
  const [staff, queue, applications, members, providers] = await Promise.all([
    repo.listStaff(),
    repo.queue({ status: "open" }),
    repo.listApplications(),
    repo.listMembers(),
    repo.listProviders(),
  ]);
  const admin = identity.role === "admin";
  const nav: [string, string, string][] = [
    ["Queue", "/command", "G Q"],
    ["Members", "/command/members", "G M"],
    ["Applications", "/command/applications", "G A"],
    ["Providers", "/command/providers", "G P"],
    ["Founding cohort", "/command/cohort", "G C"],
    ["Analytics", "/command/analytics", "G N"],
  ];
  if (admin) nav.push(["Configuration", "/command/settings", "G S"]);
  const palette: PaletteItem[] = [
    ...nav.map(([label, href, shortcut]) => ({
      id: `nav-${href}`,
      label,
      href,
      group: "Go to",
      shortcut,
    })),
    {
      id: "act-provider",
      label: "Add a provider",
      href: "/command/providers/new",
      group: "Actions",
    },
    {
      id: "act-unassigned",
      label: "View unassigned requests",
      href: "/command?view=unassigned",
      group: "Actions",
    },
    {
      id: "act-urgent",
      label: "View urgent requests",
      href: "/command?view=urgent",
      group: "Actions",
    },
    ...queue.map((r) => ({
      id: `req-${r.id}`,
      label: r.title,
      href: `/command/requests/${r.id}`,
      group: "Open requests",
      hint: `${r.reference} · ${r.member.name}`,
      keywords: `${r.reference} ${r.member.name} ${r.brief}`,
    })),
    ...members.map((m) => ({
      id: `mem-${m.profile.id}`,
      label: m.profile.fullName,
      href: `/command/members/${m.profile.id}`,
      group: "Members",
      hint: m.membership ? `№ ${m.membership.memberNumber}` : undefined,
      keywords: `${m.profile.email} ${m.profile.preferredName ?? ""}`,
    })),
    ...applications
      .filter((a) => ["submitted", "in_review", "conversation"].includes(a.status))
      .map((a) => ({
        id: `app-${a.id}`,
        label: a.fullName,
        href: `/command/applications/${a.id}`,
        group: "Applications",
        hint: a.city,
      })),
    ...providers.map((p) => ({
      id: `prov-${p.id}`,
      label: p.name,
      href: `/command/providers/${p.id}`,
      group: "Providers",
      hint: p.status,
    })),
  ];
  const me = staff.find((s) => s.id === identity.userId);
  const awaitingResponse = queue.filter(
    (r) => !r.firstRespondedAt || r.status === "received",
  ).length;
  const pendingApps = applications.filter((a) =>
    ["submitted", "in_review", "conversation"].includes(a.status),
  ).length;

  return (
    <div data-density="compact" className="flex min-h-dvh flex-col bg-ink-950 lg:flex-row">
      <CommandNav
        name={me?.name ?? "Staff"}
        initials={me?.initials ?? initials(me?.name ?? "S")}
        role={identity.role === "admin" ? "admin" : "concierge"}
        counts={{ queue: awaitingResponse, applications: pendingApps }}
      />
      <main id="main" className="min-w-0 flex-1">
        {children}
      </main>
      <CommandPalette items={palette} placeholder="Search requests, members, providers…" />
      <CommandShortcuts />
    </div>
  );
}
