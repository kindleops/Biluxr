import { analyzeRequestAction, applyIntentAction, dismissAiEventAction, summarizeRequestAction } from "@/app/command/actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/field";
import { parseIntent, parseSummary } from "@/lib/ai/schemas";
import type { AiEvent, RequestCategory, ServiceRequest } from "@/lib/domain/types";
import { formatRelative } from "@/lib/format";
import { ClarifyingQuestion } from "./request-tools";

const REVIEW_LABEL: Record<AiEvent["status"], string> = {
  proposed: "Awaiting review",
  accepted: "Accepted",
  edited: "Accepted with edits",
  dismissed: "Dismissed",
  failed: "Failed",
};

function Source({ event }: { event: AiEvent }) {
  return (
    <p className="text-caption text-bone-600">
      {event.model === "demo-heuristic" ? "Demo heuristic (not a model)" : event.model} · {event.promptVersion} · {formatRelative(event.createdAt)}
      {event.latencyMs !== null ? ` · ${(event.latencyMs / 1000).toFixed(1)}s` : ""}
    </p>
  );
}

/**
 * Biluxr AI, as staff see it: suggestions with provenance, applied only by a
 * person. Nothing here is visible to members.
 */
export function AiPanel({
  request,
  events,
  categories,
  canAnalyze,
  canSummarize,
}: {
  request: ServiceRequest;
  events: AiEvent[];
  categories: Pick<RequestCategory, "slug" | "name">[];
  canAnalyze: boolean;
  canSummarize: boolean;
}) {
  const path = `/command/requests/${request.id}`;
  const intentEvent = events.find((e) => e.kind === "intent_extraction");
  const intent = intentEvent ? parseIntent(intentEvent.output) : null;
  const summaryEvent = events.find((e) => e.kind === "summary" && e.status !== "dismissed" && e.status !== "failed");
  const summary = summaryEvent ? parseSummary(summaryEvent.output) : null;
  const categoryName = (slug: string) => categories.find((c) => c.slug === slug)?.name ?? slug;

  return (
    <div className="grid gap-5">
      {!intentEvent && (
        <div className="grid gap-3">
          <p className="text-body-sm text-bone-400">No reading of this request yet.</p>
          {canAnalyze ? (
            <form action={analyzeRequestAction}>
              <input type="hidden" name="requestId" value={request.id} />
              <Button type="submit" size="sm" variant="secondary">
                Read this request
              </Button>
            </form>
          ) : (
            <p className="text-caption text-bone-500">Biluxr AI is not configured (ANTHROPIC_API_KEY).</p>
          )}
        </div>
      )}

      {intentEvent && intentEvent.status === "failed" && (
        <div className="grid gap-2">
          <p className="text-body-sm text-status-clay">The last reading failed: {intentEvent.error}</p>
          <Source event={intentEvent} />
          {canAnalyze && (
            <form action={analyzeRequestAction}>
              <input type="hidden" name="requestId" value={request.id} />
              <Button type="submit" size="sm" variant="ghost">
                Try again
              </Button>
            </form>
          )}
        </div>
      )}

      {intentEvent && intent && (
        <div className="grid gap-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-caption text-bone-300">{REVIEW_LABEL[intentEvent.status]}</p>
            <p className="font-mono text-caption text-bone-500">confidence {Math.round(intent.confidence * 100)}%</p>
          </div>
          <p className="text-body-sm text-bone-200">{intent.summary}</p>
          <dl className="grid grid-cols-[6.5rem_1fr] gap-x-3 gap-y-1.5 text-caption">
            {(
              [
                ["When", intent.timing],
                ["Where", intent.location],
                ["Party", intent.partySize?.toString() ?? null],
                ["Budget", intent.budget],
                ["People", intent.people.join(", ") || null],
              ] as const
            )
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="text-bone-500">{k}</dt>
                  <dd className="text-bone-200">{v}</dd>
                </div>
              ))}
          </dl>
          {intent.constraints.length > 0 && (
            <div>
              <p className="text-caption text-bone-500">Constraints</p>
              <ul className="mt-1 list-disc pl-4 text-caption text-bone-300">
                {intent.constraints.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
          )}
          {intent.relevantPreferences.length > 0 && (
            <div>
              <p className="text-caption text-bone-500">Preferences that apply</p>
              <ul className="mt-1 list-disc pl-4 text-caption text-bone-300">
                {intent.relevantPreferences.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
          )}
          {intent.missingInformation.length > 0 && (
            <div>
              <p className="text-caption text-bone-500">Still unknown</p>
              <p className="mt-1 text-caption text-bone-300">{intent.missingInformation.join(" · ")}</p>
            </div>
          )}

          {intentEvent.status === "proposed" && (
            <>
              <form action={applyIntentAction} className="grid gap-2 rounded-md bg-white/[0.025] p-3">
                <input type="hidden" name="requestId" value={request.id} />
                <input type="hidden" name="eventId" value={intentEvent.id} />
                <p className="text-caption text-bone-400">Apply to the request (internal fields only)</p>
                <Checkbox name="applyTitle" defaultChecked={intent.title !== request.title} label={<>Title: <span className="text-bone-100">{intent.title}</span></>} />
                <Checkbox
                  name="applyCategory"
                  defaultChecked={intent.category !== request.categorySlug && intent.category !== "other"}
                  label={<>Category: <span className="text-bone-100">{categoryName(intent.category)}</span></>}
                />
                <Checkbox name="applyPriority" defaultChecked={false} label={<>Priority: <span className="text-bone-100">{intent.priority}</span></>} />
                {intent.partySize && <Checkbox name="applyParty" defaultChecked={!request.partySize} label={<>Party: <span className="text-bone-100">{intent.partySize}</span></>} />}
                {intent.location && <Checkbox name="applyLocation" defaultChecked={!request.location} label={<>Location: <span className="text-bone-100">{intent.location}</span></>} />}
                <div className="mt-1 flex gap-2">
                  <Button type="submit" size="sm" variant="secondary">
                    Apply selected
                  </Button>
                </div>
              </form>
              {intent.clarifyingQuestions.length > 0 && (
                <div className="grid gap-3">
                  <p className="text-caption text-bone-400">Suggested questions for the member</p>
                  {intent.clarifyingQuestions.map((q) => (
                    <ClarifyingQuestion key={q} requestId={request.id} eventId={intentEvent.id} question={q} />
                  ))}
                </div>
              )}
              <form action={dismissAiEventAction}>
                <input type="hidden" name="eventId" value={intentEvent.id} />
                <input type="hidden" name="path" value={path} />
                <button type="submit" className="text-caption text-bone-500 underline decoration-white/20 underline-offset-4 hover:text-bone-200">
                  Dismiss suggestion
                </button>
              </form>
            </>
          )}
          <Source event={intentEvent} />
        </div>
      )}

      <div className="border-t border-white/[0.05] pt-4">
        {summary && summaryEvent ? (
          <div className="grid gap-2">
            <p className="text-caption text-bone-500">Handoff summary</p>
            <p className="text-body-sm text-bone-100">{summary.headline}</p>
            <ul className="list-disc pl-4 text-caption text-bone-300">
              {summary.keyPoints.map((k) => (
                <li key={k}>{k}</li>
              ))}
            </ul>
            {summary.watchOuts.length > 0 && <p className="text-caption text-status-amber">Watch: {summary.watchOuts.join(" · ")}</p>}
            <Source event={summaryEvent} />
          </div>
        ) : canSummarize ? (
          <form action={summarizeRequestAction}>
            <input type="hidden" name="requestId" value={request.id} />
            <Button type="submit" size="sm" variant="ghost">
              Summarize for handoff
            </Button>
          </form>
        ) : (
          <p className="text-caption text-bone-600">Handoff summaries need Biluxr AI (ANTHROPIC_API_KEY).</p>
        )}
      </div>
    </div>
  );
}
