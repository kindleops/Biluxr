import "server-only";
import { dataMode } from "@/lib/env";
import type { AiEventInput } from "./repository";

/**
 * Trusted, server-only writes that must not run with the member's privileges
 * (e.g. logging an AI suggestion about a member's own request).
 */
export async function recordSystemAiEvent(input: AiEventInput): Promise<boolean> {
  const mode = dataMode();
  if (mode === "supabase") {
    const { recordAiEventAsSystem } = await import("@/lib/supabase/repository");
    return recordAiEventAsSystem(input);
  }
  if (mode === "demo") {
    const { demoStore } = await import("@/lib/demo/repository");
    demoStore().aiEvents.unshift({
      id: crypto.randomUUID(),
      ...input,
      reviewedBy: null,
      reviewedAt: null,
      createdAt: new Date().toISOString(),
    });
    return true;
  }
  return false;
}
