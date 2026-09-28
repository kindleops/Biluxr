"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BiluxrMark, BiluxrWordmark } from "@/components/brand/logo";
import { ConciergeAvatar } from "@/components/ui/avatar";
import { cn } from "@/lib/cn";

interface Item {
  href: string;
  label: string;
  badge?: number;
  adminOnly?: boolean;
}

export function CommandNav({
  name,
  initials,
  role,
  counts,
}: {
  name: string;
  initials: string;
  role: "concierge" | "admin";
  counts: { queue: number; applications: number };
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const items: Item[] = [
    { href: "/command", label: "Queue", badge: counts.queue },
    { href: "/command/members", label: "Members" },
    { href: "/command/applications", label: "Applications", badge: counts.applications },
    { href: "/command/providers", label: "Providers" },
    { href: "/command/cohort", label: "Founding cohort" },
    { href: "/command/analytics", label: "Analytics" },
    { href: "/command/settings", label: "Configuration", adminOnly: true },
  ];
  const visible = items.filter((i) => !i.adminOnly || role === "admin");
  const active = (href: string) =>
    href === "/command"
      ? pathname === "/command" || pathname.startsWith("/command/requests")
      : pathname.startsWith(href);

  const list = (
    <ul className="grid gap-0.5">
      {visible.map((item) => (
        <li key={item.href}>
          <Link
            href={item.href}
            onClick={() => setOpen(false)}
            aria-current={active(item.href) ? "page" : undefined}
            className={cn(
              "duration-quick flex items-center justify-between rounded-sm px-3 py-2 text-body-sm transition-colors",
              active(item.href)
                ? "bg-white/[0.07] text-bone-50"
                : "text-bone-400 hover:bg-white/[0.03] hover:text-bone-100",
            )}
          >
            {item.label}
            {item.badge ? (
              <span className="font-mono text-caption text-bone-400 tabular-nums">
                {item.badge}
              </span>
            ) : null}
          </Link>
        </li>
      ))}
    </ul>
  );

  return (
    <>
      <aside className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col justify-between border-r border-white/[0.06] bg-ink-950 px-3 py-5 lg:flex">
        <div>
          <Link
            href="/command"
            className="flex items-center gap-2.5 px-3 py-1 text-bone-100"
            aria-label="Biluxr Command"
          >
            <BiluxrMark decorative className="size-6" />
            <span className="flex flex-col gap-1">
              <BiluxrWordmark className="h-[0.55rem]" weight="regular" />
              <span className="text-[0.5625rem] tracking-[0.3em] text-bone-500 uppercase">
                Command
              </span>
            </span>
          </Link>
          <nav aria-label="Command" className="mt-8">
            {list}
          </nav>
        </div>
        <div className="flex items-center gap-3 px-3">
          <ConciergeAvatar initials={initials} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-body-sm text-bone-200">{name}</p>
            <form action="/auth/signout" method="post">
              <button className="text-caption text-bone-500 hover:text-bone-200" type="submit">
                {role === "admin" ? "Administrator" : "Concierge"} · Sign out
              </button>
            </form>
          </div>
        </div>
      </aside>

      <header className="z-sticky sticky top-0 flex h-14 items-center justify-between border-b border-white/[0.06] bg-ink-950/90 px-4 backdrop-blur-md lg:hidden">
        <Link
          href="/command"
          className="flex items-center gap-2 text-bone-100"
          aria-label="Biluxr Command"
        >
          <BiluxrMark decorative className="size-6" />
          <span className="text-[0.625rem] tracking-[0.3em] text-bone-400 uppercase">Command</span>
        </Link>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="command-mobile-nav"
          className="rounded-sm px-3 py-1.5 text-caption text-bone-300 shadow-[inset_0_0_0_1px_var(--line)]"
        >
          {open ? "Close" : "Menu"}
        </button>
      </header>
      {open && (
        <nav
          id="command-mobile-nav"
          aria-label="Command"
          className="z-overlay fixed inset-x-0 top-14 border-b border-white/[0.06] bg-ink-950 p-3 lg:hidden"
        >
          {list}
        </nav>
      )}
    </>
  );
}
