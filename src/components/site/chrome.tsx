"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { whatsappHref } from "@/lib/format";
import type { Closure } from "@/lib/content";

/** The two rafting categories the workbook splits Rishikesh into. */
const RAFTING_LINKS: [string, string][] = [
  ["Dronecraft rafting", "/rafting?type=dronecraft"],
  ["River rafting", "/rafting?type=river"],
];

/** The fuller phrasing for the strap, which has room for it. */
const SERVICE_CLOSED_LABEL: Record<string, string> = {
  rafting: "Rafting paused — high water",
  bungee: "Bungee closed",
  hotel: "Hotel bookings closed",
};

/** The short name for the compact nav pill. */
const SERVICE_SHORT_NAME: Record<string, string> = {
  rafting: "Rafting",
  bungee: "Bungee",
  hotel: "Hotels",
};

/**
 * Cycles through a list, one at a time, every `intervalMs` — for a status
 * strap that has more than one closed service to mention and only room for
 * one. A list of 0 or 1 never starts the timer, so nothing above ever
 * flickers when only one thing (or nothing) is closed.
 */
function useRotatingIndex(length: number, intervalMs = 3000): number {
  const [index, setIndex] = React.useState(0);
  React.useEffect(() => {
    if (length <= 1) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % length), intervalMs);
    return () => clearInterval(id);
  }, [length, intervalMs]);
  return length > 0 ? index % length : 0;
}

/**
 * The river-status strap. Pinned above the header and never scrolled away,
 * because availability is the first fact this site owes anyone. Rotates
 * through every closed service — not just rafting — a few seconds at a time
 * when more than one is closed at once.
 */
export function StatusStrap({
  closedServices,
  openLabel,
  gauge,
}: {
  /** Service keys currently closed, e.g. `["rafting", "bungee"]` — empty when everything is open. */
  closedServices: string[];
  openLabel: string;
  gauge: string;
}) {
  const index = useRotatingIndex(closedServices.length);
  const open = closedServices.length === 0;
  const label = open
    ? openLabel
    : (SERVICE_CLOSED_LABEL[closedServices[index]] ?? `${closedServices[index]} closed`);

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
  whatsappNumber,
  closedServices,
  bungeeBrands = [],
}: {
  brandName: string;
  whatsappNumber: string;
  /** Service keys currently closed, e.g. `["rafting", "bungee"]` — empty when everything is open. */
  closedServices: string[];
  /** Bungee operators for the Adventures dropdown. */
  bungeeBrands?: { name: string; slug: string }[];
}) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [raftOpen, setRaftOpen] = React.useState(false);
  const [advOpen, setAdvOpen] = React.useState(false);
  const raftRef = React.useRef<HTMLDivElement>(null);
  const advRef = React.useRef<HTMLDivElement>(null);
  const wa = whatsappHref(whatsappNumber, "Hi Ganga Vedha — I'd like to book a trip.");
  const closedIndex = useRotatingIndex(closedServices.length);

  React.useEffect(() => {
    function onDown(e: PointerEvent) {
      const t = e.target as Node;
      if (raftRef.current && !raftRef.current.contains(t)) setRaftOpen(false);
      if (advRef.current && !advRef.current.contains(t)) setAdvOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setRaftOpen(false);
        setAdvOpen(false);
        setMenuOpen(false);
      }
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
              <div className="absolute left-0 top-full mt-1 w-60 overflow-hidden rounded-lg bg-canvas p-1.5 shadow-lg">
                {RAFTING_LINKS.map(([label, href]) => (
                  <Link
                    key={label}
                    href={href}
                    onClick={() => setRaftOpen(false)}
                    className="block rounded-sm px-3 py-2.5 text-small font-semibold text-ink no-underline transition-colors hover:bg-granite-100"
                  >
                    {label}
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
          <div ref={advRef} className="relative">
            <button
              type="button"
              onClick={() => setAdvOpen((v) => !v)}
              aria-expanded={advOpen}
              aria-haspopup="true"
              className="inline-flex h-11 items-center gap-1.5 rounded-md px-2.5 text-small font-semibold text-ink-muted transition-colors hover:bg-granite-100 hover:text-ink"
            >
              Adventures
              <ChevronDown
                className={cn("size-4 transition-transform", advOpen && "rotate-180")}
                aria-hidden
              />
            </button>
            {advOpen && (
              <div className="absolute left-0 top-full mt-1 w-64 overflow-hidden rounded-lg bg-canvas p-1.5 shadow-lg">
                <Link
                  href="/adventures"
                  onClick={() => setAdvOpen(false)}
                  className="block rounded-sm px-3 py-2.5 text-small font-semibold text-ink no-underline transition-colors hover:bg-granite-100"
                >
                  All adventures
                </Link>
                {bungeeBrands.length > 0 && (
                  <>
                    <p className="px-3 pt-3 pb-1 text-label uppercase text-ink-faint">
                      Bungee operators
                    </p>
                    {bungeeBrands.map((b) => (
                      <Link
                        key={b.slug}
                        href={`/adventures?brand=${b.slug}`}
                        onClick={() => setAdvOpen(false)}
                        className="block rounded-sm px-3 py-2.5 text-small font-semibold text-ink no-underline transition-colors hover:bg-granite-100"
                      >
                        {b.name}
                      </Link>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
          {[
            ["Packages", "/packages"],
            ["Stays", "/stays"],
            ["Rentals", "/rentals"],
            ["Gallery", "/gallery"],
            ["About", "/about"],
            ["Contact", "/contact"],
          ].map(([label, href]) => (
            <Link
              key={label}
              href={href}
              className="inline-flex h-11 items-center rounded-md px-2.5 text-small font-semibold text-ink-muted no-underline transition-colors hover:bg-granite-100 hover:text-ink"
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {closedServices.length > 0 && (
            <AvailabilityPill
              open={false}
              label={`${SERVICE_SHORT_NAME[closedServices[closedIndex]] ?? closedServices[closedIndex]} closed`}
              className="hidden sm:inline-flex"
            />
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
              <p className="px-2 pb-2 text-label uppercase text-ink-faint">Rafting</p>
              {RAFTING_LINKS.map(([label, href]) => (
                <Link
                  key={label}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className="flex min-h-12 items-center rounded-md px-2 text-small font-semibold text-ink no-underline"
                >
                  {label}
                </Link>
              ))}
              <Link
                href="/rafting"
                onClick={() => setMenuOpen(false)}
                className="flex min-h-12 items-center rounded-md px-2 text-small font-semibold text-link no-underline"
              >
                Compare all stretches
              </Link>

              <p className="mt-4 border-t border-hairline px-2 pb-2 pt-4 text-label uppercase text-ink-faint">
                Adventures
              </p>
              <Link
                href="/adventures"
                onClick={() => setMenuOpen(false)}
                className="flex min-h-12 items-center rounded-md px-2 text-small font-semibold text-ink no-underline"
              >
                All adventures
              </Link>
              {bungeeBrands.map((b) => (
                <Link
                  key={b.slug}
                  href={`/adventures?brand=${b.slug}`}
                  onClick={() => setMenuOpen(false)}
                  className="flex min-h-12 items-center rounded-md px-2 text-small font-semibold text-ink no-underline"
                >
                  {b.name}
                </Link>
              ))}

              <div className="mt-4 border-t border-hairline pt-4">
                {[
                  ["Packages", "/packages"],
                  ["Stays & destinations", "/stays"],
                  ["Car & bike rental", "/rentals"],
                  ["Gallery", "/gallery"],
                  ["About us", "/about"],
                  ["Contact", "/contact"],
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
  const node = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="closure-title"
      // Same scrim convention as the admin `<Modal>` — a dimmed, blurred backdrop
      // the page stays visible through, not a near-opaque field that reads as a
      // separate screen. The card below is the modal; this is only the backdrop.
      className="fixed inset-0 z-(--z-toast) grid place-items-center overflow-y-auto bg-granite-950/55 px-5 py-12 backdrop-blur-[3px]"
    >
      <div className="mx-auto w-full max-w-lg rounded-lg bg-jade-950 p-10 text-center text-white shadow-xl">
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

  // `fixed` positions relative to the viewport only when every ancestor is
  // free of a transform/filter/perspective — a hovered `Card interactive`
  // (its `hover:-translate-y-0.5`) creates exactly that, which trapped this
  // inside the card instead of covering the screen. A portal to `document.body`
  // sidesteps the whole class of ancestor-styling bug rather than chasing it
  // through every possible card, and is why this is client-only (`ClosureLink`
  // and `ClosureTrigger` only ever mount it after a click, well past hydration,
  // so `document` is always there).
  return createPortal(node, document.body);
}

/** Escape-to-close and background-scroll-lock, shared by every closure trigger below. */
function useModalChrome(open: boolean, close: () => void) {
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
}

/**
 * Sits where a "Book now" button would be, for a listing that can't take one
 * right now. Nothing shows on its own when the page loads — the modal only
 * appears if a visitor actually presses this, i.e. tries to book. Plain local
 * state, not a remembered dismissal: each press is a fresh attempt, not a
 * one-time notice there's ever a reason to suppress on a later visit.
 */
export function ClosureTrigger({
  closure,
  children = "Bookings closed — tap to see why",
  className = "w-full rounded-md bg-granite-100 p-4 text-center text-small font-semibold text-ink-muted transition-colors hover:bg-granite-200",
}: {
  closure: Closure;
  /** The clickable content — the default is the booking-panel label, but this
   * wraps just as well around a photo so the same "why" is reachable from
   * there too. */
  children?: React.ReactNode;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const close = React.useCallback(() => setOpen(false), []);
  useModalChrome(open, close);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {children}
      </button>
      {open && (
        <ClosureNoticeVisual
          icon={closure.icon}
          title={closure.title}
          body={closure.body}
          footnote={closure.footnote}
          ctaLabel={closure.ctaLabel}
          onDismiss={close}
        />
      )}
    </>
  );
}

/**
 * Wraps a link to a closed listing's own page — its photo, its name, its
 * "Details" CTA. Pressing it shows the closure card instead of navigating
 * straight there; "Got it" is what actually takes the visitor to the page,
 * every single time, never suppressed after a first look. An open listing
 * never renders this at all — its links stay plain `<Link>`s.
 */
export function ClosureLink({
  closure,
  href,
  children,
  className,
}: {
  closure: Closure;
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const proceed = React.useCallback(() => {
    setOpen(false);
    router.push(href);
  }, [router, href]);
  useModalChrome(open, proceed);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {children}
      </button>
      {open && (
        <ClosureNoticeVisual
          icon={closure.icon}
          title={closure.title}
          body={closure.body}
          footnote={closure.footnote}
          ctaLabel={closure.ctaLabel}
          onDismiss={proceed}
        />
      )}
    </>
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

