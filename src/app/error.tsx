"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function ErrorBoundary({
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
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-4 text-center">
      <span className="inline-flex size-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <AlertTriangle className="size-8" />
      </span>
      <h1 className="mt-6 text-2xl font-bold tracking-tight text-foreground">
        Something went wrong
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        An unexpected error occurred while loading this page. You can retry, or
        head back and try again later.
      </p>
      <Button className="mt-8 h-11 gap-2 px-5" onClick={reset}>
        <RefreshCw className="size-4" />
        Try again
      </Button>
    </div>
  );
}
