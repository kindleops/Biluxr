"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Modal and Sheet are built on the native <dialog> element: focus is trapped,
 * Escape closes, the page behind is inert, and screen readers announce it
 * correctly — without a dependency.
 */
function useDialog(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      document.documentElement.style.overflow = "hidden";
    } else if (!open && dialog.open) {
      dialog.close();
    }
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const handleClose = () => {
      document.documentElement.style.overflow = "";
      onClose();
    };
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, [onClose]);
  return ref;
}

function CloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      onClick={onClose}
      className="inline-flex size-9 items-center justify-center rounded-full text-bone-400 transition-colors duration-quick hover:bg-white/5 hover:text-bone-100"
      aria-label="Close"
    >
      <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
        <path d="M3 3l10 10M13 3L3 13" />
      </svg>
    </button>
  );
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const ref = useDialog(open, onClose);
  return (
    <dialog
      ref={ref}
      aria-label={title}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className={cn(
        "m-auto w-[min(34rem,calc(100vw-2rem))] max-h-[min(44rem,calc(100dvh-2rem))] overflow-hidden rounded-xl bg-ink-850 p-0 text-bone-100 shadow-[inset_0_0_0_1px_var(--line),var(--shadow-float)]",
        "backdrop:bg-ink-950/70 backdrop:backdrop-blur-[6px] open:animate-sheet",
        className,
      )}
    >
      <div className="flex max-h-[inherit] flex-col">
        <header className="flex items-start justify-between gap-4 px-6 pt-6 pb-2">
          <div>
            <h2 className="font-display text-title font-light">{title}</h2>
            {description && <p className="mt-1.5 text-body-sm text-bone-400">{description}</p>}
          </div>
          <CloseButton onClose={onClose} />
        </header>
        <div className="overflow-y-auto overscroll-contain px-6 pt-2 pb-6">{children}</div>
      </div>
    </dialog>
  );
}

export function Sheet({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  const ref = useDialog(open, onClose);
  return (
    <dialog
      ref={ref}
      aria-label={title}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className={cn(
        "m-0 mt-auto h-auto max-h-[92dvh] w-full max-w-none overflow-hidden rounded-t-sheet bg-ink-850 p-0 text-bone-100 shadow-[inset_0_1px_0_0_var(--line),var(--shadow-float)]",
        "sm:mr-0 sm:ml-auto sm:mt-0 sm:h-dvh sm:max-h-dvh sm:w-[30rem] sm:rounded-none sm:rounded-l-sheet",
        "backdrop:bg-ink-950/60 backdrop:backdrop-blur-[4px] open:animate-sheet",
        className,
      )}
    >
      <div className="flex max-h-[inherit] flex-col pb-safe sm:h-full">
        <div className="mx-auto mt-2.5 h-1 w-9 rounded-full bg-white/15 sm:hidden" aria-hidden />
        <header className="flex items-center justify-between gap-4 px-6 pt-4 pb-3 sm:pt-6">
          <h2 className="font-display text-title font-light">{title}</h2>
          <CloseButton onClose={onClose} />
        </header>
        <div className="flex-1 overflow-y-auto overscroll-contain px-6 pb-8">{children}</div>
      </div>
    </dialog>
  );
}
