"use client";

import { useActionState, useState } from "react";
import { useActionResult } from "@/lib/forms/use-action-result";
import { cancelRequestAction } from "@/app/app/actions";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/dialog";
import { Field, FormMessage, Textarea } from "@/components/ui/field";
import { IDLE } from "@/lib/forms/state";

export function CancelRequest({ requestId }: { requestId: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(cancelRequestAction, IDLE);
  useActionResult(state, (s) => {
    if (s.status === "success") setOpen(false);
  });
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-caption text-bone-500 underline decoration-white/20 underline-offset-4 hover:text-bone-200"
      >
        Withdraw this request
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Withdraw this request?"
        description="Your concierge will stop work on it. You can always start a new one."
      >
        <form action={action} className="grid gap-5">
          <input type="hidden" name="requestId" value={requestId} />
          {state.status === "error" && state.message && (
            <FormMessage kind="error">{state.message}</FormMessage>
          )}
          <Field label="Anything we should know?" htmlFor="reason" optional>
            <Textarea id="reason" name="reason" rows={3} className="min-h-24" />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Keep it
            </Button>
            <Button type="submit" variant="danger" pending={pending} pendingLabel="Withdrawing">
              Withdraw
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
