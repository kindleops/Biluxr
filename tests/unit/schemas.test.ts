import { describe, expect, it } from "vitest";
import {
  applicationSchema,
  fieldErrors,
  newOptionSchema,
  newRequestSchema,
  profileUpdateSchema,
} from "@/lib/domain/schemas";

const validApplication = {
  fullName: "Jo Visitor",
  email: " Jo@Example.com ",
  city: "Miami",
  lifeInMotion: "Two homes and a lot of travel.",
  whatWouldHelp: "Someone who knows how we like things.",
  consent: "on",
};

describe("validation", () => {
  it("normalizes and accepts a valid application", () => {
    const parsed = applicationSchema.parse(validApplication);
    expect(parsed.email).toBe("jo@example.com");
    expect(parsed.phone).toBeNull();
  });

  it("requires consent and returns calm, field-level messages", () => {
    const result = applicationSchema.safeParse({
      ...validApplication,
      consent: undefined,
      city: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = fieldErrors(result.error);
      expect(errors.city).toBe("Please add a little more detail.");
      expect(errors.consent).toMatch(/privacy notice/);
    }
  });

  it("rejects malformed email addresses", () => {
    expect(
      applicationSchema.safeParse({ ...validApplication, email: "not-an-email" }).success,
    ).toBe(false);
  });

  it("parses option prices into minor units", () => {
    const parsed = newOptionSchema.parse({
      requestId: "0b7e1c2a-1f4d-4c8e-9a51-6d2f0e3a7b01",
      title: "Suite",
      priceMajor: "1,800.50",
      currency: "usd",
      present: "on",
    });
    expect(parsed.priceMajor).toBe(180050);
    expect(parsed.currency).toBe("USD");
    expect(parsed.present).toBe(true);
    expect(
      newOptionSchema.safeParse({
        requestId: "0b7e1c2a-1f4d-4c8e-9a51-6d2f0e3a7b01",
        title: "x",
        priceMajor: "abc",
      }).success,
    ).toBe(false);
  });

  it("defaults request priority and rejects empty briefs", () => {
    expect(newRequestSchema.parse({ brief: "A table for two" }).priority).toBe("standard");
    expect(newRequestSchema.safeParse({ brief: "  " }).success).toBe(false);
  });

  it("rejects unknown time zones", () => {
    expect(
      profileUpdateSchema.safeParse({ fullName: "Elena Voss", timezone: "Mars/Olympus" }).success,
    ).toBe(false);
    expect(
      profileUpdateSchema.safeParse({ fullName: "Elena Voss", timezone: "Europe/Paris" }).success,
    ).toBe(true);
  });
});
