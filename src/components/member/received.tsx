import { BiluxrOrb } from "@/components/motion/orb";

/**
 * The moment a request arrives: the orb releases a single ring and settles.
 * The text is the message; the orb is decoration.
 */
export function ReceivedMoment({ who }: { who: string | null }) {
  return (
    <div
      role="status"
      className="liquid-glass reveal flex items-center gap-4 overflow-hidden rounded-[22px] py-3 pr-5 pl-2"
    >
      <BiluxrOrb state="sent" announce className="-my-6 size-24 shrink-0" />
      <div>
        <p className="font-display text-title font-light text-bone-50">Received.</p>
        <p className="mt-0.5 text-body-sm text-bone-300">
          {who
            ? `${who} has it and will be in touch.`
            : "Your concierge has it and will be in touch."}
        </p>
      </div>
    </div>
  );
}
