"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useActionResult } from "@/lib/forms/use-action-result";
import { postMessageAction } from "@/app/app/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { RequestMessage } from "@/lib/domain/types";
import { formatDateTime } from "@/lib/format";
import { IDLE } from "@/lib/forms/state";

export function MessageThread({
  messages,
  viewerId,
  timezone,
}: {
  messages: RequestMessage[];
  viewerId: string;
  timezone: string;
}) {
  return (
    <ol className="grid gap-5" aria-label="Conversation">
      {messages.map((m) => {
        const mine = m.authorId === viewerId;
        if (m.authorKind === "system") {
          return (
            <li key={m.id} className="flex items-center gap-3 text-caption text-bone-500">
              <span className="h-px flex-1 bg-white/[0.06]" />
              {m.body} · {formatDateTime(m.createdAt, timezone)}
              <span className="h-px flex-1 bg-white/[0.06]" />
            </li>
          );
        }
        return (
          <li key={m.id} className={cn("flex flex-col", mine ? "items-end" : "items-start")}>
            <p className="mb-1.5 text-caption text-bone-500">
              {mine ? "You" : m.authorName || "Your concierge"} ·{" "}
              <time dateTime={m.createdAt}>{formatDateTime(m.createdAt, timezone)}</time>
            </p>
            <p
              className={cn(
                "max-w-[34rem] rounded-lg px-4 py-3 text-body-sm whitespace-pre-line",
                mine
                  ? "rounded-tr-xs bg-ink-800 text-bone-100"
                  : "rounded-tl-xs bg-bone-100 text-ink-900",
              )}
            >
              {m.body}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

export function ReplyBox({ requestId, disabled }: { requestId: string; disabled?: boolean }) {
  const [state, action, pending] = useActionState(postMessageAction, IDLE);
  const [value, setValue] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const ref = useRef<HTMLTextAreaElement>(null);

  useActionResult(state, (s) => {
    if (s.status === "success") setValue("");
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);

  if (disabled) {
    return (
      <p className="rounded-card px-5 py-4 text-center text-body-sm text-bone-500 shadow-[inset_0_0_0_1px_var(--line-subtle)]">
        This request is closed. Start a new one and we will pick it up.
      </p>
    );
  }

  return (
    <form
      ref={formRef}
      action={action}
      className="flex items-end gap-3 rounded-xl bg-ink-850 p-2.5 pl-4 shadow-[inset_0_1px_0_0_var(--glass-highlight),inset_0_0_0_1px_var(--line),var(--shadow-lift)] focus-within:shadow-[inset_0_1px_0_0_var(--glass-highlight),inset_0_0_0_1px_var(--line-strong),var(--shadow-lift)]"
    >
      <input type="hidden" name="requestId" value={requestId} />
      <label htmlFor="reply" className="sr-only">
        Reply
      </label>
      <textarea
        ref={ref}
        id="reply"
        name="body"
        rows={1}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && value.trim()) {
            e.preventDefault();
            formRef.current?.requestSubmit();
          }
        }}
        placeholder="Reply to your concierge…"
        className="min-h-10 flex-1 resize-none bg-transparent py-2 text-body text-bone-50 outline-none placeholder:text-bone-600"
      />
      <Button
        type="submit"
        size="sm"
        pending={pending}
        disabled={!value.trim()}
        aria-label="Send reply"
      >
        Send
      </Button>
      {state.status === "error" && state.message && (
        <p role="alert" className="sr-only">
          {state.message}
        </p>
      )}
    </form>
  );
}
