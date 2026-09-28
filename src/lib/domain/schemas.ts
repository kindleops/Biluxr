import { z } from "zod";
import {
  APPLICATION_STATUSES,
  PREFERENCE_DOMAINS,
  PROVIDER_STATUSES,
  REQUEST_PRIORITIES,
  REQUEST_STATUSES,
  VERTICALS,
} from "./types";

// Human, calm validation copy instead of zod's technical defaults.
z.config({
  customError: (issue) => {
    if (issue.code === "too_small" && issue.origin === "string") {
      return Number(issue.minimum) <= 1 ? "Required." : "Please add a little more detail.";
    }
    if (issue.code === "too_big" && issue.origin === "string")
      return "That is a little long — please shorten it.";
    if (issue.code === "invalid_type" && issue.input === undefined) return "Required.";
    if (issue.code === "invalid_value") return "Please choose one of the options.";
    return undefined;
  },
});

/**
 * Input validation for every mutation. Server actions parse FormData through
 * these schemas before anything reaches the repository.
 */

const trimmed = (min: number, max: number) => z.string().trim().min(min).max(max);
const optionalTrimmed = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null));

const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email({ message: "Please enter a valid email address." }));

export const applicationSchema = z.object({
  fullName: trimmed(2, 160),
  email,
  phone: optionalTrimmed(40),
  city: trimmed(2, 120),
  marketSlug: optionalTrimmed(60),
  occupation: optionalTrimmed(200),
  referralSource: optionalTrimmed(200),
  invitationCode: optionalTrimmed(64),
  lifeInMotion: trimmed(10, 2000),
  whatWouldHelp: trimmed(10, 2000),
  consent: z.literal("on", { message: "Please confirm you have read the privacy notice." }),
});
export type ApplicationInput = z.infer<typeof applicationSchema>;

export const partnerApplicationSchema = z.object({
  organization: trimmed(2, 200),
  contactName: trimmed(2, 160),
  email,
  phone: optionalTrimmed(40),
  categorySlug: optionalTrimmed(60),
  city: trimmed(2, 120),
  website: optionalTrimmed(300),
  message: trimmed(20, 4000),
});
export type PartnerApplicationInput = z.infer<typeof partnerApplicationSchema>;

export const contactSchema = z.object({
  name: trimmed(1, 160),
  email,
  topic: z.enum(["membership", "partnership", "press", "other"]),
  message: trimmed(10, 4000),
});
export type ContactInput = z.infer<typeof contactSchema>;

export const signInSchema = z.object({ email, next: z.string().optional() });

export const newRequestSchema = z.object({
  brief: trimmed(3, 8000),
  title: optionalTrimmed(200),
  categorySlug: optionalTrimmed(60),
  priority: z.enum(REQUEST_PRIORITIES).default("standard"),
  journeyId: z.uuid().optional().nullable(),
});
export type NewRequestInput = z.infer<typeof newRequestSchema>;

export const messageSchema = z.object({
  requestId: z.uuid(),
  body: trimmed(1, 8000),
});

export const staffMessageSchema = messageSchema.extend({
  visibility: z.enum(["member", "internal"]),
});

export const optionDecisionSchema = z.object({
  optionId: z.uuid(),
  requestId: z.uuid(),
  decision: z.enum(["accept", "decline"]),
});

export const cancelRequestSchema = z.object({
  requestId: z.uuid(),
  reason: optionalTrimmed(1000),
});

const moneyInput = z
  .string()
  .trim()
  .optional()
  .transform((v, ctx) => {
    if (!v) return null;
    const n = Number(v.replace(/[,\s]/g, ""));
    if (!Number.isFinite(n) || n < 0) {
      ctx.addIssue({ code: "custom", message: "Enter a valid amount." });
      return z.NEVER;
    }
    return Math.round(n * 100);
  });

export const newOptionSchema = z.object({
  requestId: z.uuid(),
  title: trimmed(1, 200),
  summary: z.string().trim().max(4000).default(""),
  priceMajor: moneyInput,
  currency: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/)
    .default("USD"),
  providerId: z
    .string()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  expiresAt: z
    .string()
    .optional()
    .transform((v) => (v && v.length > 0 ? new Date(v).toISOString() : null)),
  present: z
    .string()
    .optional()
    .transform((v) => v === "on"),
});
export type NewOptionInput = z.infer<typeof newOptionSchema>;

export const staffRequestPatchSchema = z.object({
  requestId: z.uuid(),
  status: z.enum(REQUEST_STATUSES).optional(),
  assigneeId: z
    .string()
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "" ? null : v)),
  priority: z.enum(REQUEST_PRIORITIES).optional(),
  categorySlug: z.string().optional(),
  vertical: z.enum(VERTICALS).optional(),
});

export const profileUpdateSchema = z.object({
  fullName: trimmed(2, 160),
  preferredName: optionalTrimmed(80),
  phone: optionalTrimmed(40),
  timezone: trimmed(2, 64).refine((tz) => {
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: tz });
      return true;
    } catch {
      return false;
    }
  }, "Unknown time zone"),
});
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

export const preferenceSchema = z.object({
  domain: z.enum(PREFERENCE_DOMAINS),
  label: trimmed(1, 120),
  value: trimmed(1, 2000),
});
export type PreferenceInput = z.infer<typeof preferenceSchema>;

export const personSchema = z.object({
  name: trimmed(1, 160),
  relationship: trimmed(1, 80),
  notes: optionalTrimmed(2000),
  birthday: z
    .string()
    .optional()
    .transform((v) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null)),
});
export type PersonInput = z.infer<typeof personSchema>;

export const invitationSchema = z.object({
  email,
  name: trimmed(1, 160),
});

export const applicationDecisionSchema = z.object({
  applicationId: z.uuid(),
  status: z.enum(APPLICATION_STATUSES),
  note: optionalTrimmed(2000),
});

export const providerSchema = z.object({
  name: trimmed(1, 200),
  categorySlug: optionalTrimmed(60),
  marketId: z
    .string()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  status: z.enum(PROVIDER_STATUSES).default("prospect"),
  website: optionalTrimmed(300),
  contactName: optionalTrimmed(160),
  contactEmail: optionalTrimmed(200),
  contactPhone: optionalTrimmed(40),
  termsSummary: optionalTrimmed(2000),
  notes: optionalTrimmed(4000),
  isFounding: z
    .string()
    .optional()
    .transform((v) => v === "on"),
});
export type ProviderInput = z.infer<typeof providerSchema>;

/** Turn FormData into a plain object for zod. Repeated keys keep the last value. */
export function formToObject(form: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of form.entries()) {
    if (typeof value === "string") out[key] = value;
  }
  return out;
}

export type FieldErrors = Partial<Record<string, string>>;

export function fieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
