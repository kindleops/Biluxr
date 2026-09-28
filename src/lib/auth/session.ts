import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { dataMode, type DataMode } from "@/lib/env";
import type { Role, UUID } from "@/lib/domain/types";
import { STAFF_ROLES } from "@/lib/domain/types";

export const DEMO_PERSONA_COOKIE = "biluxr_demo_persona";

export interface Identity {
  userId: UUID;
  role: Role;
  mode: Exclude<DataMode, "unavailable">;
}

/** The signed-in identity for this request, or null. Memoized per request. */
export const currentIdentity = cache(async (): Promise<Identity | null> => {
  const mode = dataMode();
  if (mode === "supabase") {
    const { supabaseServer } = await import("@/lib/supabase/server");
    const db = await supabaseServer();
    const {
      data: { user },
    } = await db.auth.getUser();
    if (!user) return null;
    const { data } = await db.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (!data) return null;
    return { userId: user.id, role: data.role, mode };
  }
  if (mode === "demo") {
    const { DEMO_PERSONAS, demoPersonaSchema } = await import("@/lib/demo/personas");
    const store = await cookies();
    const parsed = demoPersonaSchema.safeParse(store.get(DEMO_PERSONA_COOKIE)?.value);
    if (!parsed.success) return null;
    const persona = DEMO_PERSONAS[parsed.data];
    const { demoStore } = await import("@/lib/demo/repository");
    const profile = demoStore().profiles.find((p) => p.id === persona.id);
    if (!profile) return null;
    return { userId: profile.id, role: profile.role, mode };
  }
  return null;
});

export function isStaffRole(role: Role): boolean {
  return STAFF_ROLES.includes(role);
}

export function homeFor(role: Role): string {
  if (isStaffRole(role)) return "/command";
  if (role === "member") return "/app";
  return "/login?state=pending";
}

export async function requireMember(next = "/app"): Promise<Identity> {
  const identity = await currentIdentity();
  if (!identity) redirect(`/login?next=${encodeURIComponent(next)}`);
  if (identity.role !== "member") redirect(homeFor(identity.role));
  return identity;
}

export async function requireStaff(next = "/command"): Promise<Identity> {
  const identity = await currentIdentity();
  if (!identity) redirect(`/login?next=${encodeURIComponent(next)}`);
  if (!isStaffRole(identity.role)) redirect(homeFor(identity.role));
  return identity;
}

export async function requireAdmin(): Promise<Identity> {
  const identity = await requireStaff();
  if (identity.role !== "admin") redirect("/command");
  return identity;
}
