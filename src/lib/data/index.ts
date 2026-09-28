import "server-only";
import { cache } from "react";
import { dataMode } from "@/lib/env";
import type { Identity } from "@/lib/auth/session";
import type { MemberRepository, PublicRepository, StaffRepository } from "./repository";

/**
 * Repository factory. Returns the implementation for the configured data
 * mode, or null when no backend is available (callers render an honest
 * "not yet available" state).
 */

export const publicRepository = cache(async (): Promise<PublicRepository | null> => {
  const mode = dataMode();
  if (mode === "supabase") {
    const { supabaseServer } = await import("@/lib/supabase/server");
    const { SupabasePublicRepository } = await import("@/lib/supabase/repository");
    return new SupabasePublicRepository(await supabaseServer());
  }
  if (mode === "demo") {
    const { DemoPublicRepository } = await import("@/lib/demo/repository");
    return new DemoPublicRepository();
  }
  return null;
});

export async function memberRepository(identity: Identity): Promise<MemberRepository> {
  if (identity.mode === "supabase") {
    const { supabaseServer } = await import("@/lib/supabase/server");
    const { SupabaseMemberRepository } = await import("@/lib/supabase/repository");
    return new SupabaseMemberRepository(await supabaseServer(), identity.userId);
  }
  const { DemoMemberRepository } = await import("@/lib/demo/repository");
  return new DemoMemberRepository(identity.userId);
}

export async function staffRepository(identity: Identity): Promise<StaffRepository> {
  if (identity.mode === "supabase") {
    const { supabaseServer } = await import("@/lib/supabase/server");
    const { SupabaseStaffRepository } = await import("@/lib/supabase/repository");
    return new SupabaseStaffRepository(await supabaseServer(), identity.userId);
  }
  const { DemoStaffRepository } = await import("@/lib/demo/repository");
  return new DemoStaffRepository(identity.userId);
}
