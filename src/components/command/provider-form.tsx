"use client";

import { useActionState } from "react";
import { createProviderAction } from "@/app/command/actions";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, FormMessage, Input, Select, Textarea } from "@/components/ui/field";
import { PROVIDER_STATUSES, type Market, type RequestCategory } from "@/lib/domain/types";
import { IDLE } from "@/lib/forms/state";

export function ProviderForm({
  markets,
  categories,
}: {
  markets: Pick<Market, "id" | "name">[];
  categories: Pick<RequestCategory, "slug" | "name">[];
}) {
  const [state, action, pending] = useActionState(createProviderAction, IDLE);
  const v = state.values ?? {};
  const e = state.fieldErrors ?? {};
  return (
    <form action={action} className="grid max-w-3xl gap-6">
      {state.status === "error" && state.message && (
        <FormMessage kind="error">{state.message}</FormMessage>
      )}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Name" htmlFor="name" error={e.name} className="sm:col-span-2">
          <Input id="name" name="name" defaultValue={v.name} invalid={!!e.name} />
        </Field>
        <Field label="Category" htmlFor="categorySlug" optional>
          <Select id="categorySlug" name="categorySlug" defaultValue={v.categorySlug ?? ""}>
            <option value="">—</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Market" htmlFor="marketId" optional>
          <Select id="marketId" name="marketId" defaultValue={v.marketId ?? ""}>
            <option value="">—</option>
            {markets.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Stage" htmlFor="status">
          <Select id="status" name="status" defaultValue={v.status ?? "prospect"}>
            {PROVIDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Website" htmlFor="website" optional>
          <Input id="website" name="website" type="url" defaultValue={v.website} />
        </Field>
        <Field label="Contact name" htmlFor="contactName" optional>
          <Input id="contactName" name="contactName" defaultValue={v.contactName} />
        </Field>
        <Field label="Contact email" htmlFor="contactEmail" optional>
          <Input id="contactEmail" name="contactEmail" type="email" defaultValue={v.contactEmail} />
        </Field>
        <Field label="Contact phone" htmlFor="contactPhone" optional>
          <Input id="contactPhone" name="contactPhone" type="tel" defaultValue={v.contactPhone} />
        </Field>
        <Field label="Terms" htmlFor="termsSummary" optional className="sm:col-span-2">
          <Textarea
            id="termsSummary"
            name="termsSummary"
            rows={2}
            className="min-h-20"
            defaultValue={v.termsSummary}
          />
        </Field>
        <Field label="Notes" htmlFor="notes" optional className="sm:col-span-2">
          <Textarea id="notes" name="notes" rows={3} className="min-h-24" defaultValue={v.notes} />
        </Field>
      </div>
      <Checkbox
        name="isFounding"
        label="Part of the founding 25 providers"
        defaultChecked={v.isFounding === "on"}
      />
      <div>
        <Button type="submit" pending={pending} pendingLabel="Saving">
          Save provider
        </Button>
      </div>
    </form>
  );
}
