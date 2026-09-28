"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { addMemberPreferenceAction } from "@/app/command/actions";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/dialog";
import { Field, FormMessage, Input, Select, Textarea } from "@/components/ui/field";
import { PREFERENCE_DOMAINS } from "@/lib/domain/types";
import { IDLE } from "@/lib/forms/state";

export function AddMemberPreference({ memberId }: { memberId: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(addMemberPreferenceAction, IDLE);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
      setOpen(false);
    }
  }, [state]);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="text-caption text-bone-400 hover:text-bone-100">
        Add
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Record a preference">
        <form ref={formRef} action={action} className="grid gap-5">
          <input type="hidden" name="memberId" value={memberId} />
          {state.status === "error" && <FormMessage kind="error">{state.message ?? "Please check the fields."}</FormMessage>}
          <Field label="Domain" htmlFor="m-domain">
            <Select id="m-domain" name="domain" defaultValue="travel">
              {PREFERENCE_DOMAINS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Label" htmlFor="m-label" error={state.fieldErrors?.label}>
            <Input id="m-label" name="label" />
          </Field>
          <Field label="Preference" htmlFor="m-value" error={state.fieldErrors?.value} hint="The member will see this in their profile, marked as noted by their concierge.">
            <Textarea id="m-value" name="value" rows={3} className="min-h-24" />
          </Field>
          <Button type="submit" pending={pending}>
            Save
          </Button>
        </form>
      </Sheet>
    </>
  );
}
