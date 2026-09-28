import "server-only";
import type { AiEventInput } from "@/lib/data/repository";
import type {
  MemberPreference,
  Profile,
  RequestCategory,
  ServiceRequest,
} from "@/lib/domain/types";
import { dataMode } from "@/lib/env";
import { heuristicIntent } from "./heuristic";
import {
  INTENT_PROMPT_VERSION,
  INTENT_SYSTEM,
  SUMMARY_PROMPT_VERSION,
  SUMMARY_SYSTEM,
  intentUserPrompt,
} from "./prompts";
import { intentSchema, summarySchema } from "./schemas";
import { aiAvailable, runStructured } from "./service";

/**
 * Biluxr AI orchestration. Nothing here writes to the member-facing record:
 * outputs are logged as `proposed` AI events and surface only in Command,
 * where a person accepts, edits or dismisses them.
 */

export async function analyzeRequest(input: {
  request: ServiceRequest;
  member: Pick<Profile, "id" | "fullName" | "preferredName" | "timezone">;
  preferences: Pick<MemberPreference, "label" | "value">[];
  categories: Pick<RequestCategory, "slug" | "name">[];
}): Promise<AiEventInput | null> {
  const base = {
    kind: "intent_extraction" as const,
    requestId: input.request.id,
    memberId: input.member.id,
    promptVersion: INTENT_PROMPT_VERSION,
  };

  if (!aiAvailable()) {
    if (dataMode() !== "demo") return null; // Production without a key: no suggestion, no pretence.
    const started = Date.now();
    const output = heuristicIntent(
      input.request.brief,
      input.categories.map((c) => c.slug),
    );
    return {
      ...base,
      model: "demo-heuristic",
      output,
      status: "proposed",
      latencyMs: Date.now() - started,
      inputTokens: null,
      outputTokens: null,
      error: null,
    };
  }

  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: input.member.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "long",
  }).format(new Date());

  const run = await runStructured({
    schema: intentSchema,
    system: INTENT_SYSTEM,
    user: intentUserPrompt({
      brief: input.request.brief,
      memberName: input.member.preferredName ?? input.member.fullName,
      timezone: input.member.timezone,
      today,
      categories: input.categories,
      preferences: input.preferences,
    }),
  });

  if (!run.ok) {
    return {
      ...base,
      model: run.model,
      output: {},
      status: "failed",
      latencyMs: run.latencyMs,
      inputTokens: null,
      outputTokens: null,
      error: run.error,
    };
  }
  const clamped = {
    ...run.output,
    clarifyingQuestions: run.output.clarifyingQuestions.slice(0, 2),
    confidence: Math.max(0, Math.min(1, run.output.confidence)),
  };
  return {
    ...base,
    model: run.model,
    output: clamped,
    status: "proposed",
    latencyMs: run.latencyMs,
    inputTokens: run.inputTokens,
    outputTokens: run.outputTokens,
    error: null,
  };
}

export async function summarize(input: {
  kind: "member" | "request";
  subjectId: string;
  memberId: string;
  requestId: string | null;
  records: string;
}): Promise<AiEventInput | null> {
  if (!aiAvailable()) return null;
  const run = await runStructured({
    schema: summarySchema,
    system: SUMMARY_SYSTEM,
    user: `Prepare a ${input.kind === "member" ? "member briefing" : "request handoff summary"} from these records.\n\n<records>\n${input.records}\n</records>`,
    effort: "medium",
  });
  const base = {
    kind: "summary" as const,
    requestId: input.requestId,
    memberId: input.memberId,
    promptVersion: SUMMARY_PROMPT_VERSION,
  };
  if (!run.ok) {
    return {
      ...base,
      model: run.model,
      output: {},
      status: "failed",
      latencyMs: run.latencyMs,
      inputTokens: null,
      outputTokens: null,
      error: run.error,
    };
  }
  return {
    ...base,
    model: run.model,
    output: run.output,
    status: "proposed",
    latencyMs: run.latencyMs,
    inputTokens: run.inputTokens,
    outputTokens: run.outputTokens,
    error: null,
  };
}
