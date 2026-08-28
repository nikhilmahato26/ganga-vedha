# Design

<!-- impeccable:design-schema 1 -->

Written from the built system at the end of Phase 0, not before it. Every colour
pair, size and behaviour below was measured in a browser against the shipped
build, not specified and hoped for.

## Direction

**The adventure-booking category standard, played straight.** Offered a dealt
direction round and then a bolder foreign-form hand, the user deliberately took
the canon exit. Conventions are embraced without irony: full-bleed hero, dark
scrim, bold sans headline, warm CTA, rounded cards with grade/duration/rating
chips, trust row, reviews, sticky WhatsApp. Ganga Vedha's identity lives in
palette, type and detail — not in refusing the arrangement.

**Craft bar: Klook, GetYourGuide, Viator.** Named by the user. Their execution
level is what this build is measured against.

**Thesis.** Rishikesh sold by the kilometre, with the river's real status stated
before anything is sold. The category habit this refuses is a year-round live
"Book Now" over a hero video while the Ganga is shut for monsoon.

**Light ground, chosen from the use scene:** a traveller squinting at a phone in
bright Himalayan morning sun. There is no dark mode; a dark UI would be both
unreadable in that scene and the category default.

## Colour

Tokens live in `src/app/globals.css` under `@theme`.

| Role | Token | Value |
|---|---|---|
| Brand anchor | `--color-jade-50 … 950` | Ganga jade. The river at Rishikesh is genuinely jade-teal. |
| Action | `--color-cta` / `--color-cta-hover` | `#d93b0c` / `#b42d0c`. Rescue orange, lifted off a life jacket. |
| Neutral | `--color-granite-0 … 950` | Faint green cast so it sits with jade. |
| Ink | `--color-ink` / `-muted` / `-faint` | `#1b2220` / `#55625d` / `#687570` |
| On dark | `--color-ink-on-dark` / `-muted`, `--color-hairline-on-dark` | For type over a scrimmed photograph. |

`--color-ember-500` is the most vivid orange in the ramp but reaches only
3.49:1 on white. It is a **surface and hover tone only** — never a text or
button fill. Anything carrying white text uses `--color-cta`.

### The rule that matters most

**Grade and availability must never be confusable.** An earlier build gave them
identical triples, so a red chip meant either "hard rapids" or "bookings shut" —
on a site whose whole thesis is honest availability. They are now separated
**structurally, not by hue**, because a hue-only fix left teal and green 24 RGB
units apart:

- **Availability chips are filled** with white text. `--color-open` `#12655b`
  (6.91:1), `--color-closed` `#1b2220` (16.20:1).
- **Grade chips are soft-tinted.** `--color-grade-easy` `#0b7549`,
  `-moderate` `#8f5600`, `-challenging` `#a3211b`, each on its own soft ground.
- **`--color-danger` `#a3211b` is a third role** — form errors and destructive
  actions. Red no longer does double duty with availability.

Grade **never travels without its word**, so the meaning survives colour
blindness and a greyscale print.

**On media, the availability pill inverts to a light fill.** A dark filled pill
over a dark scrim has no figure-ground and turns the loudest state in the system
into the quietest thing on the card. `AvailabilityPill` takes `onMedia`.

`--color-star` `#9c6410` is deliberately held away from the CTA orange so the
action colour stays singular.

## Type

**One family: Archivo**, variable, `wdth` axis loaded. A second face would cost a
round-trip on 4G and buy nothing.

The width axis is **baked into the display steps** (`font-variation-settings:
"wdth" 112` on `.text-display-xl/lg/md`) rather than left to a utility somebody
has to remember to add.

`display-xl` → `display-lg` → `display-md` → `title` → `subtitle` → `body` →
`small` → `caption` → `micro` → `label`. Display steps are fluid via `clamp()`;
tracking floor is `-0.032em`.

`caption` and `micro` exist so dense cells stop reaching for arbitrary values —
`grep -rn "text-\[" src/` returns nothing.

Tabular figures are automatic on `th, td, time, data, output, .tabular`, so
every number a visitor compares — price, kilometres, duration, rating — lines up.

Body measure is enforced by `.measure` (68ch) and `.measure-tight` (52ch), not
hoped for.

## Surfaces

- **Radii:** `sm` 8px (chips, small controls), `md` 10px (inputs, buttons),
  `lg` 14px (cards, dialogs), `xl` 18px (hero media).
- **Elevation is declared once.** A surface carries a shadow **or** a border,
  never both — a 1px border under a wide soft shadow is the ghost card.
  `Card` takes `elevation="raised" | "flat" | "sunk"`.
- Shadows carry an offset and a soft blur. A zero-offset coloured halo is
  decoration, not depth.
- **Stacking is a scale, not a guess:** `--z-raised`, `--z-sticky`,
  `--z-header`, `--z-overlay`, `--z-toast`. No arbitrary `z-[…]` anywhere.
- **Safe areas:** `viewportFit` is `cover`, so `.pb-safe` / `.pt-safe` /
  `.px-safe` use `env(safe-area-inset-*)`. Anything pinned to the bottom uses
  them or it sits under the home indicator.

### Browser surfaces

Text selection, the caret, the scrollbar, the focus ring, underline offset, the
inline `<code>` chip and the native date picker indicator are all themed from
the palette. These are the parts nobody draws, and leaving them at browser
defaults is the cheapest tell that a page was assembled rather than built.

## Media

Every photograph enters through **one component**, `MediaFrame`:

- five aspect ratios (`card`, `wide`, `hero`, `square`, `portrait`) —
  `hero` is portrait on a phone and 21:9 on a desktop;
- `next/image` with `fill` + `sizes`, blur-up from the `media.placeholder`
  column already in the schema;
- `.scrim-media`, a two-gradient scrim top and bottom, which is what keeps chips
  legible over a **bright** frame — the case where an unscrimmed chip fails;
- an honest empty state for a product nobody has photographed yet.

A closed-state scrim always sits **behind** the chip rows, never over them.
Painting it across the whole frame once took a grade chip to 1.95:1 — on the
state that covers every rafting card for four monsoon months.

## Motion

`--duration-fast` 140ms, `--duration-base` 240ms, `--duration-slow` 420ms.
Easing is exponential: `--ease-out-expo`, `--ease-out-quart`, `--ease-out-quint`.
No bounce or elastic curves — they read dated, and the detector flags them.

Entrances start from an already-visible default, so a failed animation never
leaves content invisible. `prefers-reduced-motion` collapses every duration.

## Accessibility floor

- Body and control text ≥4.5:1, large text ≥3:1, measured with a resolver that
  flattens translucent stacks. Zero failures at 1440 and 390.
- **Public tap targets ≥44px.** `size="sm"` (36px) is for dense admin tables and
  toolbars only.
- Colour is never the sole signal: grade carries its word, availability carries
  a dot and a word.
- Overlays are native. The dialog is a `<dialog>`, so focus trapping, Escape and
  the top layer come from the platform. The accordion is `<details>`, so
  find-on-page can open a hotel's policies.
- The toast viewport is a `popover="manual"` element, so it enters the top layer
  **above** an open dialog. Without that, a toast fired from inside the enquiry
  modal is invisible.
- No horizontal page overflow at any width; wide tables scroll inside their own
  focusable region.

## Component inventory

`Button` · `LinkButton` · `Chip` · `GradeChip` · `Card` · `CardBody` ·
`SectionHeading` (no eyebrow slot, by design) · `StatRow` · `Field` · `Input` ·
`Textarea` · `Select` · `Checkbox` · `Radio` · `Switch` · `Modal` · `ToastCard` ·
`ToastProvider` · `Rating` · `AvailabilityPill` · `Skeleton` · `EmptyState` ·
`Table` family · `MediaFrame` · `Alert` · `Breadcrumb` · `StickyActionBar` ·
`Tabs` · `Accordion`.

**A switch takes effect immediately** (publishing a hotel, opening bookings);
**a checkbox waits for Save.** Using the wrong one is how a client publishes
something by accident.

**Loading is not disabled.** A loading button keeps full opacity and shows a
spinner; only a genuinely disabled one dims. `disabled:not-aria-busy:opacity-45`.

Not yet built, deliberately: the Cloudinary upload control, which needs
credentials and belongs to Phase 2.

## Refused

No eyebrow or kicker above a heading — `SectionHeading` has no slot for one. No
gradient text. No glassy decoration. No hard offset shadows. No nested cards. No
emoji standing in for icons (lucide, one stroke weight). No monospace as a
costume for "technical". No `feTurbulence` or sketch-style SVG. No section
numbers.

## Provenance

Direction seed `ca7695e6`, mode `persuade`, form `canon`. The contract is emitted
as an HTML comment from `src/app/layout.tsx` and survives the production build.
No rasters ship yet — there is no photography, and none was invented.
