/**
 * Environment access. Nothing reads process.env outside this module so the
 * set of required credentials is documented in one place (see .env.example).
 */

function read(name: string): string | undefined {
  const value = process.env[name];
  return value && value.trim().length > 0 ? value.trim() : undefined;
}

export const env = {
  siteUrl: () => read("NEXT_PUBLIC_SITE_URL") ?? "http://localhost:3000",
  supabaseUrl: () => read("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: () => read("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  supabaseServiceRoleKey: () => read("SUPABASE_SERVICE_ROLE_KEY"),
  anthropicApiKey: () => read("ANTHROPIC_API_KEY"),
  aiModel: () => read("BILUXR_AI_MODEL") ?? "claude-opus-5",
  analyticsSalt: () => read("BILUXR_ANALYTICS_SALT"),
  stripeSecretKey: () => read("STRIPE_SECRET_KEY"),
  demoRequested: () => read("BILUXR_DEMO_MODE") === "true",
  vercelEnv: () => read("VERCEL_ENV"),
};

export type DataMode = "supabase" | "demo" | "unavailable";

/**
 * Which backend serves data.
 *
 *  - `supabase`     when Supabase credentials are configured (always wins).
 *  - `demo`         when explicitly requested AND not a Vercel production
 *                   deployment. Fixtures can never reach production.
 *  - `unavailable`  otherwise: the product renders graceful, honest states.
 */
export function dataMode(): DataMode {
  if (env.supabaseUrl() && env.supabaseAnonKey()) return "supabase";
  if (env.demoRequested() && env.vercelEnv() !== "production") return "demo";
  return "unavailable";
}

export function isDemo(): boolean {
  return dataMode() === "demo";
}

export function aiConfigured(): boolean {
  return Boolean(env.anthropicApiKey());
}

export interface IntegrationStatus {
  key: string;
  label: string;
  configured: boolean;
  requiredEnv: string[];
  purpose: string;
}

export function integrationStatus(): IntegrationStatus[] {
  return [
    {
      key: "supabase",
      label: "Supabase",
      configured: Boolean(env.supabaseUrl() && env.supabaseAnonKey()),
      requiredEnv: ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"],
      purpose: "Database, authentication and row-level security.",
    },
    {
      key: "supabase_service",
      label: "Supabase service role",
      configured: Boolean(env.supabaseServiceRoleKey()),
      requiredEnv: ["SUPABASE_SERVICE_ROLE_KEY"],
      purpose: "Server-only: AI event logging, invitation-aware sign-in, analytics.",
    },
    {
      key: "anthropic",
      label: "Biluxr AI (Claude)",
      configured: Boolean(env.anthropicApiKey()),
      requiredEnv: ["ANTHROPIC_API_KEY"],
      purpose: "Intent extraction, clarifying questions and summaries for staff review.",
    },
    {
      key: "stripe",
      label: "Payments (Stripe)",
      configured: Boolean(env.stripeSecretKey()),
      requiredEnv: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"],
      purpose: "Membership fees and payment authorization. Not yet integrated.",
    },
  ];
}
