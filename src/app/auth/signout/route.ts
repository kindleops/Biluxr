import { NextResponse, type NextRequest } from "next/server";
import { DEMO_PERSONA_COOKIE } from "@/lib/auth/session";
import { dataMode } from "@/lib/env";

/** POST only, so a crafted link cannot sign someone out. */
export async function POST(request: NextRequest) {
  if (dataMode() === "supabase") {
    const { supabaseServer } = await import("@/lib/supabase/server");
    const db = await supabaseServer();
    await db.auth.signOut();
  }
  const response = NextResponse.redirect(new URL("/", request.nextUrl.origin), { status: 303 });
  response.cookies.delete(DEMO_PERSONA_COOKIE);
  return response;
}
