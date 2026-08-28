"use client";

import * as React from "react";
import Link from "next/link";
import {
  ChevronDown,
  CloudRain,
  Calendar,
  Wrench,
  TriangleAlert,
  Menu,
  MessageCircle,
  X,
} from "lucide-react";
import { AvailabilityPill, Button, LinkButton } from "@/components/ui";
import { cn } from "@/lib/utils";
import { formatKm, whatsappHref } from "@/lib/format";
import { closureDismissKey } from "@/lib/closure";
import type { Closure } from "@/lib/content";

export type NavStretch = { slug: string; name: string; distanceKm: number | null };

/**
 * The river-status strap. Pinned above the header and never scrolled away,
 * because availability is the first fact this site owes anyone.
 */
export function StatusStrap({
  open,
  label,
  gauge,
}: {
  open: boolean;
  label: string;
  gauge: string;
}) {
  return (
    <div className={cn("w-full text-white", open ? "bg-jade-900" : "bg-granite-900")}>
      <div className="container-page flex min-h-9 flex-wrap items-center justify-center gap-x-3 gap-y-1 py-1.5 text-center text-caption sm:justify-between sm:text-left">
        <p className="inline-flex items-center gap-2 font-semibold">
          <span
            className={cn(
              "size-2 shrink-0 rounded-full",
              open ? "bg-jade-300" : "bg-granite-400",
            )}
            aria-hidden
          />
          {label}
        </p>
        <p className="text-white/70">
          Ganga · {gauge} gauge · updated daily by our river team
        </p>
      </div>
    </div>
  );
}

export function SiteHeader({
  brandName,
  stretches,
  whatsappNumber,
  raftingOpen,
}: {
  brandName: string;
  stretches: NavStretch[];
  whatsappNumber: string;
  raftingOpen: boolean;
}) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [raftOpen, setRaftOpen] = React.useState(false);
  const raftRef = React.useRef<HTMLDivElement>(null);
  const wa = whatsappHref(whatsappNumber, "Hi Ganga Vedha — I'd like to book a trip.");

  React.useEffect(() => {
    function onDown(e: PointerEvent) {
      if (raftRef.current && !raftRef.current.contains(e.target as Node)) setRaftOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { setRaftOpen(false); setMenuOpen(false); }
    }
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <header className="sticky top-0 z-(--z-header) border-b border-hairline bg-canvas/92 backdrop-blur-md">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link
          href="/"
          className="text-title tracking-[-0.03em] text-ink no-underline"
          style={{ fontVariationSettings: '"wdth" 112' }}
        >
          {brandName}
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          <div ref={raftRef} className="relative">
            <button
              type="button"
              onClick={() => setRaftOpen((v) => !v)}
              aria-expanded={raftOpen}
              aria-haspopup="true"
              className="inline-flex h-11 items-center gap-1.5 rounded-md px-3.5 text-small font-semibold text-ink-muted transition-colors hover:bg-granite-100 hover:text-ink"
            >
              Rafting
              <ChevronDown
                className={cn("size-4 transition-transform", raftOpen && "rotate-180")}
                aria-hidden
              />
            </button>
            {raftOpen && (
              <div className="absolute left-0 top-full mt-1 w-72 overflow-hidden rounded-lg bg-canvas p-1.5 shadow-lg">
                {/* Sold by the kilometre — the axis, not a buried dropdown. */}
                {stretches.map((s) => (
                  <Link
                    key={s.slug}
                    href={`/rafting/${s.slug}`}
                    onClick={() => setRaftOpen(false)}
                    className="flex items-center justify-between gap-3 rounded-sm px-3 py-2.5 no-underline transition-colors hover:bg-granite-100"
                  >
                    <span className="text-small font-semibold text-ink">{s.name}</span>
                    <span className="tabular text-caption text-ink-faint">
                      {formatKm(s.distanceKm)}
                    </span>
                  </Link>
                ))}
                <Link
                  href="/rafting"
                  onClick={() => setRaftOpen(false)}
                  className="mt-1 block rounded-sm border-t border-hairline px-3 pt-3 pb-2 text-small font-semibold text-link no-underline"
                >
                  Compare all stretches
                </Link>
              </div>
            )}
          </div>
          {[
            ["Bungee", "/bungee/bungee-jump-rishikesh"],
            ["Stays", "/hotels"],
            ["Contact", "#contact"],
          ].map(([label, href]) => (
            <Link
              key={label}
              href={href}
              className="inline-flex h-11 items-center rounded-md px-3.5 text-small font-semibold text-ink-muted no-underline transition-colors hover:bg-granite-100 hover:text-ink"
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {!raftingOpen && (
            <AvailabilityPill open={false} label="Rafting closed" className="hidden sm:inline-flex" />
          )}
          {wa && (
            <LinkButton
              href={wa}
              target="_blank"
              rel="noopener"
              variant="secondary"
              className="hidden sm:inline-flex"
            >
              <MessageCircle className="size-4" aria-hidden />
              WhatsApp
            </LinkButton>
          )}
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="grid size-11 place-items-center rounded-md text-ink lg:hidden"
          >
            <Menu className="size-6" aria-hidden />
            <span className="sr-only">Open menu</span>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="fixed inset-0 z-(--z-overlay) lg:hidden">
          <div
            className="absolute inset-0 bg-granite-950/55"
            onClick={() => setMenuOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-y-0 right-0 flex w-[min(20rem,88vw)] flex-col bg-canvas shadow-xl">
            <div className="flex h-16 items-center justify-between border-b border-hairline px-5">
              <span className="text-subtitle text-ink">Menu</span>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="grid size-11 place-items-center rounded-md text-ink-faint"
              >
                <X className="size-5" aria-hidden />
                <span className="sr-only">Close menu</span>
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-4" aria-label="Mobile">
              <p className="px-2 pb-2 text-label uppercase text-ink-faint">Rafting by distance</p>
              {stretches.map((s) => (
                <Link
                  key={s.slug}
                  href={`/rafting/${s.slug}`}
                  onClick={() => setMenuOpen(false)}
                  className="flex min-h-12 items-center justify-between gap-3 rounded-md px-2 no-underline"
                >
                  <span className="text-small font-semibold text-ink">{s.name}</span>
                  <span className="tabular text-caption text-ink-faint">
                    {formatKm(s.distanceKm)}
                  </span>
                </Link>
              ))}
              <div className="mt-4 border-t border-hairline pt-4">
                {[
                  ["Bungee jumping", "/bungee/bungee-jump-rishikesh"],
                  ["Stays", "/hotels"],
                  ["Contact", "#contact"],
                ].map(([label, href]) => (
                  <Link
                    key={label}
                    href={href}
                    onClick={() => setMenuOpen(false)}
                    className="flex min-h-12 items-center rounded-md px-2 text-small font-semibold text-ink no-underline"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </nav>
            {wa && (
              <div className="border-t border-hairline p-4 pb-safe">
                <a
                  href={wa}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-jade-700 font-semibold text-white no-underline"
                >
                  <MessageCircle className="size-4" aria-hidden />
                  Message us on WhatsApp
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

const CLOSURE_ICON = { rain: CloudRain, wrench: Wrench, calendar: Calendar, alert: TriangleAlert };

export type ClosureVisualProps = {
  icon: keyof typeof CLOSURE_ICON;
  title: string;
  body: string;
  footnote: string | null;
  ctaLabel: string;
  onDismiss?: () => void;
};

/**
 * The pure visual, with no dismissal state or session logic. The live site's
 * ClosureNotice wraps this with sessionStorage; the admin closure editor
 * renders it directly against unsaved draft text, so "Preview" shows exactly
 * what a visitor would see, including edits not yet saved.
 */
export function ClosureNoticeVisual({
  icon,
  title,
  body,
  footnote,
  ctaLabel,
  onDismiss,
}: ClosureVisualProps) {
  const Icon = CLOSURE_ICON[icon];
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="closure-title"
      className="fixed inset-0 z-(--z-toast) grid place-items-center overflow-y-auto bg-jade-950/96 px-5 py-12 backdrop-blur-sm"
    >
      <div className="mx-auto max-w-lg text-center text-white">
        <span className="mx-auto grid size-20 place-items-center rounded-full border-2 border-white/25">
          <Icon className="size-9" aria-hidden />
        </span>
        <h2
          id="closure-title"
          className="mt-7 text-display-md text-white"
          style={{ fontVariationSettings: '"wdth" 112' }}
        >
          {title}
        </h2>
        <p className="mx-auto mt-5 max-w-md text-white/80">{body}</p>
        {footnote && (
          <p className="mx-auto mt-7 inline-flex items-center gap-2.5 rounded-full border border-white/25 px-5 py-2.5 text-small font-semibold">
            <Calendar className="size-4" aria-hidden />
            {footnote}
          </p>
        )}
        <div className="mt-8">
          <Button size="lg" onClick={onDismiss} autoFocus>
            {ctaLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * The full-screen closure notice. Dismissal is keyed to the closure's id AND
 * version, so editing the message brings it back for people who dismissed the
 * old one — and it is stored per session, not forever.
 */
const dismissListeners = new Set<() => void>();
function subscribeDismiss(cb: () => void) {
  dismissListeners.add(cb);
  return () => dismissListeners.delete(cb);
}

export function ClosureNotice({ closure }: { closure: Closure | null }) {
  const key = closure ? closureDismissKey(closure) : null;

  /* sessionStorage is an external store, so it is read through the primitive
     built for one. An effect + setState here would render the notice, then
     immediately hide it, which is a visible flash on every page view. */
  const dismissed = React.useSyncExternalStore(
    subscribeDismiss,
    () => {
      if (!key) return true;
      try {
        return sessionStorage.getItem(key) !== null;
      } catch {
        return false; // private mode: show it, and it reappears next visit
      }
    },
    () => true, // server render: never emit the notice into static HTML
  );

  const dismiss = React.useCallback(() => {
    if (!key) return;
    try {
      sessionStorage.setItem(key, "1");
    } catch {
      /* ignore */
    }
    dismissListeners.forEach((cb) => cb());
  }, [key]);

  const show = Boolean(closure) && !dismissed;

  React.useEffect(() => {
    if (!show) return;
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") dismiss(); }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [show, dismiss]);

  if (!closure || !show) return null;

  return (
    <ClosureNoticeVisual
      icon={closure.icon}
      title={closure.title}
      body={closure.body}
      footnote={closure.footnote}
      ctaLabel={closure.ctaLabel}
      onDismiss={dismiss}
    />
  );
}

export function WhatsappFab({ number }: { number: string }) {
  const href = whatsappHref(number, "Hi Ganga Vedha — I have a question about booking.");
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      className="whatsapp-fab fixed right-4 bottom-4 z-(--z-sticky) grid size-14 place-items-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105"
    >
      <MessageCircle className="size-7 fill-current" aria-hidden />
      <span className="sr-only">Message Ganga Vedha on WhatsApp</span>
    </a>
  );
}

export function SeedBanner() {
  const [show, setShow] = React.useState(true);
  if (!show) return null;
  return (
    <div className="bg-caution-soft">
      <div className="container-page flex items-center gap-3 py-2 text-caption text-caution">
        <TriangleAlert className="size-4 shrink-0" aria-hidden />
        <p className="flex-1">
          <strong className="font-semibold">Demo content.</strong> Prices, ratings,
          review counts and photographs are placeholders for the client to
          replace from the admin panel — not Ganga Vedha&rsquo;s real figures.
        </p>
        <button
          type="button"
          onClick={() => setShow(false)}
          className="grid size-8 shrink-0 place-items-center rounded-sm"
        >
          <X className="size-4" aria-hidden />
          <span className="sr-only">Dismiss</span>
        </button>
      </div>
    </div>
  );
}

