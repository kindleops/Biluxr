"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { analyzeRequest } from "@/lib/ai/intake";
import { track } from "@/lib/analytics";
import { requireMember } from "@/lib/auth/session";
import { memberRepository, publicRepository } from "@/lib/data";
import { DomainError, ForbiddenError, NotFoundError } from "@/lib/data/repository";
import { recordSystemAiEvent } from "@/lib/data/system";
import {
  cancelRequestSchema,
  fieldErrors,
  formToObject,
  invitationSchema,
  messageSchema,
  newRequestSchema,
  optionDecisionSchema,
  personSchema,
  preferenceSchema,
  profileUpdateSchema,
} from "@/lib/domain/schemas";
import type { FormState } from "@/lib/forms/state";

function failure(error: unknown, values?: Record<string, string>): FormState {
  if (error instanceof DomainError) return { status: "error", message: error.message, values };
  if (error instanceof NotFoundError) return { status: "error", message: "That could not be found.", values };
  if (error instanceof ForbiddenError) return { status: "error", message: "That is not available to you.", values };
  console.error(error);
  return { status: "error", message: "Something went wrong on our side. Please try again.", values };
}

export async function createRequestAction(_prev: FormState, form: FormData): Promise<FormState> {
  const identity = await requireMember();
  const values = formToObject(form);
  const parsed = newRequestSchema.safeParse({
    ...values,
    priority: values.timeSensitive === "on" ? "urgent" : "standard",
    journeyId: values.journeyId || null,
  });
  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrors(parsed.error), message: "Tell us a little more.", values };
  }
  let requestId: string;
  try {
    const repo = await memberRepository(identity);
    const request = await repo.createRequest(parsed.data);
    requestId = request.id;

    // Biluxr AI reads the request after the response is sent; its output is
    // logged for staff review and never shown to the member directly.
    after(async () => {
      try {
        const [bundle, pub] = await Promise.all([repo.profile(), publicRepository()]);
        const categories = pub ? await pub.listCategories() : [];
        const event = await analyzeRequest({
          request,
          member: bundle.profile,
          preferences: bundle.preferences,
          categories,
        });
        if (event) await recordSystemAiEvent(event);
      } catch (error) {
        console.error("request analysis failed", error);
      }
    });
    await track("request.created", { priority: parsed.data.priority }, identity.userId);
  } catch (error) {
    return failure(error, values);
  }
  revalidatePath("/app", "layout");
  redirect(`/app/concierge/${requestId}?new=1`);
}

export async function postMessageAction(_prev: FormState, form: FormData): Promise<FormState> {
  const identity = await requireMember();
  const values = formToObject(form);
  const parsed = messageSchema.safeParse(values);
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrors(parsed.error), values };
  try {
    const repo = await memberRepository(identity);
    await repo.postMessage(parsed.data.requestId, parsed.data.body);
  } catch (error) {
    return failure(error, values);
  }
  revalidatePath(`/app/concierge/${parsed.data.requestId}`);
  return { status: "success" };
}

export async function respondToOptionAction(_prev: FormState, form: FormData): Promise<FormState> {
  const identity = await requireMember();
  const parsed = optionDecisionSchema.safeParse(formToObject(form));
  if (!parsed.success) return { status: "error", message: "Please try again." };
  try {
    const repo = await memberRepository(identity);
    await repo.respondToOption(parsed.data.optionId, parsed.data.decision);
    await track(parsed.data.decision === "accept" ? "option.accepted" : "option.declined", {}, identity.userId);
  } catch (error) {
    return failure(error);
  }
  revalidatePath(`/app/concierge/${parsed.data.requestId}`);
  revalidatePath("/app");
  return {
    status: "success",
    message:
      parsed.data.decision === "accept"
        ? "Your choice is with your concierge, who will confirm it with the provider."
        : "Noted. We will take that into account.",
  };
}

export async function cancelRequestAction(_prev: FormState, form: FormData): Promise<FormState> {
  const identity = await requireMember();
  const parsed = cancelRequestSchema.safeParse(formToObject(form));
  if (!parsed.success) return { status: "error", message: "Please try again." };
  try {
    const repo = await memberRepository(identity);
    await repo.cancelRequest(parsed.data.requestId, parsed.data.reason);
    await track("request.cancelled", {}, identity.userId);
  } catch (error) {
    return failure(error);
  }
  revalidatePath("/app", "layout");
  return { status: "success" };
}

export async function issueInvitationAction(_prev: FormState, form: FormData): Promise<FormState> {
  const identity = await requireMember();
  const values = formToObject(form);
  const parsed = invitationSchema.safeParse(values);
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrors(parsed.error), values };
  try {
    const repo = await memberRepository(identity);
    const { code } = await repo.issueInvitation(parsed.data.email, parsed.data.name);
    await track("invitation.issued", {}, identity.userId);
    revalidatePath("/app/access");
    return { status: "success", values: { code, name: parsed.data.name } };
  } catch (error) {
    return failure(error, values);
  }
}

export async function updateProfileAction(_prev: FormState, form: FormData): Promise<FormState> {
  const identity = await requireMember();
  const values = formToObject(form);
  const parsed = profileUpdateSchema.safeParse(values);
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrors(parsed.error), values };
  try {
    const repo = await memberRepository(identity);
    await repo.updateProfile(parsed.data);
  } catch (error) {
    return failure(error, values);
  }
  revalidatePath("/app", "layout");
  return { status: "success", message: "Saved." };
}

export async function addPreferenceAction(_prev: FormState, form: FormData): Promise<FormState> {
  const identity = await requireMember();
  const values = formToObject(form);
  const parsed = preferenceSchema.safeParse(values);
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrors(parsed.error), values };
  try {
    const repo = await memberRepository(identity);
    await repo.addPreference(parsed.data);
  } catch (error) {
    return failure(error, values);
  }
  revalidatePath("/app/profile");
  return { status: "success" };
}

export async function removePreferenceAction(form: FormData): Promise<void> {
  const identity = await requireMember();
  const id = String(form.get("id") ?? "");
  const repo = await memberRepository(identity);
  await repo.removePreference(id);
  revalidatePath("/app/profile");
}

export async function addPersonAction(_prev: FormState, form: FormData): Promise<FormState> {
  const identity = await requireMember();
  const values = formToObject(form);
  const parsed = personSchema.safeParse(values);
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrors(parsed.error), values };
  try {
    const repo = await memberRepository(identity);
    await repo.addPerson(parsed.data);
  } catch (error) {
    return failure(error, values);
  }
  revalidatePath("/app/profile");
  return { status: "success" };
}

export async function removePersonAction(form: FormData): Promise<void> {
  const identity = await requireMember();
  const id = String(form.get("id") ?? "");
  const repo = await memberRepository(identity);
  await repo.removePerson(id);
  revalidatePath("/app/profile");
}
