"use client";

import Link from "next/link";
import { useActionState } from "react";
import { submitApplicationAction } from "@/app/(site)/actions";
import { Arrow, Button } from "@/components/ui/button";
import { Checkbox, Field, FormMessage, Input, Select, Textarea } from "@/components/ui/field";
import type { Market } from "@/lib/domain/types";
import { IDLE } from "@/lib/forms/state";
import { Honeypot } from "./honeypot";

export function ApplicationForm({
  markets,
  invitationCode,
  available,
}: {
  markets: Pick<Market, "slug" | "name">[];
  invitationCode?: string;
  available: boolean;
}) {
  const [state, action, pending] = useActionState(submitApplicationAction, IDLE);
  const v = state.values ?? {};
  const e = state.fieldErrors ?? {};

  if (state.status === "success") {
    return (
      <div role="status" className="reveal py-10">
        <p className="text-label text-ink-700/60">Received</p>
        <p className="mt-6 font-display text-headline font-light text-ink-900">Thank you. Your application is with us.</p>
        <p className="mt-6 max-w-lg text-lede text-ink-800/80">
          Every application is read personally. If it feels like a fit, we will be in touch to arrange a conversation.
          Either way, you will hear from us.
        </p>
        <Link href="/" className="mt-10 inline-block text-body-sm text-ink-900 underline decoration-black/25 underline-offset-[6px]">
          Return home
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="relative grid gap-12" noValidate>
      <Honeypot />
      {!available && (
        <FormMessage tone="paper" kind="error">
          Online applications are not open yet. Please write to us through the contact page and we will reply
          personally.
        </FormMessage>
      )}
      {state.status === "error" && state.message && (
        <FormMessage tone="paper" kind="error">
          {state.message}
        </FormMessage>
      )}

      <fieldset className="grid gap-6" disabled={!available || pending}>
        <legend className="mb-2 text-label text-ink-700/60">About you</legend>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field tone="paper" label="Full name" htmlFor="fullName" error={e.fullName}>
            <Input tone="paper" id="fullName" name="fullName" autoComplete="name" required defaultValue={v.fullName} invalid={!!e.fullName} />
          </Field>
          <Field tone="paper" label="Email" htmlFor="email" error={e.email}>
            <Input tone="paper" id="email" name="email" type="email" autoComplete="email" required defaultValue={v.email} invalid={!!e.email} />
          </Field>
          <Field tone="paper" label="Phone" htmlFor="phone" optional error={e.phone}>
            <Input tone="paper" id="phone" name="phone" type="tel" autoComplete="tel" defaultValue={v.phone} />
          </Field>
          <Field tone="paper" label="City you live in" htmlFor="city" error={e.city}>
            <Input tone="paper" id="city" name="city" autoComplete="address-level2" required defaultValue={v.city} invalid={!!e.city} />
          </Field>
          <Field tone="paper" label="Where you would use Biluxr most" htmlFor="marketSlug" optional>
            <Select tone="paper" id="marketSlug" name="marketSlug" defaultValue={v.marketSlug ?? ""}>
              <option value="">Choose a city</option>
              {markets.map((m) => (
                <option key={m.slug} value={m.slug}>
                  {m.name}
                </option>
              ))}
              <option value="elsewhere">Elsewhere</option>
            </Select>
          </Field>
          <Field tone="paper" label="What you do" htmlFor="occupation" optional>
            <Input tone="paper" id="occupation" name="occupation" autoComplete="organization-title" defaultValue={v.occupation} />
          </Field>
        </div>
      </fieldset>

      <fieldset className="grid gap-6" disabled={!available || pending}>
        <legend className="mb-2 text-label text-ink-700/60">Your life, briefly</legend>
        <Field
          tone="paper"
          label="How does your life move?"
          htmlFor="lifeInMotion"
          hint="Homes, travel, family, work — whatever feels relevant."
          error={e.lifeInMotion}
        >
          <Textarea tone="paper" id="lifeInMotion" name="lifeInMotion" rows={4} required defaultValue={v.lifeInMotion} invalid={!!e.lifeInMotion} />
        </Field>
        <Field
          tone="paper"
          label="What would make it easier?"
          htmlFor="whatWouldHelp"
          hint="The kind of thing you would hand to someone you trust."
          error={e.whatWouldHelp}
        >
          <Textarea tone="paper" id="whatWouldHelp" name="whatWouldHelp" rows={4} required defaultValue={v.whatWouldHelp} invalid={!!e.whatWouldHelp} />
        </Field>
      </fieldset>

      <fieldset className="grid gap-6" disabled={!available || pending}>
        <legend className="mb-2 text-label text-ink-700/60">Introduction</legend>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field tone="paper" label="How did you hear of us?" htmlFor="referralSource" optional>
            <Input tone="paper" id="referralSource" name="referralSource" defaultValue={v.referralSource} />
          </Field>
          <Field tone="paper" label="Invitation code" htmlFor="invitationCode" optional hint="If a member invited you.">
            <Input
              tone="paper"
              id="invitationCode"
              name="invitationCode"
              autoCapitalize="characters"
              spellCheck={false}
              className="font-mono uppercase tracking-[0.12em]"
              defaultValue={v.invitationCode ?? invitationCode}
            />
          </Field>
        </div>
        <div className="grid gap-2">
          <Checkbox
            tone="paper"
            name="consent"
            required
            defaultChecked={v.consent === "on"}
            label={
              <>
                I have read the{" "}
                <Link href="/legal/privacy" className="underline underline-offset-4">
                  privacy notice
                </Link>{" "}
                and agree to Biluxr keeping these details to consider my application.
              </>
            }
          />
          {e.consent && (
            <p role="alert" className="pl-7 text-caption text-[#8c4a3e]">
              {e.consent}
            </p>
          )}
        </div>
      </fieldset>

      <div className="flex flex-col gap-4 border-t border-(--line-paper) pt-8 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-caption text-ink-700/60">Ten minutes. Read personally. Every applicant receives a reply.</p>
        <Button tone="paper" type="submit" size="lg" pending={pending} pendingLabel="Sending…" trailing={<Arrow />} disabled={!available}>
          Submit application
        </Button>
      </div>
    </form>
  );
}
