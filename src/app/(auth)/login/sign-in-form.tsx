"use client";

import { useActionState } from "react";
import { Arrow, Button } from "@/components/ui/button";
import { Field, FormMessage, Input } from "@/components/ui/field";
import { IDLE } from "@/lib/forms/state";
import { requestSignInLink } from "./actions";

export function SignInForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(requestSignInLink, IDLE);
  if (state.status === "success") {
    return (
      <div role="status" className="reveal grid gap-4">
        <p className="font-display text-title font-light text-bone-50">Check your inbox.</p>
        <p className="text-body-sm text-bone-400">
          If <span className="text-bone-200">{state.values?.email}</span> belongs to a Biluxr
          member, a single-use sign-in link is on its way. It expires shortly, so use it soon.
        </p>
      </div>
    );
  }
  return (
    <form action={action} className="grid gap-5" noValidate>
      <input type="hidden" name="next" value={next ?? ""} />
      {state.status === "error" && state.message && (
        <FormMessage kind="error">{state.message}</FormMessage>
      )}
      <Field label="Email" htmlFor="email" error={state.fieldErrors?.email}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          autoFocus
          defaultValue={state.values?.email}
          invalid={!!state.fieldErrors?.email}
        />
      </Field>
      <Button
        type="submit"
        size="lg"
        pending={pending}
        pendingLabel="Sending…"
        trailing={<Arrow />}
        className="w-full"
      >
        Send sign-in link
      </Button>
      <p className="text-caption text-bone-500">
        No password. We email a single-use link each time you sign in.
      </p>
    </form>
  );
}
