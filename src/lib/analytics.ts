import "server-only";
import { createHash } from "node:crypto";
import { dataMode, env } from "@/lib/env";

/**
 * Privacy-conscious product analytics. Events carry a name and a few
 * non-identifying properties. The subject (if any) is a salted SHA-256 of the
 * user id — never an email, name, IP address or request text. Without a
 * configured salt and service role, events are dropped rather than stored
 * insecurely.
 */
export type AnalyticsEvent =
  | "application.submitted"
  | "partner_application.submitted"
  | "contact.submitted"
  | "request.created"
  | "option.accepted"
  | "option.declined"
  | "request.cancelled"
  | "invitation.issued"
  | "application.decided"
  | "membership.activated"
  | "ai.reviewed";

const SAFE_VALUE = /^[a-z0-9_.:-]{1,64}$/i;

export async function track(
  name: AnalyticsEvent,
  properties: Record<string, string | number | boolean> = {},
  subjectId?: string,
): Promise<void> {
  if (dataMode() !== "supabase") return;
  const salt = env.analyticsSalt();
  const { supabaseAdmin } = await import("@/lib/supabase/server");
  const admin = supabaseAdmin();
  if (!admin) return;
  const safe: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(properties)) {
    if (typeof v !== "string" || SAFE_VALUE.test(v)) safe[k] = v;
  }
  const subject = subjectId && salt ? createHash("sha256").update(`${salt}:${subjectId}`).digest("hex") : null;
  await admin.from("analytics_events").insert({ name, properties: safe, subject });
}
