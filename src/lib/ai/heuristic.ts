import { deriveTitle } from "@/lib/domain/requests";
import type { Intent } from "./schemas";

/**
 * DEMO ONLY. A deterministic, rules-based reading used when demo mode runs
 * without an Anthropic key, so the review workflow can be exercised. Events it
 * produces are labelled model = "demo-heuristic" and are never presented as
 * model output. Not used in Supabase (production) mode.
 */

const NUMBER_WORDS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  twelve: 12,
};

const CATEGORY_HINTS: [string, RegExp][] = [
  ["aviation", /\b(jet|charter|flight crew|private flight|aircraft|tail)\b/i],
  ["dining", /\b(dinner|lunch|breakfast|table|restaurant|chef|tasting)\b/i],
  ["stays", /\b(hotel|villa|chalet|suite|stay|room|apartment)\b/i],
  ["ground", /\b(car|driver|chauffeur|pickup|pick-up|transfer)\b/i],
  ["gifting", /\b(gift|present|flowers|birthday)\b/i],
  ["access", /\b(tickets?|premiere|opening|show|concert|match|gala|guest ?list)\b/i],
  ["wellness", /\b(spa|massage|trainer|retreat|doctor|clinic)\b/i],
  ["travel", /\b(trip|travel|itinerary|flight|fly|yacht)\b/i],
];

export function heuristicIntent(brief: string, categories: string[]): Intent {
  const text = brief.trim();
  const category =
    CATEGORY_HINTS.find(([slug, re]) => categories.includes(slug) && re.test(text))?.[0] ?? "other";
  const partyMatch = text.match(
    /\bfor (\d{1,3}|one|two|three|four|five|six|seven|eight|nine|ten|twelve)\b/i,
  );
  const partySize = partyMatch?.[1]
    ? Number.isNaN(Number(partyMatch[1]))
      ? (NUMBER_WORDS[partyMatch[1].toLowerCase()] ?? null)
      : Number(partyMatch[1])
    : null;
  const urgent = /\b(asap|urgent|tonight|right now|within the hour|today)\b/i.test(text);
  const timing =
    text.match(
      /\b(tonight|tomorrow|this (?:week|weekend)|next (?:week|weekend|month|monday|tuesday|wednesday|thursday|friday|saturday|sunday)|(?:mon|tues|wednes|thurs|fri|satur|sun)day)\b/i,
    )?.[0] ?? null;
  const location =
    text.match(/\b(?:in|to|at) ((?:[A-Z][a-zà-ÿ]+)(?: [A-Z][a-zà-ÿ]+)?)/)?.[1] ?? null;
  const firstSentence = text.split(/(?<=[.!?])\s/)[0] ?? text;

  const missing: string[] = [];
  if (!timing) missing.push("Timing");
  if (!partySize && ["dining", "stays", "aviation", "travel"].includes(category))
    missing.push("Number of people");

  return {
    title: deriveTitle(text),
    category,
    priority: urgent ? "urgent" : "standard",
    summary: firstSentence,
    location,
    timing,
    startDate: null,
    partySize,
    budget: text.match(/(?:\$|€|£)\s?\d[\d,.]*\s?[kKmM]?/)?.[0] ?? null,
    people: [],
    constraints: [],
    relevantPreferences: [],
    missingInformation: missing,
    clarifyingQuestions: missing.includes("Timing") ? ["When would you like this to happen?"] : [],
    confidence: 0.35,
  };
}
