"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { DEMO_PERSONA_COOKIE, homeFor } from "@/lib/auth/session";
import { demoPersonaSchema } from "@/lib/demo/personas";
import { fieldErrors, formToObject, signInSchema } from "@/lib/domain/schemas";
import { dataMode, env } from "@/lib/env";
import type { FormState } from "@/lib/forms/state";
import { rateLimit } from "@/lib/rate-limit";

function safeNext(next: string | undefined): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return null;
  return next.startsWith("/app") || next.startsWith("/command") ? next : null;
}

/**
 * Email sign-in via single-use link. The response is identical whether or not
 * the address belongs to a member, so the form cannot be used to discover who
 * is a member. New accounts are only created for approved applicants.
 */
export async function requestSignInLink(_prev: FormState, form: FormData): Promise<FormState> {
  const values = formToObject(form);
  const parsed = signInSchema.safeParse(values);
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrors(parsed.error), values };
  if (dataMode() !== "supabase") {
    return { status: "error", message: "Member sign-in is not available yet.", values };
  }
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!rateLimit(`signin:${ip}`, 6) || !rateLimit(`signin:${parsed.data.email}`, 3)) {
    return { status: "error", message: "Too many attempts. Please wait a few minutes and try again.", values };
  }

  const { supabaseAdmin, supabaseServer } = await import("@/lib/supabase/server");
  const admin = supabaseAdmin();
  let mayCreate = false;
  if (admin) {
    const { data } = await admin
      .from("applications")
      .select("id")
      .ilike("email", parsed.data.email)
      .eq("status", "approved")
      .limit(1);
    mayCreate = Boolean(data && data.length > 0);
  }

  const db = await supabaseServer();
  const next = safeNext(parsed.data.next) ?? "";
  const redirectTo = `${env.siteUrl()}/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ""}`;
  const { error } = await db.auth.signInWithOtp({
    email: parsed.data.email,
    options: { shouldCreateUser: mayCreate, emailRedirectTo: redirectTo },
  });
  // "Signups not allowed" for unknown addresses is expected; do not reveal it.
  if (error && !/signups? not allowed|not found/i.test(error.message)) {
    console.error("sign-in link failed", error.message);
    return { status: "error", message: "We could not send a link just now. Please try again shortly.", values };
  }
  return { status: "success", values: { email: parsed.data.email } };
}

/** Demo only: choose a fictional persona. Refuses outside demo mode. */
export async function chooseDemoPersona(form: FormData): Promise<void> {
  if (dataMode() !== "demo") redirect("/login");
  const parsed = demoPersonaSchema.safeParse(form.get("persona"));
  if (!parsed.success) redirect("/login");
  const store = await cookies();
  store.set(DEMO_PERSONA_COOKIE, parsed.data, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  const next = safeNext(String(form.get("next") ?? ""));
  redirect(next ?? homeFor(parsed.data));
}
