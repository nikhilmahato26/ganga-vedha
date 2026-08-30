"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui";

/**
 * The one-time welcome overlay. Shown the first time the site is opened in a
 * browser session — the dismissal is stored in `sessionStorage`, the same
 * mechanism the closure notices use, so it does not nag on every page load.
 */
const SEEN_KEY = "gv-welcome-seen";

export function WelcomeModal() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    let seen = false;
    try {
      seen = window.sessionStorage.getItem(SEEN_KEY) === "1";
    } catch {
      // Private mode / storage blocked — just show it this once.
    }
    if (!seen) setOpen(true);
  }, []);

  const close = React.useCallback(() => {
    setOpen(false);
    try {
      window.sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* ignore */
    }
  }, []);

  React.useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, close]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-title"
      className="fixed inset-0 z-(--z-toast) grid place-items-center overflow-y-auto bg-granite-950/60 px-5 py-10 backdrop-blur-[3px]"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="relative mx-auto w-full max-w-xl rounded-lg bg-jade-950 p-8 text-center text-white shadow-xl sm:p-12">
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute right-3 top-3 grid size-9 place-items-center rounded-sm text-white/60 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X className="size-5" aria-hidden />
        </button>

        <h2
          id="welcome-title"
          className="text-display-md text-white"
          style={{ fontVariationSettings: '"wdth" 112' }}
        >
          Ganga Vedha
        </h2>
        <p className="mt-2 text-caption font-semibold uppercase tracking-wide text-jade-300">
          Where the Ganga meets adventure
        </p>

        <p className="mt-6 text-subtitle font-normal text-white">
          Welcome to your complete Rishikesh experience.
        </p>
        <p className="mx-auto mt-4 max-w-md text-small text-white/80">
          River rafting and bungee jumping, the right hotel or resort, and the Himalayan
          city on a car, bike or scooty rental — with travel services to tie it together.
        </p>
        <p className="mx-auto mt-3 max-w-md text-small text-white/80">
          Adventure, family holidays, spiritual journeys, business travel or a weekend
          getaway — Ganga Vedha helps you{" "}
          <strong className="font-semibold text-white">plan it, book it, experience it.</strong>
        </p>

        <p className="mt-7 text-caption font-semibold uppercase tracking-wide text-jade-300">
          One destination. Endless experiences.
        </p>
        <p className="mt-1 text-caption text-white/70">
          Rafting · Bungee · Stay · Rentals · Transport · Tours
        </p>

        <p className="mt-6 text-subtitle font-normal text-white">
          Your Rishikesh adventure starts here.
        </p>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Button
            size="lg"
            onClick={() => {
              close();
              router.push("/adventures");
            }}
          >
            Explore Rishikesh
          </Button>
          <button
            type="button"
            onClick={close}
            className="text-small font-semibold text-white/70 underline-offset-4 hover:text-white hover:underline"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
