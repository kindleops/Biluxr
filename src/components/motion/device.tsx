import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** A phone silhouette for product showcases. Content is real UI, scaled. */
export function PhoneFrame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "relative aspect-[9/19.5] w-[19rem] rounded-[3.1rem] bg-[linear-gradient(145deg,#2a2a30,#0c0c0f_40%,#1a1a1f)] p-[0.6rem] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08),inset_0_1px_0_0_rgb(255_255_255/0.12),0_60px_120px_-40px_rgb(0_0_0/0.9),0_30px_60px_-30px_rgb(0_0_0/0.8)]",
        className,
      )}
    >
      <div className="relative h-full w-full overflow-hidden rounded-[2.55rem] bg-ink-950">
        <div
          aria-hidden
          className="absolute top-2.5 left-1/2 z-10 h-[1.6rem] w-[6.2rem] -translate-x-1/2 rounded-full bg-black"
        />
        {children}
      </div>
    </div>
  );
}

/** A laptop screen silhouette (no base) for Command showcases. */
export function ScreenFrame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "relative rounded-[1.1rem] bg-[linear-gradient(160deg,#2a2a30,#0d0d10_50%)] p-2 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08),inset_0_1px_0_0_rgb(255_255_255/0.1),0_80px_140px_-50px_rgb(0_0_0/0.95)]",
        className,
      )}
    >
      <div className="overflow-hidden rounded-[0.7rem] bg-ink-950 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.04)]">
        {children}
      </div>
    </div>
  );
}
