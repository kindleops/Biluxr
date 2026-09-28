import { describe, expect, it } from "vitest";
import {
  formatDateRange,
  formatMoney,
  formatRelative,
  formatTime,
  greeting,
  initials,
  truncate,
} from "@/lib/format";

describe("formatting", () => {
  it("formats money from minor units without inventing decimals", () => {
    expect(formatMoney({ amountMinor: 180000, currency: "USD" })).toBe("$1,800");
    expect(formatMoney({ amountMinor: 12345, currency: "EUR" })).toBe("€123.45");
    expect(formatMoney(null)).toBe("—");
  });

  it("formats date ranges compactly", () => {
    expect(formatDateRange("2026-10-10", "2026-10-14")).toBe("October 10–14, 2026");
    expect(formatDateRange("2026-10-30", "2026-11-02")).toBe("October 30 – November 2, 2026");
    expect(formatDateRange(null, null)).toBe("Dates to be arranged");
  });

  it("renders times in the zone where they happen", () => {
    const iso = "2026-10-11T13:40:00.000Z";
    expect(formatTime(iso, "Europe/Paris")).toBe("3:40 PM");
    expect(formatTime(iso, "America/New_York")).toBe("9:40 AM");
  });

  it("describes relative time", () => {
    const now = new Date("2026-09-28T12:00:00Z");
    expect(formatRelative("2026-09-28T11:59:40Z", now)).toBe("just now");
    expect(formatRelative("2026-09-28T09:00:00Z", now)).toBe("3 hours ago");
    expect(formatRelative("2026-09-29T12:00:00Z", now)).toBe("tomorrow");
  });

  it("greets by the member's local time", () => {
    const at = new Date("2026-09-28T12:00:00Z");
    expect(greeting(at, "America/New_York")).toBe("Good morning");
    expect(greeting(at, "Asia/Tokyo")).toBe("Good evening");
  });

  it("derives initials and truncates on word boundaries", () => {
    expect(initials("Elena Voss")).toBe("EV");
    expect(initials("  Madonna ")).toBe("M");
    expect(truncate("The quick brown fox jumps", 15)).toBe("The quick…");
  });
});
