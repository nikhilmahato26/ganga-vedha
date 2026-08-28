"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";
import { Button, LinkButton } from "@/components/ui";

export default function SiteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[site error]", error);
  }, [error]);

  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <span className="grid size-16 place-items-center rounded-full bg-danger-soft text-danger">
        <AlertTriangle className="size-7" aria-hidden />
      </span>
      <h1 className="mt-6 text-display-md text-ink">Something went wrong on our end</h1>
      <p className="mt-3 measure text-ink-muted">
        This wasn&rsquo;t you — try again, or message us on WhatsApp if it keeps happening.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button size="lg" onClick={reset}>
          <RotateCw className="size-4" aria-hidden /> Try again
        </Button>
        <LinkButton href="/" size="lg" variant="outline">
          Back to home
        </LinkButton>
      </div>
    </div>
  );
}
