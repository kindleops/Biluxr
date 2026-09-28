import type { Metadata } from "next";
import Link from "next/link";
import { BiluxrLogo } from "@/components/brand/logo";
import { FormMessage } from "@/components/ui/field";
import { UnavailableState } from "@/components/ui/empty-state";
import { EditorialHeading } from "@/components/ui/typography";
import { DEMO_PERSONAS, DEMO_PERSONA_KEYS } from "@/lib/demo/personas";
import { dataMode } from "@/lib/env";
import { chooseDemoPersona } from "./actions";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
  alternates: { canonical: "/login" },
};

const STATES: Record<string, string> = {
  expired: "That link has expired or was already used. Request a new one below.",
  invalid: "That sign-in link was not valid. Request a new one below.",
  pending:
    "You are signed in, but your membership is not yet active. Your concierge will be in touch — or write to us from the contact page.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; state?: string }>;
}) {
  const { next, state } = await searchParams;
  const mode = dataMode();

  return (
    <main id="main" className="grain relative flex min-h-dvh flex-col overflow-hidden bg-ink-950">
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-[-50vmax] left-1/2 z-[1] size-[100vmax] -translate-x-1/2 rounded-full shadow-[inset_0_0_0_1px_rgb(243_239_232/0.07)]"
      />
      <header className="page-gutter relative z-[2] flex h-(--nav-height) items-center justify-between">
        <Link href="/" aria-label="Biluxr, home" className="-m-2 p-2 text-bone-100">
          <BiluxrLogo />
        </Link>
        <Link href="/apply" className="text-body-sm text-bone-400 hover:text-bone-100">
          Not a member? Apply
        </Link>
      </header>
      <div className="page-gutter relative z-[2] flex flex-1 items-center justify-center py-16">
        <div className="w-full max-w-md">
          <p className="text-label text-bone-500">{mode === "demo" ? "Demo environment" : "Members"}</p>
          <EditorialHeading as="h1" size="headline" className="mt-5 text-bone-50">
            {mode === "demo" ? "Choose who you are today." : "Welcome back."}
          </EditorialHeading>
          <div className="mt-10 grid gap-6">
            {state && STATES[state] && <FormMessage kind="error">{STATES[state]}</FormMessage>}
            {mode === "supabase" && <SignInForm next={next} />}
            {mode === "demo" && (
              <form action={chooseDemoPersona} className="grid gap-3">
                <input type="hidden" name="next" value={next ?? ""} />
                {DEMO_PERSONA_KEYS.map((key) => {
                  const p = DEMO_PERSONAS[key];
                  return (
                    <button
                      key={key}
                      type="submit"
                      name="persona"
                      value={key}
                      className="group flex items-center justify-between gap-6 rounded-lg bg-ink-900 px-5 py-4 text-left shadow-[inset_0_0_0_1px_var(--line)] transition-[box-shadow,background-color] duration-quick hover:bg-ink-850 hover:shadow-[inset_0_0_0_1px_var(--line-strong)]"
                    >
                      <span>
                        <span className="block text-label text-bone-500">{p.label}</span>
                        <span className="mt-1.5 block text-body text-bone-100">{p.name}</span>
                        <span className="mt-0.5 block text-caption text-bone-400">{p.description}</span>
                      </span>
                      <svg viewBox="0 0 16 16" aria-hidden className="size-4 shrink-0 text-bone-500 transition-transform duration-base group-hover:translate-x-1 group-hover:text-bone-100" fill="none" stroke="currentColor" strokeWidth="1.25">
                        <path d="M2 8h11M9 4l4 4-4 4" />
                      </svg>
                    </button>
                  );
                })}
                <p className="mt-3 text-caption text-bone-500">
                  Demo mode uses fictional people and in-memory data that resets when the server restarts.
                </p>
              </form>
            )}
            {mode === "unavailable" && (
              <UnavailableState
                title="Sign-in not yet available"
                body="Member accounts are being prepared. If you are a member, your concierge will contact you directly."
              />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
