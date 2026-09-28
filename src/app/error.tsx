"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main
      id="main"
      className="flex min-h-dvh flex-col items-center justify-center bg-ink-950 px-6 text-center"
    >
      <h1 className="font-display text-headline font-light text-bone-50">
        Something went wrong on our side.
      </h1>
      <p className="mt-4 max-w-sm text-body-sm text-bone-400">
        It has been noted. Please try again{error.digest ? ` — reference ${error.digest}` : ""}.
      </p>
      <Button className="mt-10" variant="secondary" onClick={reset}>
        Try again
      </Button>
    </main>
  );
}
