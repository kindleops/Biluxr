import type { Money } from "./domain/types";

/**
 * Formatting helpers. All date formatting is explicit about time zone: request
 * times render in the request's own zone (where the member will be), with the
 * zone shown when it differs from the viewer's.
 */

const LOCALE = "en-US";

export function formatMoney(money: Money | null | undefined, opts: { compact?: boolean } = {}): string {
  if (!money) return "—";
  const value = money.amountMinor / 100;
  return new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency: money.currency,
    maximumFractionDigits: value % 1 === 0 || opts.compact ? 0 : 2,
    notation: opts.compact && value >= 100_000 ? "compact" : "standard",
  }).format(value);
}

export function formatDate(iso: string | null | undefined, timeZone?: string): string {
  if (!iso) return "—";
  const date = iso.length === 10 ? new Date(`${iso}T12:00:00Z`) : new Date(iso);
  return new Intl.DateTimeFormat(LOCALE, {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: iso.length === 10 ? "UTC" : timeZone,
  }).format(date);
}

export function formatDateLong(iso: string | null | undefined, timeZone?: string): string {
  if (!iso) return "—";
  const date = iso.length === 10 ? new Date(`${iso}T12:00:00Z`) : new Date(iso);
  return new Intl.DateTimeFormat(LOCALE, {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: iso.length === 10 ? "UTC" : timeZone,
  }).format(date);
}

export function formatDateTime(iso: string | null | undefined, timeZone?: string | null): string {
  if (!iso) return "—";
  const parts = new Intl.DateTimeFormat(LOCALE, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: timeZone ?? undefined,
    timeZoneName: timeZone ? "short" : undefined,
  }).format(new Date(iso));
  return parts;
}

export function formatTime(iso: string | null | undefined, timeZone?: string | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat(LOCALE, {
    hour: "numeric",
    minute: "2-digit",
    timeZone: timeZone ?? undefined,
  }).format(new Date(iso));
}

export function formatDateRange(start: string | null, end: string | null): string {
  if (!start) return "Dates to be arranged";
  if (!end || end === start) return formatDateLong(start);
  const s = new Date(`${start.slice(0, 10)}T12:00:00Z`);
  const e = new Date(`${end.slice(0, 10)}T12:00:00Z`);
  const sameYear = s.getUTCFullYear() === e.getUTCFullYear();
  const sameMonth = sameYear && s.getUTCMonth() === e.getUTCMonth();
  const month = (d: Date) => new Intl.DateTimeFormat(LOCALE, { month: "long", timeZone: "UTC" }).format(d);
  if (sameMonth) return `${month(s)} ${s.getUTCDate()}–${e.getUTCDate()}, ${s.getUTCFullYear()}`;
  if (sameYear)
    return `${month(s)} ${s.getUTCDate()} – ${month(e)} ${e.getUTCDate()}, ${s.getUTCFullYear()}`;
  return `${formatDateLong(start)} – ${formatDateLong(end)}`;
}

const RELATIVE = new Intl.RelativeTimeFormat(LOCALE, { numeric: "auto" });

export function formatRelative(iso: string | null | undefined, now: Date = new Date()): string {
  if (!iso) return "—";
  const diffMs = new Date(iso).getTime() - now.getTime();
  const abs = Math.abs(diffMs);
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (abs < minute) return "just now";
  if (abs < hour) return RELATIVE.format(Math.round(diffMs / minute), "minute");
  if (abs < day) return RELATIVE.format(Math.round(diffMs / hour), "hour");
  if (abs < 14 * day) return RELATIVE.format(Math.round(diffMs / day), "day");
  return formatDate(iso);
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "·";
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase();
}

export function greeting(date: Date, timeZone?: string): string {
  const hour = Number(
    new Intl.DateTimeFormat(LOCALE, { hour: "numeric", hourCycle: "h23", timeZone }).format(date),
  );
  if (hour < 5) return "Good evening";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > max * 0.6 ? lastSpace : cut.length).trimEnd()}…`;
}
