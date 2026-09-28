import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod";
import { env } from "@/lib/env";

/**
 * Thin, typed boundary around the Claude API. Every call:
 *  - uses structured outputs validated by zod,
 *  - opts into server-side refusal fallbacks,
 *  - reports latency and token usage for the AI event log,
 *  - never throws: failures come back as { ok: false } so the product degrades
 *    to "no suggestion" rather than an error page.
 */

export type AiRun<T> =
  | {
      ok: true;
      output: T;
      model: string;
      latencyMs: number;
      inputTokens: number | null;
      outputTokens: number | null;
    }
  | { ok: false; error: string; model: string; latencyMs: number };

let cached: Anthropic | null = null;

function client(): Anthropic | null {
  const apiKey = env.anthropicApiKey();
  if (!apiKey) return null;
  if (!cached) cached = new Anthropic({ apiKey, maxRetries: 2, timeout: 90_000 });
  return cached;
}

export function aiAvailable(): boolean {
  return Boolean(env.anthropicApiKey());
}

export async function runStructured<S extends z.ZodType>(opts: {
  schema: S;
  system: string;
  user: string;
  effort?: "low" | "medium" | "high";
}): Promise<AiRun<z.infer<S>>> {
  const model = env.aiModel();
  const started = Date.now();
  const anthropic = client();
  if (!anthropic)
    return { ok: false, error: "ANTHROPIC_API_KEY is not configured", model, latencyMs: 0 };

  try {
    const response = await anthropic.beta.messages.parse({
      model,
      max_tokens: 8000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      thinking: { type: "adaptive" },
      output_config: { effort: opts.effort ?? "low", format: betaZodOutputFormat(opts.schema) },
      system: opts.system,
      messages: [{ role: "user", content: opts.user }],
    });
    const latencyMs = Date.now() - started;
    if (response.stop_reason === "refusal") {
      return {
        ok: false,
        error: "The model declined this request.",
        model: response.model,
        latencyMs,
      };
    }
    if (response.stop_reason === "max_tokens" || response.parsed_output == null) {
      return {
        ok: false,
        error: `No structured output (stop reason: ${response.stop_reason})`,
        model: response.model,
        latencyMs,
      };
    }
    return {
      ok: true,
      output: response.parsed_output as z.infer<S>,
      model: response.model,
      latencyMs,
      inputTokens: response.usage.input_tokens ?? null,
      outputTokens: response.usage.output_tokens ?? null,
    };
  } catch (error) {
    const latencyMs = Date.now() - started;
    let message = "Unexpected error";
    if (error instanceof Anthropic.RateLimitError) message = "Rate limited by the model provider";
    else if (error instanceof Anthropic.AuthenticationError)
      message = "Model provider rejected the API key";
    else if (error instanceof Anthropic.BadRequestError) message = `Bad request: ${error.message}`;
    else if (error instanceof Anthropic.APIConnectionError)
      message = "Could not reach the model provider";
    else if (error instanceof Anthropic.APIError)
      message = `Model provider error (${error.status ?? "unknown"})`;
    else if (error instanceof Error) message = error.message;
    return { ok: false, error: message, model, latencyMs };
  }
}
