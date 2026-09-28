"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BiluxrLogo } from "@/components/brand/logo";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/membership", label: "Membership" },
  { href: "/concierge", label: "Concierge" },
  { href: "/partners", label: "Partners" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const tone = pathname === "/contact" || pathname.startsWith("/legal") ? "paper" : "dark";
  const solid = pathname === "/apply";
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile menu on navigation (adjusting state during render).
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const paper = tone === "paper" && !scrolled && !open;

  return (
    <header
      className={cn(
        "z-nav duration-base sticky top-0 transition-[background-color,box-shadow,color] ease-considered",
        solid
          ? "bg-ink-950 [box-shadow:inset_0_-1px_0_0_var(--line-subtle)]"
          : scrolled && !open
            ? "glass rounded-none [box-shadow:inset_0_-1px_0_0_var(--line-subtle)]"
            : "bg-transparent",
        paper ? "text-ink-900" : "text-bone-100",
      )}
    >
      <div className="page-gutter content-max flex h-(--nav-height) items-center justify-between">
        <Link href="/" aria-label="Biluxr, home" className="-m-2 p-2">
          <BiluxrLogo />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-9 md:flex">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "duration-quick relative text-body-sm tracking-[0.01em] transition-opacity hover:opacity-100",
                  active ? "opacity-100" : "opacity-65",
                  "after:duration-base after:absolute after:-bottom-1.5 after:left-0 after:h-px after:w-full after:origin-left after:bg-current after:transition-transform",
                  active ? "after:scale-x-100" : "after:scale-x-0 hover:after:scale-x-100",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-6 md:flex">
          <Link
            href="/login"
            className="text-body-sm opacity-65 transition-opacity hover:opacity-100"
          >
            Sign in
          </Link>
          <Link
            href="/apply"
            className={cn(
              "duration-quick inline-flex h-9 items-center rounded-sm px-4 text-body-sm font-medium transition-colors",
              paper
                ? "bg-ink-900 text-paper-50 hover:bg-ink-800"
                : "shadow-[inset_0_0_0_1px_var(--line-strong)] hover:bg-white/[0.06]",
            )}
          >
            Apply
          </Link>
        </div>

        <button
          type="button"
          className="-mr-2 inline-flex size-11 items-center justify-center md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="relative block h-3 w-5" aria-hidden>
            <span
              className={cn(
                "duration-base absolute left-0 h-px w-5 bg-current transition-transform ease-settle",
                open ? "top-1.5 rotate-45" : "top-0",
              )}
            />
            <span
              className={cn(
                "duration-base absolute left-0 h-px w-5 bg-current transition-transform ease-settle",
                open ? "top-1.5 -rotate-45" : "top-3",
              )}
            />
          </span>
        </button>
      </div>

      <div
        id="mobile-menu"
        hidden={!open}
        className="z-overlay fixed inset-x-0 top-(--nav-height) bottom-0 bg-ink-950 text-bone-100 md:hidden"
      >
        <nav
          aria-label="Mobile"
          className="page-gutter flex h-full flex-col justify-between pt-8 pb-[max(2rem,var(--safe-bottom))]"
        >
          <ul className="grid gap-1">
            {[...NAV, { href: "/apply", label: "Apply" }].map((item, i) => (
              <li key={item.href} className="reveal" style={{ animationDelay: `${60 + i * 50}ms` }}>
                <Link
                  href={item.href}
                  className="block border-b border-white/[0.07] py-4 font-display text-[2rem] leading-tight font-light tracking-[-0.02em]"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between text-body-sm text-bone-400">
            <Link href="/login" className="text-bone-100">
              Member sign in
            </Link>
            <span>Private membership</span>
          </div>
        </nav>
      </div>
    </header>
  );
}
