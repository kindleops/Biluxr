"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";

export interface PaletteItem {
  id: string;
  label: string;
  href: string;
  group: string;
  hint?: string;
  keywords?: string;
  shortcut?: string;
}

/** Subsequence match with a bonus for word starts; returns -1 when no match. */
export function score(query: string, text: string): number {
  const q = query.toLowerCase().trim();
  if (!q) return 0;
  const t = text.toLowerCase();
  const direct = t.indexOf(q);
  if (direct !== -1) return 1000 - direct * 2 - (direct === 0 || t[direct - 1] === " " ? 0 : 50);
  let ti = 0;
  let s = 0;
  for (const ch of q) {
    const found = t.indexOf(ch, ti);
    if (found === -1) return -1;
    s += found === ti ? 6 : 1;
    if (found === 0 || t[found - 1] === " ") s += 4;
    ti = found + 1;
  }
  return s;
}

/**
 * ⌘K / Ctrl+K palette: jump anywhere, act on anything. A combobox with an
 * active-descendant listbox, so it is fully operable by keyboard and screen
 * reader. Built on the native <dialog> for focus containment.
 */
export function CommandPalette({
  items,
  placeholder = "Search or jump to…",
}: {
  items: PaletteItem[];
  placeholder?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const results = useMemo(() => {
    if (!query.trim()) return items.slice(0, 40);
    return items
      .map((item) => ({
        item,
        s: Math.max(
          score(query, item.label),
          score(query, `${item.keywords ?? ""} ${item.hint ?? ""}`) - 200,
        ),
      }))
      .filter((r) => r.s >= 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 40)
      .map((r) => r.item);
  }, [items, query]);

  const show = useCallback(() => {
    setQuery("");
    setActive(0);
    setOpen(true);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (open) setOpen(false);
        else show();
      }
    };
    const onOpen = () => show();
    window.addEventListener("keydown", onKey);
    window.addEventListener("biluxr:palette", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("biluxr:palette", onOpen);
    };
  }, [open, show]);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      inputRef.current?.focus();
    } else if (!open && d.open) d.close();
  }, [open]);

  function go(item: PaletteItem | undefined) {
    if (!item) return;
    setOpen(false);
    router.push(item.href);
  }

  // Group results in their first-seen order.
  const groups: { name: string; items: { item: PaletteItem; index: number }[] }[] = [];
  results.forEach((item, index) => {
    let g = groups.find((x) => x.name === item.group);
    if (!g) groups.push((g = { name: item.group, items: [] }));
    g.items.push({ item, index });
  });

  return (
    <dialog
      ref={dialogRef}
      aria-label="Command palette"
      onClose={() => setOpen(false)}
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
      className="mx-auto mt-[12vh] w-[min(40rem,calc(100vw-2rem))] overflow-hidden rounded-xl bg-ink-850/95 p-0 text-bone-100 shadow-[inset_0_0_0_1px_var(--line),inset_0_1px_0_0_var(--glass-highlight),0_50px_120px_-30px_rgb(0_0_0/0.9)] backdrop-blur-xl backdrop:bg-ink-950/60 backdrop:backdrop-blur-[3px] open:animate-sheet"
    >
      <div className="flex items-center gap-3 border-b border-white/[0.06] px-5">
        <svg
          aria-hidden
          viewBox="0 0 20 20"
          className="size-4 shrink-0 text-bone-500"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
        >
          <circle cx="9" cy="9" r="5.5" />
          <path d="m13.2 13.2 3.3 3.3" />
        </svg>
        <input
          ref={inputRef}
          role="combobox"
          aria-expanded="true"
          aria-controls={listId}
          aria-activedescendant={results[active] ? `${listId}-${active}` : undefined}
          aria-autocomplete="list"
          aria-label="Search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(a + 1, results.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === "Enter") {
              e.preventDefault();
              go(results[active]);
            }
          }}
          placeholder={placeholder}
          className="h-14 flex-1 bg-transparent text-body text-bone-50 outline-none placeholder:text-bone-500"
        />
        <kbd className="rounded-xs px-1.5 py-0.5 font-mono text-[0.625rem] text-bone-500 shadow-[inset_0_0_0_1px_var(--line)]">
          esc
        </kbd>
      </div>
      <div
        id={listId}
        role="listbox"
        aria-label="Results"
        className="max-h-[min(26rem,60vh)] overflow-y-auto overscroll-contain p-2"
      >
        {results.length === 0 && (
          <p className="px-3 py-8 text-center text-body-sm text-bone-500">
            Nothing matches “{query}”.
          </p>
        )}
        {groups.map((g) => (
          <div key={g.name} role="group" aria-label={g.name} className="pb-1">
            <p className="px-3 pt-3 pb-1.5 text-[0.625rem] font-medium tracking-[0.16em] text-bone-500 uppercase">
              {g.name}
            </p>
            {g.items.map(({ item, index }) => (
              <div
                key={item.id}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={index === active}
                onMouseMove={() => setActive(index)}
                onClick={() => go(item)}
                className={cn(
                  "duration-instant flex cursor-pointer items-center justify-between gap-4 rounded-md px-3 py-2.5 text-body-sm transition-colors",
                  index === active ? "bg-white/[0.07] text-bone-50" : "text-bone-300",
                )}
              >
                <span className="min-w-0 truncate">{item.label}</span>
                <span className="flex shrink-0 items-center gap-3">
                  {item.hint && (
                    <span className="truncate text-caption text-bone-500">{item.hint}</span>
                  )}
                  {item.shortcut && (
                    <kbd className="rounded-xs px-1.5 py-0.5 font-mono text-[0.625rem] text-bone-500 shadow-[inset_0_0_0_1px_var(--line)]">
                      {item.shortcut}
                    </kbd>
                  )}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between border-t border-white/[0.06] px-5 py-2.5 text-caption text-bone-500">
        <span>
          <kbd className="font-mono">↑↓</kbd> to move · <kbd className="font-mono">↵</kbd> to open
        </span>
        <span className="font-mono">⌘K</span>
      </div>
    </dialog>
  );
}

/** A visible trigger for people who don't know the shortcut. */
export function PaletteTrigger({
  className,
  label = "Search or jump to…",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("biluxr:palette"))}
      className={cn(
        "group duration-quick flex h-9 items-center gap-3 rounded-md px-3 text-body-sm text-bone-500 shadow-[inset_0_0_0_1px_var(--line)] transition-[color,box-shadow] hover:text-bone-200 hover:shadow-[inset_0_0_0_1px_var(--line-strong)]",
        className,
      )}
    >
      <svg
        aria-hidden
        viewBox="0 0 20 20"
        className="size-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
      >
        <circle cx="9" cy="9" r="5.5" />
        <path d="m13.2 13.2 3.3 3.3" />
      </svg>
      <span className="flex-1 text-left">{label}</span>
      <kbd className="rounded-xs px-1.5 font-mono text-[0.625rem] shadow-[inset_0_0_0_1px_var(--line)]">
        ⌘K
      </kbd>
    </button>
  );
}
