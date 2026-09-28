"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function MemberError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => console.error(error), [error]);
  return (
    <div className="mx-auto max-w-lg px-6 py-24 text-center">
      <p className="font-display text-headline font-light text-bone-50">We could not load this just now.</p>
      <p className="mt-4 text-body-sm text-bone-400">Nothing you asked for has been lost. Please try again in a moment.</p>
      <Button className="mt-8" variant="secondary" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
