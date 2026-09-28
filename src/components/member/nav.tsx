"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BiluxrLogo, BiluxrMark } from "@/components/brand/logo";
import { ConciergeAvatar } from "@/components/ui/avatar";
import { PaletteTrigger } from "@/components/ui/command-palette";
import { cn } from "@/lib/cn";

type IconName = "home" | "concierge" | "journeys" | "access" | "membership" | "profile";

const ITEMS: { href: string; label: string; icon: IconName; mobile: boolean }[] = [
  { href: "/app", label: "Home", icon: "home", mobile: true },
  { href: "/app/concierge", label: "Concierge", icon: "concierge", mobile: true },
  { href: "/app/journeys", label: "Journeys", icon: "journeys", mobile: true },
  { href: "/app/access", label: "Access", icon: "access", mobile: true },
  { href: "/app/membership", label: "Membership", icon: "membership", mobile: false },
  { href: "/app/profile", label: "Profile", icon: "profile", mobile: true },
];

function isActive(pathname: string, href: string) {
  return href === "/app" ? pathname === "/app" : pathname.startsWith(href);
}

export function NavIcon({ name, className }: { name: IconName; className?: string }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.25,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn("size-5", className)} {...common}>
      {name === "home" && (
        <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z" />
      )}
      {name === "concierge" && (
        <>
          <path d="M4 17.5V7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H8.5L4 19.5z" />
          <path d="M8.5 9.5h7M8.5 12.5h4.5" />
        </>
      )}
      {name === "journeys" && (
        <>
          <circle cx="6" cy="18" r="2" />
          <circle cx="18" cy="6" r="2" />
          <path d="M7.8 17.2C13 15.5 11 8.5 16.2 6.8" strokeDasharray="1.5 2.5" />
        </>
      )}
      {name === "access" && (
        <>
          <rect x="4" y="6" width="16" height="12" rx="1.5" />
          <path d="M4 10h16M8 14.5h3" />
        </>
      )}
      {name === "membership" && (
        <>
          <circle cx="12" cy="12" r="8" />
          <path d="M10 8v8M10 8h2.4a1.9 1.9 0 0 1 0 3.8H10M10 11.8h2.8a2.1 2.1 0 0 1 0 4.2H10" />
        </>
      )}
      {name === "profile" && (
        <>
          <circle cx="12" cy="9" r="3.5" />
          <path d="M5 20c1.2-3.3 3.8-5 7-5s5.8 1.7 7 5" />
        </>
      )}
    </svg>
  );
}

export function MemberRail({ name, initials }: { name: string; initials: string }) {
  const pathname = usePathname();
  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col justify-between border-r border-white/[0.06] bg-ink-950 px-5 py-6 lg:flex">
      <div>
        <Link href="/app" aria-label="Biluxr home" className="block px-3 py-2 text-bone-100">
          <BiluxrLogo />
        </Link>
        <PaletteTrigger className="mt-8 w-full" label="Search" />
        <nav aria-label="Member" className="mt-6">
          <ul className="grid gap-0.5">
            {ITEMS.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "duration-quick flex items-center gap-3.5 rounded-md px-3 py-2.5 text-body-sm transition-colors",
                      active
                        ? "bg-white/[0.06] text-bone-50"
                        : "text-bone-400 hover:bg-white/[0.03] hover:text-bone-100",
                    )}
                  >
                    <NavIcon
                      name={item.icon}
                      className={active ? "text-bone-100" : "text-bone-500"}
                    />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
      <div className="flex items-center gap-3 rounded-md px-3 py-2">
        <ConciergeAvatar initials={initials} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-body-sm text-bone-200">{name}</p>
          <form action="/auth/signout" method="post">
            <button type="submit" className="text-caption text-bone-500 hover:text-bone-200">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}

export function MemberTopBar() {
  return (
    <header className="z-sticky sticky top-0 flex h-14 items-center justify-between bg-ink-950/85 px-5 [box-shadow:inset_0_-1px_0_0_var(--line-subtle)] backdrop-blur-md lg:hidden">
      <Link href="/app" aria-label="Biluxr home" className="-m-2 p-2 text-bone-100">
        <BiluxrMark decorative className="size-7" />
      </Link>
      <div className="flex items-center gap-3">
        <Link href="/app/membership" className="text-caption text-bone-400 hover:text-bone-100">
          Membership
        </Link>
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event("biluxr:palette"))}
          className="-mr-2 inline-flex size-10 items-center justify-center rounded-full text-bone-300 hover:text-bone-50"
          aria-label="Search"
        >
          <svg
            aria-hidden
            viewBox="0 0 20 20"
            className="size-[1.1rem]"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
          >
            <circle cx="9" cy="9" r="5.5" />
            <path d="m13.2 13.2 3.3 3.3" />
          </svg>
        </button>
      </div>
    </header>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const items = ITEMS.filter((i) => i.mobile);
  return (
    <nav
      aria-label="Member"
      className="glass z-nav pb-safe fixed inset-x-0 bottom-0 rounded-none [box-shadow:inset_0_1px_0_0_var(--line)] lg:hidden"
    >
      <ul className="mx-auto grid h-(--mobile-nav-height) max-w-md grid-cols-5">
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "duration-quick flex h-full flex-col items-center justify-center gap-1 text-[0.625rem] tracking-[0.04em] transition-colors",
                  active ? "text-bone-50" : "text-bone-500 active:text-bone-200",
                )}
              >
                <NavIcon name={item.icon} className="size-[1.35rem]" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
