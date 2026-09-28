import type { ReactNode } from "react";

export function MemberPageHeader({ eyebrow, title, children }: { eyebrow?: ReactNode; title: ReactNode; children?: ReactNode }) {
  return (
    <header className="flex flex-col gap-6 pt-8 pb-8 sm:flex-row sm:items-end sm:justify-between lg:pt-14 lg:pb-10">
      <div className="min-w-0">
        {eyebrow && <p className="text-label text-bone-500">{eyebrow}</p>}
        <h1 className="mt-3 font-display text-headline font-light text-bone-50 text-balance">{title}</h1>
      </div>
      {children && <div className="flex shrink-0 items-center gap-3">{children}</div>}
    </header>
  );
}

export function MemberContainer({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return <div className={`mx-auto w-full px-5 sm:px-8 lg:px-12 ${wide ? "max-w-6xl" : "max-w-4xl"}`}>{children}</div>;
}

export function SectionHeading({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-baseline justify-between gap-4">
      <h2 className="text-label text-bone-400">{children}</h2>
      {action}
    </div>
  );
}
