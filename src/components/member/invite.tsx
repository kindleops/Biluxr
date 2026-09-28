"use client";

import { useActionState, useState } from "react";
import { issueInvitationAction } from "@/app/app/actions";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/dialog";
import { Field, FormMessage, Input } from "@/components/ui/field";
import { IDLE } from "@/lib/forms/state";

export function InviteButton({ remaining }: { remaining: number }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(issueInvitationAction, IDLE);
  const [copied, setCopied] = useState(false);
  const code = state.status === "success" ? state.values?.code : undefined;
  const link = code && typeof window !== "undefined" ? `${window.location.origin}/apply?invitation=${code}` : "";

  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)} disabled={remaining <= 0}>
        Extend an invitation
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={code ? "Invitation ready" : "Extend an invitation"}
        description={code ? undefined : "Share Biluxr with someone you trust. Their application will be read first."}
      >
        {code ? (
          <div className="grid gap-5">
            <p className="text-body-sm text-bone-300">
              Share this privately with {state.values?.name}. For their privacy and yours, it is shown only once.
            </p>
            <div className="rounded-md bg-ink-900 px-4 py-3 shadow-[inset_0_0_0_1px_var(--line)]">
              <p className="text-label text-bone-500">Code</p>
              <p className="mt-1 font-mono text-title tracking-[0.2em] text-bone-50">{code}</p>
              <p className="mt-3 break-all text-caption text-bone-400">{link}</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={async () => {
                  await navigator.clipboard.writeText(link);
                  setCopied(true);
                }}
              >
                {copied ? "Copied" : "Copy link"}
              </Button>
              <Button onClick={() => setOpen(false)}>Done</Button>
            </div>
          </div>
        ) : (
          <form action={action} className="grid gap-5">
            {state.status === "error" && state.message && <FormMessage kind="error">{state.message}</FormMessage>}
            <Field label="Their name" htmlFor="inv-name" error={state.fieldErrors?.name}>
              <Input id="inv-name" name="name" autoComplete="off" defaultValue={state.values?.name} invalid={!!state.fieldErrors?.name} />
            </Field>
            <Field label="Their email" htmlFor="inv-email" error={state.fieldErrors?.email}>
              <Input id="inv-email" name="email" type="email" autoComplete="off" defaultValue={state.values?.email} invalid={!!state.fieldErrors?.email} />
            </Field>
            <div className="flex justify-end">
              <Button type="submit" pending={pending} pendingLabel="Creating">
                Create invitation
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
