"use client";

import { useActionState, useState } from "react";
import { useActionResult } from "@/lib/forms/use-action-result";
import { addPersonAction, addPreferenceAction, updateProfileAction } from "@/app/app/actions";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/dialog";
import { Field, FormMessage, Input, Select, Textarea } from "@/components/ui/field";
import { PREFERENCE_DOMAINS, type Profile } from "@/lib/domain/types";
import { IDLE } from "@/lib/forms/state";

export const DOMAIN_LABEL: Record<(typeof PREFERENCE_DOMAINS)[number], string> = {
  travel: "Travel",
  stays: "Stays",
  dining: "Dining",
  wellness: "Wellness",
  family: "Family",
  communication: "Communication",
  gifting: "Gifting",
  other: "Other",
};

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Europe/Rome",
  "Asia/Dubai",
  "Asia/Singapore",
  "Asia/Tokyo",
];

export function ProfileDetailsForm({ profile }: { profile: Profile }) {
  const [state, action, pending] = useActionState(updateProfileAction, IDLE);
  const e = state.fieldErrors ?? {};
  const zones = TIMEZONES.includes(profile.timezone) ? TIMEZONES : [profile.timezone, ...TIMEZONES];
  return (
    <form action={action} className="grid gap-6">
      {state.status === "error" && state.message && (
        <FormMessage kind="error">{state.message}</FormMessage>
      )}
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Full name" htmlFor="fullName" error={e.fullName}>
          <Input
            id="fullName"
            name="fullName"
            autoComplete="name"
            defaultValue={profile.fullName}
            invalid={!!e.fullName}
          />
        </Field>
        <Field label="What we call you" htmlFor="preferredName" optional>
          <Input
            id="preferredName"
            name="preferredName"
            autoComplete="nickname"
            defaultValue={profile.preferredName ?? ""}
          />
        </Field>
        <Field label="Phone" htmlFor="phone" optional>
          <Input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            defaultValue={profile.phone ?? ""}
          />
        </Field>
        <Field
          label="Home time zone"
          htmlFor="timezone"
          error={e.timezone}
          hint="Times are shown in this zone unless a plan is elsewhere."
        >
          <Select id="timezone" name="timezone" defaultValue={profile.timezone}>
            {zones.map((z) => (
              <option key={z} value={z}>
                {z.replace("_", " ")}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <div className="flex items-center justify-between gap-4">
        <p className="text-caption text-bone-500">
          Email: {profile.email}. To change it, ask your concierge.
        </p>
        <div className="flex items-center gap-3">
          {state.status === "success" && (
            <span role="status" className="text-caption text-status-moss">
              Saved
            </span>
          )}
          <Button
            type="submit"
            variant="secondary"
            size="sm"
            pending={pending}
            pendingLabel="Saving"
          >
            Save
          </Button>
        </div>
      </div>
    </form>
  );
}

/** Close the sheet and remount (clear) the form after a successful save. */
function useResetOnSuccess(state: { status: string }, close: () => void): number {
  const [formKey, setFormKey] = useState(0);
  useActionResult(state, (s) => {
    if (s.status === "success") {
      setFormKey((k) => k + 1);
      close();
    }
  });
  return formKey;
}

export function AddPreference() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(addPreferenceAction, IDLE);
  const formKey = useResetOnSuccess(state, () => setOpen(false));
  const e = state.fieldErrors ?? {};
  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        Add
      </Button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Add a preference">
        <form key={formKey} action={action} className="grid gap-5">
          {state.status === "error" && state.message && (
            <FormMessage kind="error">{state.message}</FormMessage>
          )}
          <Field label="About" htmlFor="domain">
            <Select id="domain" name="domain" defaultValue="travel">
              {PREFERENCE_DOMAINS.map((d) => (
                <option key={d} value={d}>
                  {DOMAIN_LABEL[d]}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label="Label"
            htmlFor="label"
            hint="For example: Seating, Allergies, Rooms."
            error={e.label}
          >
            <Input id="label" name="label" invalid={!!e.label} />
          </Field>
          <Field label="Preference" htmlFor="value" error={e.value}>
            <Textarea id="value" name="value" rows={3} className="min-h-24" invalid={!!e.value} />
          </Field>
          <Button type="submit" pending={pending} pendingLabel="Saving">
            Save preference
          </Button>
        </form>
      </Sheet>
    </>
  );
}

export function AddPerson() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(addPersonAction, IDLE);
  const formKey = useResetOnSuccess(state, () => setOpen(false));
  const e = state.fieldErrors ?? {};
  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        Add
      </Button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Add someone">
        <form key={formKey} action={action} className="grid gap-5">
          {state.status === "error" && state.message && (
            <FormMessage kind="error">{state.message}</FormMessage>
          )}
          <Field label="Name" htmlFor="p-name" error={e.name}>
            <Input id="p-name" name="name" invalid={!!e.name} />
          </Field>
          <Field
            label="Relationship"
            htmlFor="relationship"
            hint="Partner, daughter, assistant, pilot…"
            error={e.relationship}
          >
            <Input id="relationship" name="relationship" invalid={!!e.relationship} />
          </Field>
          <Field label="Birthday" htmlFor="birthday" optional>
            <Input id="birthday" name="birthday" type="date" />
          </Field>
          <Field label="Notes" htmlFor="notes" optional>
            <Textarea id="notes" name="notes" rows={3} className="min-h-24" />
          </Field>
          <Button type="submit" pending={pending} pendingLabel="Saving">
            Save
          </Button>
        </form>
      </Sheet>
    </>
  );
}
