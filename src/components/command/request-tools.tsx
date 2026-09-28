"use client";

import { useActionState, useState } from "react";
import { useActionResult } from "@/lib/forms/use-action-result";
import {
  createOptionAction,
  postStaffMessageAction,
  sendClarifyingQuestionAction,
  updateRequestAction,
} from "@/app/command/actions";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/dialog";
import { Checkbox, Field, FormMessage, Input, Select, Textarea } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import { REQUEST_STATUS_PRESENTATION, REQUEST_TRANSITIONS } from "@/lib/domain/requests";
import type { Provider, RequestCategory, RequestPriority, RequestStatus } from "@/lib/domain/types";
import { IDLE } from "@/lib/forms/state";

/* ------------------------------ Status & owner ----------------------------- */

export function RequestControls({
  requestId,
  status,
  assigneeId,
  priority,
  categorySlug,
  staff,
  categories,
}: {
  requestId: string;
  status: RequestStatus;
  assigneeId: string | null;
  priority: RequestPriority;
  categorySlug: string | null;
  staff: { id: string; name: string }[];
  categories: Pick<RequestCategory, "slug" | "name">[];
}) {
  const [state, action, pending] = useActionState(updateRequestAction, IDLE);
  const next = REQUEST_TRANSITIONS[status];
  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="requestId" value={requestId} />
      <Field
        label="Status"
        htmlFor="status"
        hint={next.length === 0 ? "This request is closed." : "Only valid next steps are offered."}
      >
        <Select id="status" name="status" defaultValue={status} disabled={next.length === 0} dense>
          <option value={status}>{REQUEST_STATUS_PRESENTATION[status].staff} (current)</option>
          {next.map((s) => (
            <option key={s} value={s}>
              → {REQUEST_STATUS_PRESENTATION[s].staff}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Owner" htmlFor="assigneeId">
        <Select id="assigneeId" name="assigneeId" defaultValue={assigneeId ?? ""} dense>
          <option value="">Unassigned</option>
          {staff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Priority" htmlFor="priority">
          <Select id="priority" name="priority" defaultValue={priority} dense>
            <option value="standard">Standard</option>
            <option value="priority">Priority</option>
            <option value="urgent">Urgent</option>
          </Select>
        </Field>
        <Field label="Category" htmlFor="categorySlug">
          <Select id="categorySlug" name="categorySlug" defaultValue={categorySlug ?? ""} dense>
            <option value="">—</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      {state.status === "error" && state.message && (
        <FormMessage kind="error">{state.message}</FormMessage>
      )}
      <div className="flex items-center justify-end gap-3">
        {state.status === "success" && (
          <span role="status" className="text-caption text-status-moss">
            Saved
          </span>
        )}
        <Button type="submit" size="sm" variant="secondary" pending={pending} pendingLabel="Saving">
          Save changes
        </Button>
      </div>
    </form>
  );
}

/* -------------------------------- Messaging -------------------------------- */

export function StaffComposer({ requestId, closed }: { requestId: string; closed: boolean }) {
  const [state, action, pending] = useActionState(postStaffMessageAction, IDLE);
  const [visibility, setVisibility] = useState<"member" | "internal">("member");
  const [value, setValue] = useState("");
  useActionResult(state, (s) => {
    if (s.status === "success") setValue("");
  });
  const internal = visibility === "internal";
  return (
    <form
      action={action}
      className={cn(
        "rounded-lg p-3 transition-shadow",
        internal
          ? "bg-status-amber/[0.04] shadow-[inset_0_0_0_1px_rgb(207_166_106/0.35)]"
          : "bg-ink-900 shadow-[inset_0_0_0_1px_var(--line)]",
      )}
    >
      <input type="hidden" name="requestId" value={requestId} />
      <input type="hidden" name="visibility" value={visibility} />
      <div role="radiogroup" aria-label="Message visibility" className="mb-2 flex gap-1">
        {(["member", "internal"] as const).map((v) => (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={visibility === v}
            onClick={() => setVisibility(v)}
            disabled={closed && v === "member"}
            className={cn(
              "rounded-xs px-2.5 py-1 text-caption transition-colors disabled:opacity-40",
              visibility === v
                ? v === "internal"
                  ? "bg-status-amber/15 text-status-amber"
                  : "bg-white/10 text-bone-50"
                : "text-bone-500 hover:text-bone-200",
            )}
          >
            {v === "member" ? "Reply to member" : "Internal note"}
          </button>
        ))}
      </div>
      <label htmlFor="staff-body" className="sr-only">
        {internal ? "Internal note" : "Reply to member"}
      </label>
      <Textarea
        id="staff-body"
        name="body"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={3}
        className="min-h-20 bg-transparent px-1 text-body-sm shadow-none hover:shadow-none focus:shadow-none"
        placeholder={
          internal ? "Visible to the team only…" : "Write to the member in Biluxr's voice…"
        }
      />
      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="text-caption text-bone-500">
          {internal ? "Never shown to the member." : "The member will see this immediately."}
        </p>
        <Button type="submit" size="sm" pending={pending} disabled={!value.trim()}>
          {internal ? "Add note" : "Send"}
        </Button>
      </div>
      {state.status === "error" && state.message && (
        <p role="alert" className="mt-2 text-caption text-status-clay">
          {state.message}
        </p>
      )}
    </form>
  );
}

/* --------------------------------- Options --------------------------------- */

export function OptionBuilder({
  requestId,
  providers,
}: {
  requestId: string;
  providers: Pick<Provider, "id" | "name" | "status">[];
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(createOptionAction, IDLE);
  const [formKey, setFormKey] = useState(0);
  useActionResult(state, (s) => {
    if (s.status === "success") {
      setFormKey((k) => k + 1);
      setOpen(false);
    }
  });
  const e = state.fieldErrors ?? {};
  return (
    <>
      <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
        New option
      </Button>
      <Sheet open={open} onClose={() => setOpen(false)} title="New option">
        <form key={formKey} action={action} className="grid gap-5">
          <input type="hidden" name="requestId" value={requestId} />
          {state.status === "error" && state.message && (
            <FormMessage kind="error">{state.message}</FormMessage>
          )}
          <Field
            label="Title"
            htmlFor="opt-title"
            hint="What the member will see first."
            error={e.title}
          >
            <Input id="opt-title" name="title" invalid={!!e.title} />
          </Field>
          <Field
            label="Why this"
            htmlFor="opt-summary"
            hint="Two or three sentences. The reason, not the brochure."
          >
            <Textarea id="opt-summary" name="summary" rows={4} className="min-h-28" />
          </Field>
          <div className="grid grid-cols-[1fr_6rem] gap-3">
            <Field label="Price" htmlFor="opt-price" optional error={e.priceMajor}>
              <Input
                id="opt-price"
                name="priceMajor"
                inputMode="decimal"
                placeholder="Leave blank if on request"
                invalid={!!e.priceMajor}
              />
            </Field>
            <Field label="Currency" htmlFor="opt-currency">
              <Input
                id="opt-currency"
                name="currency"
                defaultValue="USD"
                maxLength={3}
                className="uppercase"
              />
            </Field>
          </div>
          <Field
            label="Provider"
            htmlFor="opt-provider"
            optional
            hint="Internal only — never shown to the member."
          >
            <Select id="opt-provider" name="providerId" defaultValue="">
              <option value="">None / not listed</option>
              {providers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.status})
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Held until" htmlFor="opt-expires" optional>
            <Input id="opt-expires" name="expiresAt" type="datetime-local" />
          </Field>
          <Checkbox
            name="present"
            label="Present to the member now (moves the request to Options presented)"
            defaultChecked
          />
          <Button type="submit" pending={pending} pendingLabel="Saving">
            Save option
          </Button>
        </form>
      </Sheet>
    </>
  );
}

/* ------------------------------ AI clarifying ------------------------------ */

export function ClarifyingQuestion({
  requestId,
  eventId,
  question,
}: {
  requestId: string;
  eventId: string;
  question: string;
}) {
  const [state, action, pending] = useActionState(sendClarifyingQuestionAction, IDLE);
  const [editing, setEditing] = useState(false);
  if (state.status === "success") {
    return <p className="text-caption text-status-moss">{state.message}</p>;
  }
  return (
    <form action={action} className="grid gap-2">
      <input type="hidden" name="requestId" value={requestId} />
      <input type="hidden" name="eventId" value={eventId} />
      <input type="hidden" name="original" value={question} />
      {editing ? (
        <Textarea
          name="body"
          defaultValue={question}
          rows={3}
          className="min-h-20 text-body-sm"
          aria-label="Edit question"
        />
      ) : (
        <>
          <input type="hidden" name="body" value={question} />
          <p className="rounded-md bg-white/[0.03] px-3 py-2 text-body-sm text-bone-200">
            “{question}”
          </p>
        </>
      )}
      {state.status === "error" && state.message && (
        <p className="text-caption text-status-clay">{state.message}</p>
      )}
      <div className="flex gap-2">
        <Button type="button" size="sm" variant="ghost" onClick={() => setEditing((v) => !v)}>
          {editing ? "Preview" : "Edit"}
        </Button>
        <Button type="submit" size="sm" variant="secondary" pending={pending}>
          Send to member
        </Button>
      </div>
    </form>
  );
}
