# Biluxr AI

Biluxr's intelligence serves the concierge; it never speaks to members on its
own. Every output is a _proposal_ logged to `ai_events` and reviewed by a
person in Command.

## Capabilities

| Capability            | Trigger                                                                                                              | Output                                                                                                                                                                                         | Human step                                                                                    |
| --------------------- | -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| **Intent extraction** | Automatically after a member sends a request (`after()` — the member never waits), or "Read this request" in Command | Title, category, priority, one-line summary, timing, location, party size, budget, people, constraints, applicable known preferences, missing information, ≤2 clarifying questions, confidence | Staff tick which fields to apply (title/category/priority/party/location) → event `accepted`  |
| **Clarification**     | Part of intent output                                                                                                | Member-facing questions in Biluxr's voice                                                                                                                                                      | Staff send as-is (`accepted`) or edit first (`edited`); request moves to _A question for you_ |
| **Summaries**         | "Summarize for handoff" (request) / "Draft briefing" (member 360)                                                    | Headline, key points, open items, watch-outs                                                                                                                                                   | Read-only briefing labelled with model and time; dismissable                                  |

## Implementation

- `src/lib/ai/service.ts` — the only module that calls Claude. Uses
  `client.beta.messages.parse` with a zod output format, adaptive thinking,
  `effort: low` (intent) / `medium` (summaries), and server-side refusal
  fallbacks (`fallbacks: "default"`, beta `server-side-fallback-2026-07-01`).
  Handles `refusal` / `max_tokens` stop reasons and typed SDK errors; never
  throws — failures are logged as `failed` events.
- Model: `claude-opus-5` by default; override with `BILUXR_AI_MODEL`.
- `src/lib/ai/prompts.ts` — versioned prompts (`intent.v1`, `summary.v1`).
  Member text is fenced in `<member_request>` tags and the system prompt treats
  it as data (prompt-injection resistance; unit-tested).
- `src/lib/ai/schemas.ts` — zod schemas shared by model output and the UI;
  malformed output is rejected rather than rendered.
- `src/lib/ai/intake.ts` — orchestration; returns an `AiEventInput`.
- Logging: member-initiated analyses are written with the service role
  (`recordSystemAiEvent`) because members must never be able to write AI
  records. Staff-initiated ones are written under the staff session (RLS).
- Every event stores model, prompt version, output, latency, token usage,
  error and review outcome (`proposed → accepted | edited | dismissed | failed`).
  Command → Analytics shows counts by outcome.

## Without an API key

- **Supabase (production) mode:** no suggestion is produced and the panel says
  Biluxr AI is not configured. Nothing is faked.
- **Demo mode:** a deterministic rules-based reader (`heuristic.ts`) produces
  low-confidence readings so the review workflow can be exercised. Its events
  are labelled `demo-heuristic` and shown as "Demo heuristic (not a model)".
  Summaries remain unavailable.

## Privacy

Request text is sent to Anthropic's API to produce suggestions. The privacy
draft states this and that API inputs are not used to train models under
Anthropic's commercial terms. No member PII is placed in analytics.
