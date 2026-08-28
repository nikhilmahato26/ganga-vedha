"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin error]", error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center py-20 text-center">
      <span className="grid size-14 place-items-center rounded-full bg-danger-soft text-danger">
        <AlertTriangle className="size-6" aria-hidden />
      </span>
      <h1 className="mt-5 text-title text-ink">Something went wrong</h1>
      <p className="mt-2 text-small text-ink-muted">
        The change may not have saved. Try again — if it keeps happening, nothing was lost on the
        site itself.
      </p>
      <Button className="mt-6" onClick={reset}>
        <RotateCw className="size-4" aria-hidden /> Try again
      </Button>
    </div>
  );
}
