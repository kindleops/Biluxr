import type { FieldErrors } from "@/lib/domain/schemas";

/** Shape returned by every form server action (used with useActionState). */
export interface FormState {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: FieldErrors;
  values?: Record<string, string>;
}

export const IDLE: FormState = { status: "idle" };
