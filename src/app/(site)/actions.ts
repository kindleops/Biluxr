"use server";

import { headers } from "next/headers";
import { track } from "@/lib/analytics";
import { publicRepository } from "@/lib/data";
import {
  applicationSchema,
  contactSchema,
  fieldErrors,
  formToObject,
  partnerApplicationSchema,
} from "@/lib/domain/schemas";
import type { FormState } from "@/lib/forms/state";
import { rateLimit } from "@/lib/rate-limit";

const UNAVAILABLE =
  "Online submissions are not open yet. Please write to us instead — we read everything.";

async function clientKey(scope: string): Promise<string> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? "unknown";
  return `${scope}:${ip}`;
}

/** Honeypot: a visually hidden field real people never fill. */
function isBot(form: FormData): boolean {
  return (
    typeof form.get("company_website") === "string" &&
    String(form.get("company_website")).length > 0
  );
}

export async function submitApplicationAction(
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  const values = formToObject(form);
  if (isBot(form)) return { status: "success" };
  if (!rateLimit(await clientKey("apply"), 4)) {
    return {
      status: "error",
      message: "Too many attempts. Please try again a little later.",
      values,
    };
  }
  const parsed = applicationSchema.safeParse(values);
  if (!parsed.success) {
    return {
      status: "error",
      message: "A few details need attention.",
      fieldErrors: fieldErrors(parsed.error),
      values,
    };
  }
  const repo = await publicRepository();
  if (!repo) return { status: "error", message: UNAVAILABLE, values };
  try {
    await repo.submitApplication(parsed.data);
    await track("application.submitted", {
      market: parsed.data.marketSlug ?? "unspecified",
      invited: Boolean(parsed.data.invitationCode),
    });
    return { status: "success" };
  } catch (error) {
    console.error("application submit failed", error);
    return {
      status: "error",
      message: "We could not submit your application just now. Please try again.",
      values,
    };
  }
}

export async function submitPartnerAction(_prev: FormState, form: FormData): Promise<FormState> {
  const values = formToObject(form);
  if (isBot(form)) return { status: "success" };
  if (!rateLimit(await clientKey("partner"), 4)) {
    return {
      status: "error",
      message: "Too many attempts. Please try again a little later.",
      values,
    };
  }
  const parsed = partnerApplicationSchema.safeParse(values);
  if (!parsed.success) {
    return {
      status: "error",
      message: "A few details need attention.",
      fieldErrors: fieldErrors(parsed.error),
      values,
    };
  }
  const repo = await publicRepository();
  if (!repo) return { status: "error", message: UNAVAILABLE, values };
  try {
    await repo.submitPartnerApplication(parsed.data);
    await track("partner_application.submitted", {
      category: parsed.data.categorySlug ?? "unspecified",
    });
    return { status: "success" };
  } catch (error) {
    console.error("partner submit failed", error);
    return {
      status: "error",
      message: "We could not send this just now. Please try again.",
      values,
    };
  }
}

export async function submitContactAction(_prev: FormState, form: FormData): Promise<FormState> {
  const values = formToObject(form);
  if (isBot(form)) return { status: "success" };
  if (!rateLimit(await clientKey("contact"), 6)) {
    return {
      status: "error",
      message: "Too many attempts. Please try again a little later.",
      values,
    };
  }
  const parsed = contactSchema.safeParse(values);
  if (!parsed.success) {
    return {
      status: "error",
      message: "A few details need attention.",
      fieldErrors: fieldErrors(parsed.error),
      values,
    };
  }
  const repo = await publicRepository();
  if (!repo) return { status: "error", message: UNAVAILABLE, values };
  try {
    await repo.submitContact(parsed.data);
    await track("contact.submitted", { topic: parsed.data.topic });
    return { status: "success" };
  } catch (error) {
    console.error("contact submit failed", error);
    return {
      status: "error",
      message: "We could not send this just now. Please try again.",
      values,
    };
  }
}
