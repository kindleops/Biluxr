"use client";

import { useActionState } from "react";
import { submitPartnerAction } from "@/app/(site)/actions";
import { Arrow, Button } from "@/components/ui/button";
import { Field, FormMessage, Input, Select, Textarea } from "@/components/ui/field";
import type { RequestCategory } from "@/lib/domain/types";
import { IDLE } from "@/lib/forms/state";
import { Honeypot } from "./honeypot";

export function PartnerForm({
  categories,
  available,
}: {
  categories: Pick<RequestCategory, "slug" | "name">[];
  available: boolean;
}) {
  const [state, action, pending] = useActionState(submitPartnerAction, IDLE);
  const v = state.values ?? {};
  const e = state.fieldErrors ?? {};

  if (state.status === "success") {
    return (
      <div role="status" className="reveal py-6">
        <p className="font-display text-headline font-light text-bone-50">
          Thank you — we will be in touch.
        </p>
        <p className="mt-4 max-w-lg text-body text-bone-400">
          Our partnerships team reads every introduction. If there is a fit with the members we
          serve, we will arrange a conversation and, in time, a first request.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="relative grid gap-6" noValidate>
      <Honeypot />
      {!available && (
        <FormMessage kind="error">
          Partner introductions are not open online yet. Please use the contact page.
        </FormMessage>
      )}
      {state.status === "error" && state.message && (
        <FormMessage kind="error">{state.message}</FormMessage>
      )}
      <fieldset className="grid gap-6 sm:grid-cols-2" disabled={!available || pending}>
        <Field label="Organization" htmlFor="organization" error={e.organization}>
          <Input
            id="organization"
            name="organization"
            autoComplete="organization"
            defaultValue={v.organization}
            invalid={!!e.organization}
          />
        </Field>
        <Field label="Your name" htmlFor="contactName" error={e.contactName}>
          <Input
            id="contactName"
            name="contactName"
            autoComplete="name"
            defaultValue={v.contactName}
            invalid={!!e.contactName}
          />
        </Field>
        <Field label="Email" htmlFor="p-email" error={e.email}>
          <Input
            id="p-email"
            name="email"
            type="email"
            autoComplete="email"
            defaultValue={v.email}
            invalid={!!e.email}
          />
        </Field>
        <Field label="Phone" htmlFor="p-phone" optional>
          <Input id="p-phone" name="phone" type="tel" autoComplete="tel" defaultValue={v.phone} />
        </Field>
        <Field label="What you offer" htmlFor="categorySlug" optional>
          <Select id="categorySlug" name="categorySlug" defaultValue={v.categorySlug ?? ""}>
            <option value="">Choose a category</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="City" htmlFor="p-city" error={e.city}>
          <Input
            id="p-city"
            name="city"
            autoComplete="address-level2"
            defaultValue={v.city}
            invalid={!!e.city}
          />
        </Field>
        <Field label="Website" htmlFor="website" optional className="sm:col-span-2">
          <Input
            id="website"
            name="website"
            type="url"
            inputMode="url"
            placeholder="https://"
            defaultValue={v.website}
          />
        </Field>
        <Field
          label="Tell us about your work"
          htmlFor="message"
          hint="What you do exceptionally well, and for whom."
          error={e.message}
          className="sm:col-span-2"
        >
          <Textarea
            id="message"
            name="message"
            rows={5}
            defaultValue={v.message}
            invalid={!!e.message}
          />
        </Field>
      </fieldset>
      <div className="flex justify-end">
        <Button
          type="submit"
          size="lg"
          pending={pending}
          pendingLabel="Sending…"
          trailing={<Arrow />}
          disabled={!available}
        >
          Introduce your business
        </Button>
      </div>
    </form>
  );
}
