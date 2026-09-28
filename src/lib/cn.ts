import { clsx, type ClassValue } from "clsx";

/** Compose class names. Tailwind conflicts are avoided by design, not merged at runtime. */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
