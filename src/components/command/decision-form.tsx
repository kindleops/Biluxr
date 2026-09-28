"use client";

import { useActionState } from "react";
import { decideApplicationAction } from "@/app/command/actions";
import { Button } from "@/components/ui/button";
import { Field, FormMessage, Select, Textarea } from "@/components/ui/field";
import type { ApplicationStatus } from "@/lib/domain/types";
import { IDLE } from "@/lib/forms/state";

const LABEL: Record<ApplicationStatus, string> = {
  submitted: "Submitted",
  in_review: "In review",
  conversation: "Conversation scheduled",
  approved: "Approve",
  waitlisted: "Waitlist",
  declined: "Decline",
  withdrawn: "Withdrawn by applicant",
};

export function DecisionForm({ applicationId, status, note }: { applicationId: string; status: ApplicationStatus; note: string | null }) {
  const [state, action, pending] = useActionState(decideApplicationAction, IDLE);
  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="applicationId" value={applicationId} />
      {state.status !== "idle" && state.message && <FormMessage kind={state.status === "error" ? "error" : "success"}>{state.message}</FormMessage>}
      <Field label="Stage" htmlFor="status">
        <Select id="status" name="status" defaultValue={status} dense>
          {(Object.keys(LABEL) as ApplicationStatus[]).map((s) => (
            <option key={s} value={s}>
              {LABEL[s]}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Note" htmlFor="note" optional hint="Internal. Never shown to the applicant.">
        <Textarea id="note" name="note" rows={3} className="min-h-24 text-body-sm" defaultValue={note ?? ""} />
      </Field>
      <Button type="submit" size="sm" pending={pending} pendingLabel="Saving">
        Record decision
      </Button>
    </form>
  );
}
