import { afterEach, describe, expect, it, vi } from "vitest";
import { dataMode } from "@/lib/env";

afterEach(() => vi.unstubAllEnvs());

describe("data mode", () => {
  it("is unavailable without configuration", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    vi.stubEnv("BILUXR_DEMO_MODE", "");
    expect(dataMode()).toBe("unavailable");
  });

  it("refuses demo fixtures on a production deployment", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("BILUXR_DEMO_MODE", "true");
    vi.stubEnv("VERCEL_ENV", "production");
    expect(dataMode()).toBe("unavailable");
    vi.stubEnv("VERCEL_ENV", "preview");
    expect(dataMode()).toBe("demo");
  });

  it("prefers Supabase whenever it is configured", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
    vi.stubEnv("BILUXR_DEMO_MODE", "true");
    expect(dataMode()).toBe("supabase");
  });
});
