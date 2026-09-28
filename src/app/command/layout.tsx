import type { Metadata } from "next";
import { CommandNav } from "@/components/command/nav";
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
  const [staff, queue, applications] = await Promise.all([repo.listStaff(), repo.queue({ status: "open" }), repo.listApplications()]);
  const me = staff.find((s) => s.id === identity.userId);
  const awaitingResponse = queue.filter((r) => !r.firstRespondedAt || r.status === "received").length;
  const pendingApps = applications.filter((a) => ["submitted", "in_review", "conversation"].includes(a.status)).length;

  return (
    <div data-density="compact" className="flex min-h-dvh bg-ink-950 lg:flex-row">
      <CommandNav
        name={me?.name ?? "Staff"}
        initials={me?.initials ?? initials(me?.name ?? "S")}
        role={identity.role === "admin" ? "admin" : "concierge"}
        counts={{ queue: awaitingResponse, applications: pendingApps }}
      />
      <main id="main" className="min-w-0 flex-1">
        {children}
      </main>
    </div>
  );
}
