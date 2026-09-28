import Link from "next/link";
import { BiluxrMark } from "@/components/brand/logo";

export default function NotFound() {
  return (
    <main id="main" className="grain flex min-h-dvh flex-col items-center justify-center bg-ink-950 px-6 text-center">
      <BiluxrMark decorative className="size-10 text-bone-600" />
      <h1 className="mt-8 font-display text-headline font-light text-bone-50">This page has moved on.</h1>
      <p className="mt-4 max-w-sm text-body-sm text-bone-400">The address may be mistyped, or what was here is no longer available.</p>
      <Link href="/" className="mt-10 text-body-sm text-bone-200 underline decoration-white/25 underline-offset-[6px] hover:decoration-white/60">
        Return home
      </Link>
    </main>
  );
}
