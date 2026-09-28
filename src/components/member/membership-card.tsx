import { BiluxrMark, BiluxrWordmark } from "@/components/brand/logo";
import { cn } from "@/lib/cn";
import type { Membership } from "@/lib/domain/types";
import { formatDateLong } from "@/lib/format";

/**
 * The membership credential, rendered at card proportions (ISO/IEC 7810 ID-1).
 * It is a visual identity, not a payment card: no numbers other than the
 * member number, no chip, no network marks.
 */
export function MembershipCard({
  name,
  membership,
  tierName,
  className,
}: {
  name: string;
  membership: Membership;
  tierName: string | null;
  className?: string;
}) {
  const active = membership.status === "active";
  return (
    <figure
      aria-label={`Biluxr membership credential for ${name}`}
      className={cn(
        "grain relative aspect-[1.586] w-full max-w-md overflow-hidden rounded-[22px] bg-[linear-gradient(145deg,#1d1d22_0%,#0d0d10_55%,#121215_100%)] p-6 text-bone-100 shadow-[inset_0_1px_0_0_rgb(255_255_255/0.08),inset_0_0_0_1px_rgb(255_255_255/0.06),0_40px_80px_-40px_rgb(0_0_0/0.9)] sm:p-7",
        className,
      )}
    >
      <svg
        aria-hidden
        viewBox="0 0 400 252"
        className="pointer-events-none absolute inset-0 size-full"
        preserveAspectRatio="xMidYMid slice"
      >
        <circle cx="340" cy="40" r="170" fill="none" stroke="rgb(243 239 232 / 0.07)" />
        <circle cx="340" cy="40" r="120" fill="none" stroke="rgb(243 239 232 / 0.05)" />
        <circle cx="340" cy="40" r="70" fill="none" stroke="rgb(243 239 232 / 0.035)" />
      </svg>
      <div className="relative z-[2] flex h-full flex-col justify-between">
        <div className="flex items-start justify-between">
          <BiluxrWordmark weight="hairline" className="h-3" />
          <BiluxrMark decorative className="size-8 text-bone-300" />
        </div>
        <div>
          <p className="font-display text-[1.6rem] leading-tight font-light tracking-[-0.01em]">
            {name}
          </p>
          <div className="mt-3 flex items-end justify-between gap-4 text-[0.6875rem] tracking-[0.16em] text-bone-400 uppercase">
            <span>
              {membership.isFounding ? "Founding member" : (tierName ?? "Member")}
              {active && membership.startedAt
                ? ` · Since ${new Date(membership.startedAt).getFullYear()}`
                : ""}
            </span>
            <span className="font-mono tracking-[0.2em] text-bone-200">
              № {membership.memberNumber}
            </span>
          </div>
        </div>
      </div>
      {!active && (
        <figcaption className="absolute inset-x-0 bottom-0 z-[3] bg-ink-950/80 px-6 py-2 text-center text-caption text-bone-300 backdrop-blur">
          {membership.status === "pending_activation"
            ? "Awaiting activation"
            : `Membership ${membership.status.replace("_", " ")}`}
        </figcaption>
      )}
    </figure>
  );
}

export function membershipStatusLine(m: Membership): string {
  switch (m.status) {
    case "active":
      return m.renewsAt ? `Active · renews ${formatDateLong(m.renewsAt)}` : "Active";
    case "pending_activation":
      return "Awaiting activation — your concierge will be in touch";
    case "paused":
      return "Paused";
    case "lapsed":
      return "Lapsed";
    case "cancelled":
      return "Cancelled";
  }
}
