"use client";

import { useEffect } from "react";

export default function GlobalError({
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-16 text-center">
      <p className="micro-label mb-3">Something broke</p>
      <h1 className="headline mb-4 text-4xl sm:text-5xl">Unexpected error.</h1>
      <p className="mb-8 text-sm text-foreground/60">
        Something went wrong loading this page. You can try again.
      </p>
      <button
        onClick={reset}
        className="rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-colors hover:bg-foreground/85"
      >
        Try again
      </button>
    </div>
  );
}
