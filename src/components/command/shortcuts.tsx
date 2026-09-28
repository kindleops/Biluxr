"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

const JUMPS: Record<string, string> = {
  q: "/command",
  m: "/command/members",
  a: "/command/applications",
  p: "/command/providers",
  c: "/command/cohort",
  n: "/command/analytics",
  s: "/command/settings",
};

function typing(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  return (
    el.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName) ||
    Boolean(el.closest("dialog[open]"))
  );
}

/**
 * Linear-style keyboard navigation for Command:
 *   g then q/m/a/p/c/n/s — jump to a section
 *   j / k — move through queue rows; Enter opens
 */
export function CommandShortcuts() {
  const router = useRouter();
  useEffect(() => {
    let pendingG = 0;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || typing(e.target)) return;
      const key = e.key.toLowerCase();
      if (key === "g") {
        pendingG = Date.now();
        return;
      }
      if (pendingG && Date.now() - pendingG < 1200 && JUMPS[key]) {
        e.preventDefault();
        pendingG = 0;
        router.push(JUMPS[key]);
        return;
      }
      pendingG = 0;
      if (key === "j" || key === "k") {
        const rows = Array.from(document.querySelectorAll<HTMLAnchorElement>("[data-nav-row]"));
        if (rows.length === 0) return;
        e.preventDefault();
        const current = rows.findIndex((r) => r === document.activeElement);
        const next =
          current === -1
            ? 0
            : Math.min(Math.max(current + (key === "j" ? 1 : -1), 0), rows.length - 1);
        rows[next]?.focus();
        rows[next]?.scrollIntoView({ block: "nearest" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);
  return null;
}
