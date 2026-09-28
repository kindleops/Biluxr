"use client";

import { useActionState } from "react";
import { submitContactAction } from "@/app/(site)/actions";
import { Arrow, Button } from "@/components/ui/button";
import { Field, FormMessage, Input, Select, Textarea } from "@/components/ui/field";
import { IDLE } from "@/lib/forms/state";
import { Honeypot } from "./honeypot";

export function ContactForm({ available }: { available: boolean }) {
  const [state, action, pending] = useActionState(submitContactAction, IDLE);
  const v = state.values ?? {};
  const e = state.fieldErrors ?? {};

  if (state.status === "success") {
    return (
      <div role="status" className="reveal">
        <p className="font-display text-headline font-light text-ink-900">
          Thank you. We will reply personally.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="relative grid gap-6" noValidate>
      <Honeypot />
      {!available && (
        <FormMessage tone="paper" kind="error">
          This form is not connected yet. Messages cannot be received online at the moment.
        </FormMessage>
      )}
      {state.status === "error" && state.message && (
        <FormMessage tone="paper" kind="error">
          {state.message}
        </FormMessage>
      )}
      <fieldset className="grid gap-6 sm:grid-cols-2" disabled={!available || pending}>
        <Field tone="paper" label="Name" htmlFor="c-name" error={e.name}>
          <Input
            tone="paper"
            id="c-name"
            name="name"
            autoComplete="name"
            defaultValue={v.name}
            invalid={!!e.name}
          />
        </Field>
        <Field tone="paper" label="Email" htmlFor="c-email" error={e.email}>
          <Input
            tone="paper"
            id="c-email"
            name="email"
            type="email"
            autoComplete="email"
            defaultValue={v.email}
            invalid={!!e.email}
          />
        </Field>
        <Field tone="paper" label="About" htmlFor="topic" className="sm:col-span-2">
          <Select tone="paper" id="topic" name="topic" defaultValue={v.topic ?? "membership"}>
            <option value="membership">Membership</option>
            <option value="partnership">Partnership</option>
            <option value="press">Press</option>
            <option value="other">Something else</option>
          </Select>
        </Field>
        <Field
          tone="paper"
          label="Message"
          htmlFor="c-message"
          error={e.message}
          className="sm:col-span-2"
        >
          <Textarea
            tone="paper"
            id="c-message"
            name="message"
            rows={6}
            defaultValue={v.message}
            invalid={!!e.message}
          />
        </Field>
      </fieldset>
      <div>
        <Button
          tone="paper"
          type="submit"
          size="lg"
          pending={pending}
          pendingLabel="Sending…"
          trailing={<Arrow />}
          disabled={!available}
        >
          Send
        </Button>
      </div>
    </form>
  );
}
