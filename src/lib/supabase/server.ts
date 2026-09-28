import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import type { Database } from "./database.types";

export type BiluxrSupabase = ReturnType<typeof createServerClient<Database>>;

/** Request-scoped client acting as the signed-in user. RLS applies. */
export async function supabaseServer(): Promise<BiluxrSupabase> {
  const url = env.supabaseUrl();
  const key = env.supabaseAnonKey();
  if (!url || !key) throw new Error("Supabase is not configured");
  const store = await cookies();
  return createServerClient<Database>(url, key, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (toSet) => {
        try {
          for (const { name, value, options } of toSet) store.set(name, value, options);
        } catch {
          // Called from a Server Component: the proxy refreshes the session instead.
        }
      },
    },
  });
}

/**
 * Service-role client. Bypasses RLS — use only for narrowly scoped server
 * tasks (AI event logging, sign-in eligibility, analytics). Never import into
 * client components; `server-only` enforces this at build time.
 */
export function supabaseAdmin() {
  const url = env.supabaseUrl();
  const key = env.supabaseServiceRoleKey();
  if (!url || !key) return null;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
