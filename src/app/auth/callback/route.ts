import { NextResponse, type NextRequest } from "next/server";
import { homeFor } from "@/lib/auth/session";
import { dataMode } from "@/lib/env";

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next");
  if (dataMode() !== "supabase" || !code) {
    return NextResponse.redirect(new URL("/login?state=invalid", url.origin));
  }
  const { supabaseServer } = await import("@/lib/supabase/server");
  const db = await supabaseServer();
  const { data, error } = await db.auth.exchangeCodeForSession(code);
  if (error || !data.user) {
    return NextResponse.redirect(new URL("/login?state=expired", url.origin));
  }
  const { data: profile } = await db.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
  const safe = next && next.startsWith("/") && !next.startsWith("//") ? next : null;
  const destination = safe ?? (profile ? homeFor(profile.role) : "/login?state=pending");
  return NextResponse.redirect(new URL(destination, url.origin));
}
