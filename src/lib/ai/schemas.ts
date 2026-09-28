import { z } from "zod";

/**
 * Structured outputs for Biluxr AI. The same schemas validate model output
 * (via the SDK's zod output format) and the demo heuristic, so staff UI can
 * rely on the shape regardless of source.
 */

export const intentSchema = z.object({
  title: z.string().describe("A short, calm title for the request, at most 8 words. No emoji."),
  category: z
    .string()
    .describe("The best matching category slug from the provided list, or 'other'."),
  priority: z.enum(["standard", "priority", "urgent"]).describe("urgent only if it must happen within hours."),
  summary: z.string().describe("One sentence restating the request for the concierge team."),
  location: z.string().nullable(),
  timing: z.string().nullable().describe("When, in plain words, exactly as specific as the member was."),
  startDate: z.string().nullable().describe("ISO date YYYY-MM-DD only if the member gave an explicit date."),
  partySize: z.number().int().nullable(),
  budget: z.string().nullable(),
  people: z.array(z.string()).describe("People mentioned by name or role."),
  constraints: z.array(z.string()).describe("Explicit requirements or things to avoid."),
  relevantPreferences: z
    .array(z.string())
    .describe("Known member preferences (from the list provided) that apply to this request."),
  missingInformation: z.array(z.string()).describe("What the concierge still needs to know to act well."),
  clarifyingQuestions: z
    .array(z.string())
    .describe("At most two questions for the member, in Biluxr's voice. Empty if none are needed."),
  confidence: z.number().describe("0 to 1: how confident you are in this reading."),
});
export type Intent = z.infer<typeof intentSchema>;

export const summarySchema = z.object({
  headline: z.string().describe("One line capturing the essential picture."),
  keyPoints: z.array(z.string()).describe("Three to six short factual points."),
  openItems: z.array(z.string()).describe("Things awaiting action, with who owns them."),
  watchOuts: z.array(z.string()).describe("Sensitivities, allergies, risks, or tone notes."),
});
export type Summary = z.infer<typeof summarySchema>;

export function parseIntent(value: unknown): Intent | null {
  const parsed = intentSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function parseSummary(value: unknown): Summary | null {
  const parsed = summarySchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}
