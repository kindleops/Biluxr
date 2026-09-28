import type { ReactNode } from "react";

export function CommandPage({
  title,
  eyebrow,
  actions,
  children,
}: {
  title: ReactNode;
  eyebrow?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="px-4 pt-6 pb-16 sm:px-8 lg:pt-10">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          {eyebrow && <p className="text-label text-bone-500">{eyebrow}</p>}
          <h1 className="mt-2 font-display text-[1.9rem] leading-tight font-light text-bone-50">
            {title}
          </h1>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </header>
      {children}
    </div>
  );
}

export function Panel({
  title,
  action,
  children,
  className = "",
}: {
  title?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-lg bg-ink-900 shadow-[inset_0_0_0_1px_var(--line-subtle)] ${className}`}
    >
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 border-b border-white/[0.05] px-4 py-3">
          {title && <h2 className="text-label text-bone-400">{title}</h2>}
          {action}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

export function KeyValue({ items }: { items: [string, ReactNode][] }) {
  return (
    <dl className="grid gap-2.5 text-body-sm">
      {items.map(([k, v]) => (
        <div key={k} className="grid grid-cols-[7.5rem_1fr] gap-3">
          <dt className="text-bone-500">{k}</dt>
          <dd className="min-w-0 text-bone-200">{v ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}
