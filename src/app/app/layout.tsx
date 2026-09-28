import type { Metadata } from "next";
import { MemberRail, MemberTopBar, MobileNav } from "@/components/member/nav";
import { requireMember } from "@/lib/auth/session";
import { memberRepository } from "@/lib/data";

export const metadata: Metadata = {
  title: { default: "Biluxr", template: "%s · Biluxr" },
  robots: { index: false, follow: false },
};

export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  const identity = await requireMember();
  const repo = await memberRepository(identity);
  const { profile } = await repo.profile();
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
          className="flex-1 pb-[calc(var(--mobile-nav-height)+var(--safe-bottom)+1.5rem)] lg:pb-16"
        >
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
