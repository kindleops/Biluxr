"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { analyzeRequest, summarize } from "@/lib/ai/intake";
import { parseIntent } from "@/lib/ai/schemas";
import { track } from "@/lib/analytics";
import { requireAdmin, requireStaff } from "@/lib/auth/session";
import { publicRepository, staffRepository } from "@/lib/data";
import { DomainError, ForbiddenError, NotFoundError } from "@/lib/data/repository";
import { canTransition } from "@/lib/domain/requests";
import {
  applicationDecisionSchema,
  fieldErrors,
  formToObject,
  newOptionSchema,
  preferenceSchema,
  providerSchema,
  staffMessageSchema,
  staffRequestPatchSchema,
} from "@/lib/domain/schemas";
import { PROVIDER_STATUSES } from "@/lib/domain/types";
import { dataMode } from "@/lib/env";
import type { FormState } from "@/lib/forms/state";

function failure(error: unknown, values?: Record<string, string>): FormState {
  if (error instanceof DomainError) return { status: "error", message: error.message, values };
  if (error instanceof NotFoundError) return { status: "error", message: "That record could not be found.", values };
  if (error instanceof ForbiddenError) return { status: "error", message: "Your role does not permit this.", values };
  console.error(error);
  return { status: "error", message: "Something went wrong. Please try again.", values };
}

const uuid = z.uuid();

export async function updateRequestAction(_prev: FormState, form: FormData): Promise<FormState> {
  const identity = await requireStaff();
  const parsed = staffRequestPatchSchema.safeParse(formToObject(form));
  if (!parsed.success) return { status: "error", message: "Invalid update." };
  const { requestId, ...patch } = parsed.data;
  try {
    const repo = await staffRepository(identity);
    await repo.updateRequest(requestId, {
      ...patch,
      categorySlug: patch.categorySlug === undefined ? undefined : patch.categorySlug || null,
    });
  } catch (error) {
    return failure(error);
  }
  revalidatePath(`/command/requests/${requestId}`);
  revalidatePath("/command");
  return { status: "success", message: "Updated." };
}

export async function postStaffMessageAction(_prev: FormState, form: FormData): Promise<FormState> {
  const identity = await requireStaff();
  const values = formToObject(form);
  const parsed = staffMessageSchema.safeParse(values);
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrors(parsed.error), values };
  try {
    const repo = await staffRepository(identity);
    await repo.postMessage(parsed.data.requestId, parsed.data.body, parsed.data.visibility);
  } catch (error) {
    return failure(error, values);
  }
  revalidatePath(`/command/requests/${parsed.data.requestId}`);
  revalidatePath("/command");
  return { status: "success" };
}

export async function createOptionAction(_prev: FormState, form: FormData): Promise<FormState> {
  const identity = await requireStaff();
  const values = formToObject(form);
  const parsed = newOptionSchema.safeParse(values);
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrors(parsed.error), values };
  try {
    const repo = await staffRepository(identity);
    await repo.createOption(parsed.data.requestId, parsed.data);
    if (parsed.data.present) {
      const detail = await repo.getRequest(parsed.data.requestId);
      if (canTransition(detail.request.status, "options_ready")) {
        await repo.updateRequest(parsed.data.requestId, { status: "options_ready" });
      }
    }
  } catch (error) {
    return failure(error, values);
  }
  revalidatePath(`/command/requests/${parsed.data.requestId}`);
  return { status: "success" };
}

export async function setOptionStatusAction(form: FormData): Promise<void> {
  const identity = await requireStaff();
  const optionId = uuid.parse(form.get("optionId"));
  const requestId = uuid.parse(form.get("requestId"));
  const status = z.enum(["presented", "withdrawn"]).parse(form.get("status"));
  const repo = await staffRepository(identity);
  await repo.setOptionStatus(optionId, status);
  if (status === "presented") {
    const detail = await repo.getRequest(requestId);
    if (canTransition(detail.request.status, "options_ready")) await repo.updateRequest(requestId, { status: "options_ready" });
  }
  revalidatePath(`/command/requests/${requestId}`);
}

/* ---------------------------- Biluxr AI review ---------------------------- */

export async function analyzeRequestAction(form: FormData): Promise<void> {
  const identity = await requireStaff();
  const requestId = uuid.parse(form.get("requestId"));
  const repo = await staffRepository(identity);
  const detail = await repo.getRequest(requestId);
  const pub = await publicRepository();
  const categories = pub ? await pub.listCategories() : [];
  const event = await analyzeRequest({
    request: detail.request,
    member: detail.member,
    preferences: detail.preferences,
    categories,
  });
  if (event) await repo.recordAiEvent(event);
  revalidatePath(`/command/requests/${requestId}`);
}

export async function applyIntentAction(form: FormData): Promise<void> {
  const identity = await requireStaff();
  const requestId = uuid.parse(form.get("requestId"));
  const eventId = uuid.parse(form.get("eventId"));
  const repo = await staffRepository(identity);
  const detail = await repo.getRequest(requestId);
  const event = detail.aiEvents.find((e) => e.id === eventId);
  const intent = event ? parseIntent(event.output) : null;
  if (!event || !intent) throw new DomainError("Suggestion not found.");
  const pub = await publicRepository();
  const categories = pub ? await pub.listCategories() : [];
  const validCategory = categories.some((c) => c.slug === intent.category) ? intent.category : undefined;
  // Only fields a person has chosen to apply; nothing reaches the member here.
  await repo.updateRequest(requestId, {
    title: form.get("applyTitle") === "on" ? intent.title.slice(0, 200) : undefined,
    categorySlug: form.get("applyCategory") === "on" ? validCategory : undefined,
    priority: form.get("applyPriority") === "on" ? intent.priority : undefined,
    partySize: form.get("applyParty") === "on" && intent.partySize ? intent.partySize : undefined,
    location: form.get("applyLocation") === "on" && intent.location ? intent.location : undefined,
  });
  await repo.reviewAiEvent(eventId, "accepted");
  await track("ai.reviewed", { outcome: "accepted", kind: event.kind }, identity.userId);
  revalidatePath(`/command/requests/${requestId}`);
}

export async function sendClarifyingQuestionAction(_prev: FormState, form: FormData): Promise<FormState> {
  const identity = await requireStaff();
  const values = formToObject(form);
  const parsed = z
    .object({ requestId: z.uuid(), eventId: z.uuid(), original: z.string(), body: z.string().trim().min(3).max(2000) })
    .safeParse(values);
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrors(parsed.error), values };
  try {
    const repo = await staffRepository(identity);
    await repo.postMessage(parsed.data.requestId, parsed.data.body, "member");
    const detail = await repo.getRequest(parsed.data.requestId);
    if (canTransition(detail.request.status, "clarifying")) {
      await repo.updateRequest(parsed.data.requestId, { status: "clarifying" });
    }
    const edited = parsed.data.body.trim() !== parsed.data.original.trim();
    await repo.reviewAiEvent(parsed.data.eventId, edited ? "edited" : "accepted");
    await track("ai.reviewed", { outcome: edited ? "edited" : "accepted", kind: "clarification" }, identity.userId);
  } catch (error) {
    return failure(error, values);
  }
  revalidatePath(`/command/requests/${parsed.data.requestId}`);
  return { status: "success", message: "Sent to the member." };
}

export async function dismissAiEventAction(form: FormData): Promise<void> {
  const identity = await requireStaff();
  const eventId = uuid.parse(form.get("eventId"));
  const path = String(form.get("path") ?? "/command");
  const repo = await staffRepository(identity);
  await repo.reviewAiEvent(eventId, "dismissed");
  await track("ai.reviewed", { outcome: "dismissed" }, identity.userId);
  revalidatePath(path.startsWith("/command") ? path : "/command");
}

export async function summarizeRequestAction(form: FormData): Promise<void> {
  const identity = await requireStaff();
  const requestId = uuid.parse(form.get("requestId"));
  const repo = await staffRepository(identity);
  const d = await repo.getRequest(requestId);
  const records = [
    `Request ${d.request.reference}: ${d.request.title} (status ${d.request.status}, priority ${d.request.priority})`,
    `Brief: ${d.request.brief}`,
    `Member preferences:\n${d.preferences.map((p) => `- ${p.label}: ${p.value}`).join("\n") || "- none"}`,
    `Options:\n${d.options.map((o) => `- ${o.title} [${o.status}]`).join("\n") || "- none"}`,
    `Messages:\n${d.messages.map((m) => `[${m.visibility}] ${m.authorKind} ${m.authorName}: ${m.body}`).join("\n")}`,
  ].join("\n\n");
  const event = await summarize({ kind: "request", subjectId: requestId, memberId: d.member.id, requestId, records });
  if (event) await repo.recordAiEvent(event);
  revalidatePath(`/command/requests/${requestId}`);
}

export async function summarizeMemberAction(form: FormData): Promise<void> {
  const identity = await requireStaff();
  const memberId = uuid.parse(form.get("memberId"));
  const repo = await staffRepository(identity);
  const m = await repo.member360(memberId);
  const records = [
    `Member: ${m.profile.fullName}${m.profile.preferredName ? ` (goes by ${m.profile.preferredName})` : ""}, time zone ${m.profile.timezone}`,
    `Membership: ${m.membership?.status ?? "none"}${m.membership?.isFounding ? ", founding" : ""}`,
    `Preferences:\n${m.preferences.map((p) => `- [${p.domain}] ${p.label}: ${p.value}`).join("\n") || "- none"}`,
    `People:\n${m.people.map((p) => `- ${p.name} (${p.relationship})${p.notes ? `: ${p.notes}` : ""}`).join("\n") || "- none"}`,
    `Requests:\n${m.requests.map((r) => `- ${r.reference} ${r.title} [${r.status}] ${r.createdAt.slice(0, 10)}`).join("\n") || "- none"}`,
    `Journeys:\n${m.journeys.map((j) => `- ${j.title} [${j.status}] ${j.startsOn ?? ""}–${j.endsOn ?? ""}`).join("\n") || "- none"}`,
  ].join("\n\n");
  const event = await summarize({ kind: "member", subjectId: memberId, memberId, requestId: null, records });
  if (event) await repo.recordAiEvent(event);
  revalidatePath(`/command/members/${memberId}`);
}

/* -------------------------------- Members -------------------------------- */

export async function activateMembershipAction(form: FormData): Promise<void> {
  const identity = await requireStaff();
  const memberId = uuid.parse(form.get("memberId"));
  const repo = await staffRepository(identity);
  await repo.activateMembership(memberId);
  await track("membership.activated", {}, identity.userId);
  revalidatePath(`/command/members/${memberId}`);
  revalidatePath("/command/members");
}

export async function assignOwnerAction(form: FormData): Promise<void> {
  const identity = await requireStaff();
  const memberId = uuid.parse(form.get("memberId"));
  const owner = String(form.get("ownerId") ?? "");
  const repo = await staffRepository(identity);
  await repo.assignRelationshipOwner(memberId, owner ? uuid.parse(owner) : null);
  revalidatePath(`/command/members/${memberId}`);
}

export async function addMemberPreferenceAction(_prev: FormState, form: FormData): Promise<FormState> {
  const identity = await requireStaff();
  const values = formToObject(form);
  const memberId = uuid.safeParse(values.memberId);
  const parsed = preferenceSchema.safeParse(values);
  if (!memberId.success || !parsed.success) {
    return { status: "error", fieldErrors: parsed.success ? {} : fieldErrors(parsed.error), values };
  }
  try {
    const repo = await staffRepository(identity);
    await repo.addPreferenceForMember(memberId.data, parsed.data);
  } catch (error) {
    return failure(error, values);
  }
  revalidatePath(`/command/members/${memberId.data}`);
  return { status: "success" };
}

/* ------------------------------ Applications ------------------------------ */

export async function decideApplicationAction(_prev: FormState, form: FormData): Promise<FormState> {
  const identity = await requireStaff();
  const values = formToObject(form);
  const parsed = applicationDecisionSchema.safeParse(values);
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrors(parsed.error), values };
  try {
    const repo = await staffRepository(identity);
    await repo.decideApplication(parsed.data.applicationId, parsed.data.status, parsed.data.note);
    await track("application.decided", { status: parsed.data.status }, identity.userId);
  } catch (error) {
    return failure(error, values);
  }
  revalidatePath("/command/applications");
  revalidatePath(`/command/applications/${parsed.data.applicationId}`);
  return {
    status: "success",
    message:
      parsed.data.status === "approved"
        ? dataMode() === "supabase"
          ? "Approved. When they sign in with this email, their membership will be created awaiting activation."
          : "Approved."
        : "Decision recorded.",
  };
}

/* -------------------------------- Providers ------------------------------- */

export async function createProviderAction(_prev: FormState, form: FormData): Promise<FormState> {
  const identity = await requireStaff();
  const values = formToObject(form);
  const parsed = providerSchema.safeParse(values);
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrors(parsed.error), values };
  let id: string;
  try {
    const repo = await staffRepository(identity);
    id = await repo.createProvider(parsed.data);
  } catch (error) {
    return failure(error, values);
  }
  revalidatePath("/command/providers");
  redirect(`/command/providers/${id}`);
}

export async function updateProviderStatusAction(form: FormData): Promise<void> {
  const identity = await requireStaff();
  const id = uuid.parse(form.get("providerId"));
  const status = z.enum(PROVIDER_STATUSES).parse(form.get("status"));
  const repo = await staffRepository(identity);
  await repo.updateProviderStatus(id, status);
  revalidatePath(`/command/providers/${id}`);
  revalidatePath("/command/providers");
}

/* ------------------------------ Demo controls ----------------------------- */

export async function resetDemoAction(): Promise<void> {
  await requireAdmin();
  if (dataMode() !== "demo") return;
  const { resetDemoStore } = await import("@/lib/demo/repository");
  resetDemoStore();
  revalidatePath("/", "layout");
}
