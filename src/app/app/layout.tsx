import type { Metadata } from "next";
import { MemberRail, MemberTopBar, MobileNav } from "@/components/member/nav";
import { CommandPalette, type PaletteItem } from "@/components/ui/command-palette";
import { requireMember } from "@/lib/auth/session";
import { memberRepository } from "@/lib/data";
import { REQUEST_STATUS_PRESENTATION } from "@/lib/domain/requests";
import { formatDateRange } from "@/lib/format";

export const metadata: Metadata = {
  title: { default: "Biluxr", template: "%s · Biluxr" },
  robots: { index: false, follow: false },
};

export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  const identity = await requireMember();
  const repo = await memberRepository(identity);
  const [{ profile }, requests, journeys] = await Promise.all([
    repo.profile(),
    repo.listRequests(),
    repo.listJourneys(),
  ]);

  const palette: PaletteItem[] = [
    {
      id: "new",
      label: "New request",
      href: "/app/concierge#brief",
      group: "Actions",
      hint: "Write to your concierge",
    },
    { id: "pref", label: "Add a preference", href: "/app/profile#preferences", group: "Actions" },
    ...[
      ["Home", "/app"],
      ["Concierge", "/app/concierge"],
      ["Journeys", "/app/journeys"],
      ["Access", "/app/access"],
      ["Membership", "/app/membership"],
      ["Profile", "/app/profile"],
    ].map(([label, href]) => ({ id: `nav-${href}`, label: label!, href: href!, group: "Go to" })),
    ...requests.map((r) => ({
      id: `req-${r.id}`,
      label: r.title,
      href: `/app/concierge/${r.id}`,
      group: "Requests",
      hint: REQUEST_STATUS_PRESENTATION[r.status].member,
      keywords: `${r.reference} ${r.brief}`,
    })),
    ...journeys.map((j) => ({
      id: `jny-${j.id}`,
      label: j.title,
      href: `/app/journeys/${j.id}`,
      group: "Journeys",
      hint: formatDateRange(j.startsOn, j.endsOn),
    })),
  ];

  return (
    <div className="flex min-h-dvh bg-ink-950">
      <MemberRail
        name={profile.preferredName ?? profile.fullName}
        initials={profile.avatarInitials}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <MemberTopBar />
        <main
          id="main"
          className="flex-1 overflow-x-clip pb-[calc(var(--mobile-nav-height)+var(--safe-bottom)+1.5rem)] lg:pb-16"
        >
          {children}
        </main>
      </div>
      <MobileNav />
      <CommandPalette items={palette} placeholder="Search requests, journeys, or jump to…" />
    </div>
  );
}
