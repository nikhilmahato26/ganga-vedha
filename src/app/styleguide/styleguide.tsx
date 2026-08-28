"use client";

import * as React from "react";
import {
  ArrowRight,
  Clock,
  MapPin,
  MessageCircle,
  Route,
  Trash2,
} from "lucide-react";
import {
  Accordion,
  Alert,
  AvailabilityPill,
  Breadcrumb,
  Button,
  Card,
  CardBody,
  Checkbox,
  Chip,
  EmptyState,
  Field,
  GradeChip,
  Input,
  LinkButton,
  MediaFrame,
  Modal,
  Radio,
  Rating,
  Select,
  SectionHeading,
  Skeleton,
  StatRow,
  Switch,
  Table,
  Tabs,
  TableScroller,
  Td,
  Textarea,
  Th,
  ToastCard,
  ToastProvider,
  type ToastTone,
  Tr,
  useToast,
} from "@/components/ui";
import { formatDuration, formatINR, formatKm } from "@/lib/format";

/* ── page chrome ─────────────────────────────────────────────────────────── */

function Block({
  id,
  title,
  note,
  children,
}: {
  id: string;
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-hairline py-14">
      <SectionHeading as="h2" title={title} description={note} />
      <div className="mt-8">{children}</div>
    </section>
  );
}

function Swatch({ name, varName }: { name: string; varName: string }) {
  return (
    <div className="min-w-0">
      <div
        className="h-14 rounded-sm shadow-xs"
        style={{ backgroundColor: `var(${varName})` }}
      />
      <p className="mt-1.5 truncate text-caption font-semibold text-ink">{name}</p>
      <p className="truncate text-micro text-ink-faint tabular">{varName}</p>
    </div>
  );
}

function Ramp({ name, steps }: { name: string; steps: number[] }) {
  return (
    <div>
      <p className="mb-2 text-label text-ink-faint uppercase">{name}</p>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-11">
        {steps.map((s) => (
          <Swatch key={s} name={String(s)} varName={`--color-${name}-${s}`} />
        ))}
      </div>
    </div>
  );
}

/* ── interactive demos ───────────────────────────────────────────────────── */

function ToastDemo() {
  const { toast } = useToast();
  return (
    <div className="flex flex-wrap gap-3">
      <Button
        variant="outline"
        onClick={() =>
          toast({
            tone: "success",
            title: "Enquiry sent",
            body: "Reference GV-7Q4KD2. We'll message you on WhatsApp.",
          })
        }
      >
        Success
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast({
            tone: "error",
            title: "That phone number isn't valid",
            body: "Indian mobile numbers are 10 digits starting with 6, 7, 8 or 9.",
          })
        }
      >
        Error (persists)
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast({ tone: "warning", title: "Rafting closes in 6 days" })
        }
      >
        Warning
      </Button>
      <Button
        variant="outline"
        onClick={() => toast({ tone: "info", title: "Draft saved" })}
      >
        Info
      </Button>
    </div>
  );
}

function ModalDemo() {
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Open enquiry dialog
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Enquire about 16 km from Shivpuri"
        description="We'll confirm on WhatsApp within a few hours."
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              loading={busy}
              onClick={() => {
                setBusy(true);
                window.setTimeout(() => {
                  setBusy(false);
                  setOpen(false);
                }, 1200);
              }}
            >
              Send enquiry
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Your name" required>
            <Input placeholder="Aarav Sharma" autoComplete="name" />
          </Field>
          <Field label="Phone" required hint="We message here, we don't call.">
            <Input
              placeholder="98765 43210"
              inputMode="numeric"
              autoComplete="tel"
            />
          </Field>
        </div>
      </Modal>
    </>
  );
}

/* ── the page ────────────────────────────────────────────────────────────── */

const NAV = [
  ["colour", "Colour"],
  ["type", "Type"],
  ["buttons", "Buttons"],
  ["chips", "Chips & status"],
  ["controls", "Controls"],
  ["notices", "Notices"],
  ["media", "Media"],
  ["cards", "Cards"],
  ["forms", "Forms"],
  ["disclosure", "Disclosure"],
  ["overlays", "Overlays"],
  ["data", "Data"],
  ["states", "States"],
  ["surfaces", "Surfaces & motion"],
] as const;

export function Styleguide() {
  return (
    <ToastProvider>
      <div className="min-h-dvh bg-canvas">
        <header className="border-b border-hairline bg-canvas-sunk">
          <div className="container-page py-12">
            <h1 className="text-display-lg text-ink">Ganga Vedha design system</h1>
            <p className="mt-4 measure text-ink-muted">
              Phase 0. The adventure-booking category standard, built to the craft
              level of Klook, GetYourGuide and Viator. Light ground, because the
              visitor is on a phone in Himalayan morning sun. Every contrast pair
              below is measured, not estimated.
            </p>
            <nav className="rail scrollbar-none mt-8 -mx-1 gap-2 px-1" aria-label="Sections">
              {NAV.map(([id, label]) => (
                <a
                  key={id}
                  href={`#${id}`}
                  className="rounded-full bg-canvas px-3.5 py-2 text-small font-semibold whitespace-nowrap text-ink-muted no-underline shadow-xs transition-colors hover:text-ink"
                >
                  {label}
                </a>
              ))}
            </nav>
          </div>
        </header>

        <main className="container-page pb-24">
          {/* ── Colour ───────────────────────────────────────────────────── */}
          <Block
            id="colour"
            title="Colour"
            note="Jade is the brand anchor — the Ganga at Rishikesh is genuinely jade-teal. Rescue orange is the single action colour, lifted off a life jacket rather than off a competitor."
          >
            <div className="space-y-8">
              <Ramp
                name="jade"
                steps={[50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]}
              />
              <Ramp
                name="ember"
                steps={[50, 100, 200, 300, 400, 500, 600, 700, 800, 900]}
              />
              <Ramp
                name="granite"
                steps={[50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]}
              />

              <div>
                <p className="mb-2 text-label text-ink-faint uppercase">
                  Availability &amp; grade
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
                  <Swatch name="open" varName="--color-open" />
                  <Swatch name="closed" varName="--color-closed" />
                  <Swatch name="danger" varName="--color-danger" />
                  <Swatch name="caution" varName="--color-caution" />
                  <Swatch name="info" varName="--color-info" />
                  <Swatch name="easy" varName="--color-grade-easy" />
                  <Swatch name="moderate" varName="--color-grade-moderate" />
                  <Swatch name="challenging" varName="--color-grade-challenging" />
                </div>
              </div>

              <TableScroller label="Measured contrast ratios">
                <Table>
                  <thead>
                    <tr>
                      <Th>Pair</Th>
                      <Th className="text-right">Ratio</Th>
                      <Th>Use</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["ink on canvas", "16.20", "Body and headings"],
                      ["ink-muted on canvas", "6.38", "Secondary text"],
                      ["ink-faint on canvas", "4.81", "Labels, placeholders"],
                      ["white on cta (ember-600)", "4.58", "Primary button fill"],
                      ["white on jade-700", "6.91", "Secondary button fill"],
                      ["link (ember-700) on canvas", "6.32", "Inline links"],
                      ["white on open fill (jade-700)", "6.91", "Running today"],
                      ["white on closed fill (granite-900)", "16.20", "Bookings closed"],
                      ["danger on danger-soft", "6.57", "Errors, destructive"],
                      ["grade-easy on soft", "5.14", "Easy"],
                      ["grade-moderate on soft", "5.38", "Moderate"],
                      ["grade-challenging on soft", "6.57", "Challenging"],
                    ].map(([pair, ratio, use]) => (
                      <Tr key={pair}>
                        <Td className="font-medium text-ink">{pair}</Td>
                        <Td className="text-right tabular font-semibold text-open">
                          {ratio}:1
                        </Td>
                        <Td className="text-ink-muted">{use}</Td>
                      </Tr>
                    ))}
                  </tbody>
                </Table>
              </TableScroller>
              <p className="text-small text-ink-faint">
                ember-500 is the most vivid orange in the ramp but reaches only
                3.49:1 on white, so it is a surface and hover tone — never a text
                or button fill. Anything carrying white text uses <code>cta</code>.
                Rating stars use <code>--color-star</code>, an amber held well
                away from the rescue orange so the action colour stays singular.
              </p>
            </div>
          </Block>

          {/* ── Type ─────────────────────────────────────────────────────── */}
          <Block
            id="type"
            title="Type"
            note="One family, Archivo, with its width axis doing the display work. A second face would cost a round-trip on 4G and buy nothing."
          >
            <div className="space-y-7">
              {[
                ["display-xl", "text-display-xl", "Rishikesh, by the kilometre"],
                ["display-lg", "text-display-lg", "Adventures made honest"],
                ["display-md", "text-display-md", "Choose your stretch"],
                ["title", "text-title", "16 km from Shivpuri"],
                ["subtitle", "text-subtitle", "Most-loved route on the Ganga"],
                ["body", "text-body", "Splashy rapids and calm stretches, ideal for groups and first-timers who want the real thing without the fear."],
                ["small", "text-small text-ink-muted", "Includes safety gear, guide and riverside changing rooms."],
                ["caption", "text-caption text-ink-faint", "Distance · Duration · per person"],
                ["micro", "text-micro text-ink-faint tabular", "--color-jade-700"],
                ["label", "text-label uppercase text-ink-faint", "Distance"],
              ].map(([name, cls, sample]) => (
                <div
                  key={name}
                  className="grid gap-2 sm:grid-cols-[9rem_1fr] sm:items-baseline"
                >
                  <p className="text-caption font-semibold text-ink-faint tabular">
                    {name}
                  </p>
                  <p className={cls as string}>{sample}</p>
                </div>
              ))}
              <div className="grid gap-2 sm:grid-cols-[9rem_1fr] sm:items-baseline">
                <p className="text-caption font-semibold text-ink-faint">
                  tabular
                </p>
                <p className="tabular text-title">
                  ₹1,590 · ₹2,490 · 12 km · 16 km · 4.8
                </p>
              </div>
            </div>
          </Block>

          {/* ── Buttons ──────────────────────────────────────────────────── */}
          <Block
            id="buttons"
            title="Buttons"
            note="Filled buttons carry a shadow and no border; outline and ghost carry a border and no shadow. Elevation is declared once."
          >
            <div className="space-y-6">
              {(["primary", "secondary", "outline", "ghost", "danger"] as const).map(
                (variant) => (
                  <div key={variant} className="flex flex-wrap items-center gap-3">
                    <span className="w-20 text-small font-semibold text-ink-faint">
                      {variant}
                    </span>
                    <Button variant={variant} size="sm">
                      Small
                    </Button>
                    <Button variant={variant}>
                      Book now <ArrowRight className="size-4" aria-hidden />
                    </Button>
                    <Button variant={variant} size="lg">
                      Large
                    </Button>
                    <Button variant={variant} loading>
                      Sending
                    </Button>
                    <Button variant={variant} disabled>
                      Disabled
                    </Button>
                  </div>
                ),
              )}
              <div className="flex flex-wrap items-center gap-3">
                <span className="w-20 text-small font-semibold text-ink-faint">
                  link
                </span>
                <LinkButton href="#buttons" variant="secondary">
                  <MessageCircle className="size-4" aria-hidden /> WhatsApp us
                </LinkButton>
              </div>
              <div className="max-w-sm">
                <Button block size="lg">
                  Full-width, for the mobile sticky bar
                </Button>
              </div>
              <p className="measure text-small text-ink-faint">
                <strong className="font-semibold text-ink-muted">Size rule:</strong>{" "}
                <code>sm</code> is 36px tall and belongs to dense admin tables and
                toolbars only. Anything a visitor taps on the public site uses{" "}
                <code>md</code> or larger, so every public target clears 44px on a
                phone.
              </p>
            </div>
          </Block>

          {/* ── Chips ────────────────────────────────────────────────────── */}
          <Block
            id="chips"
            title="Chips &amp; status"
            note="Grade owns a colour by law, and never travels without its word — the meaning has to survive colour blindness and a greyscale print."
          >
            <div className="space-y-6">
              <div className="flex flex-wrap gap-2">
                <GradeChip grade="easy" />
                <GradeChip grade="moderate" />
                <GradeChip grade="challenging" />
                <Chip tone="ember">Most popular</Chip>
                <Chip tone="jade">Best for beginners</Chip>
                <Chip tone="info" icon={<Clock />}>
                  {formatDuration(150)}
                </Chip>
                <Chip tone="neutral" icon={<Route />}>
                  {formatKm(16)}
                </Chip>
              </div>
              <div className="flex flex-wrap items-center gap-4 rounded-lg bg-jade-950 p-5">
                <Chip tone="onMedia" icon={<Clock />}>
                  2 hr 30 min
                </Chip>
                <GradeChip grade="moderate" onMedia />
                <Chip tone="onMedia">★ 4.8</Chip>
                <span className="text-small text-jade-200">
                  Chips that sit on photography stay opaque, not glassy.
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <AvailabilityPill open />
                <AvailabilityPill open={false} />
                <AvailabilityPill open={false} label="Paused for monsoon" />
                <Rating value={4.8} count={1129} />
                <Rating value={4.6} size="sm" />
              </div>

              <div className="rounded-lg bg-canvas-sunk p-5">
                <p className="text-subtitle text-ink">
                  Grade and availability can never be mistaken for each other
                </p>
                <p className="mt-1.5 measure text-small text-ink-muted">
                  An earlier build gave the two the same three colours, so a red
                  chip meant either &ldquo;hard rapids&rdquo; or &ldquo;shut&rdquo;. They are now
                  separated by treatment, not just hue: availability is{" "}
                  <strong className="font-semibold text-ink">filled</strong>, grade
                  is <strong className="font-semibold text-ink">soft-tinted</strong>.
                  Side by side, in the row a card actually renders:
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <GradeChip grade="challenging" />
                  <AvailabilityPill open={false} />
                  <span className="text-caption text-ink-faint">
                    ← both mean something different, and now look it
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <GradeChip grade="easy" />
                  <AvailabilityPill open />
                </div>
              </div>
            </div>
          </Block>

          {/* ── Controls ─────────────────────────────────────────────────── */}
          <Block
            id="controls"
            title="Controls"
            note="A switch takes effect immediately — publishing a hotel, opening bookings. A checkbox waits for Save. Using the wrong one is how a client publishes something by accident."
          >
            <div className="grid max-w-3xl gap-8 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-label uppercase text-ink-faint">Checkbox</p>
                <Checkbox
                  label="Show on the landing page"
                  description="Appears in the three-card row."
                  defaultChecked
                />
                <Checkbox label="Include safety gear in the price" />
                <Checkbox label="Partially selected" indeterminate />
                <Checkbox label="Locked by an active closure" disabled />
              </div>
              <div>
                <p className="mb-2 text-label uppercase text-ink-faint">Radio</p>
                <Radio name="sg-grade" label="Easy" defaultChecked />
                <Radio name="sg-grade" label="Moderate" />
                <Radio name="sg-grade" label="Challenging" />
              </div>
              <div className="sm:col-span-2">
                <p className="mb-2 text-label uppercase text-ink-faint">Switch</p>
                <Switch
                  label="Rafting bookings"
                  description="Turning this off shows the monsoon notice on every rafting card and stretch page."
                  defaultChecked
                />
                <Switch
                  label="Hotel bookings"
                  description="Scoped separately, so closing rafting never closes hotels."
                  defaultChecked
                />
              </div>
            </div>
          </Block>

          {/* ── Notices ──────────────────────────────────────────────────── */}
          <Block
            id="notices"
            title="Notices"
            note="The river-status strap and a closed-stretch notice are not modals. They have to be readable in place without interrupting anyone — which is exactly what a dialog is wrong for."
          >
            <div className="space-y-4">
              <Alert
                tone="success"
                title="Running today"
                action={
                  <Button variant="outline">See stretches</Button>
                }
              >
                Shivpuri gauge normal. All five rafting stretches are open.
              </Alert>
              <Alert tone="caution" title="Rafting closes in 6 days">
                The Ganga is expected to shut around mid-June. Bookings after that
                date will be held rather than confirmed.
              </Alert>
              <Alert
                tone="closed"
                title="Rafting paused from mid-September"
                action={
                  <Button variant="outline">Notify me</Button>
                }
              >
                Monsoon rains and high water on the Ganga. Bookings reopen once
                conditions are safe.
              </Alert>
              <Alert tone="danger" title="That phone number isn&rsquo;t valid">
                Indian mobile numbers are 10 digits starting with 6, 7, 8 or 9.
              </Alert>

              <div className="pt-4">
                <Breadcrumb
                  items={[
                    { label: "Home", href: "/" },
                    { label: "Rafting", href: "/rafting" },
                    { label: "16 km from Shivpuri" },
                  ]}
                />
              </div>
            </div>
          </Block>

          {/* ── Media ────────────────────────────────────────────────────── */}
          <Block
            id="media"
            title="Media"
            note="Every photograph on the site enters through one component, which owns the aspect ratio, the scrim that keeps chips legible over any frame, the blur-up placeholder, and the honest empty state for a product nobody has photographed yet."
          >
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <Card>
                  <MediaFrame media={null} ratio="card">
                    <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
                      <GradeChip grade="moderate" size="sm" onMedia />
                      <Chip tone="onMedia" size="sm" icon={<Clock />}>
                        2 hr 30 min
                      </Chip>
                    </div>
                  </MediaFrame>
                </Card>
                <p className="mt-2.5 text-caption text-ink-faint">
                  Empty state — no photograph supplied yet
                </p>
              </div>

              <div>
                <Card>
                  {/* A flat stand-in, not a photograph: the point is that the
                      chip rows stay legible against a BRIGHT frame, which is
                      exactly where an unscrimmed chip fails. */}
                  <MediaFrame
                    media={null}
                    ratio="card"
                    className="bg-[linear-gradient(160deg,#eaf6ff_0%,#bfe3f2_38%,#7fc4d8_66%,#e8f4ea_100%)]"
                  >
                    <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
                      <GradeChip grade="challenging" size="sm" onMedia />
                      <Chip tone="onMedia" size="sm" icon={<Clock />}>
                        3 hr 30 min
                      </Chip>
                    </div>
                    <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3">
                      <Chip tone="onMedia" size="sm">
                        Best for thrill seekers
                      </Chip>
                      <span className="rounded-full bg-canvas px-2.5 py-1 shadow-sm">
                        <Rating value={4.7} size="sm" />
                      </span>
                    </div>
                  </MediaFrame>
                </Card>
                <p className="mt-2.5 text-caption text-ink-faint">
                  Scrim on, over a bright stand-in frame
                </p>
              </div>

              <div>
                <Card>
                  <MediaFrame
                    media={null}
                    ratio="card"
                    scrim={false}
                    className="bg-[linear-gradient(160deg,#eaf6ff_0%,#bfe3f2_38%,#7fc4d8_66%,#e8f4ea_100%)]"
                  >
                    <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
                      <GradeChip grade="challenging" size="sm" onMedia />
                      <Chip tone="onMedia" size="sm" icon={<Clock />}>
                        3 hr 30 min
                      </Chip>
                    </div>
                    <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3">
                      <Chip tone="onMedia" size="sm">
                        Best for thrill seekers
                      </Chip>
                      <span className="rounded-full bg-canvas px-2.5 py-1 shadow-sm">
                        <Rating value={4.7} size="sm" />
                      </span>
                    </div>
                  </MediaFrame>
                </Card>
                <p className="mt-2.5 text-caption text-ink-faint">
                  Scrim off — the control, for comparison
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              <div>
                <Card>
                  <MediaFrame
                    media={null}
                    ratio="card"
                    className="bg-[linear-gradient(160deg,#eaf6ff_0%,#bfe3f2_38%,#7fc4d8_66%,#e8f4ea_100%)]"
                  >
                    <div className="absolute inset-0 bg-granite-950/55" aria-hidden />
                    <div className="absolute inset-0 grid place-items-center px-4 text-center">
                      <AvailabilityPill open={false} label="Paused for monsoon" onMedia />
                    </div>
                  </MediaFrame>
                </Card>
                <p className="mt-2.5 measure text-caption text-ink-faint">
                  Closed over media: the pill inverts to a light fill. The dark
                  filled version has no figure-ground against a scrim, which
                  makes the loudest state in the system the quietest thing on the
                  card.
                </p>
              </div>
              <div className="flex flex-col justify-center gap-4 rounded-lg bg-canvas-sunk p-6">
                <p className="text-subtitle text-ink">Ratios</p>
                <ul className="space-y-1.5 text-small text-ink-muted">
                  <li>
                    <code>card</code> 4:3 — the three-card row and stretch lists
                  </li>
                  <li>
                    <code>wide</code> 16:9 — gallery tiles
                  </li>
                  <li>
                    <code>hero</code> 4:5 → 16:10 → 21:9 — the landing hero, portrait
                    on a phone
                  </li>
                  <li>
                    <code>portrait</code> 3:4 and <code>square</code> — hotel rooms
                  </li>
                </ul>
              </div>
            </div>
          </Block>

          {/* ── Cards ────────────────────────────────────────────────────── */}
          <Block
            id="cards"
            title="Cards"
            note="The product card anatomy the landing page is built from. Radius 14px, elevation by shadow alone, and the number the visitor argues about is the biggest thing in the block."
          >
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  name: "24 km from Marine Drive",
                  grade: "challenging" as const,
                  km: 24,
                  min: 210,
                  price: 2490,
                  compare: 2900,
                  rating: 4.7,
                  count: 412,
                  badge: "Best for thrill seekers",
                  open: true,
                  blurb:
                    "Big-water rapids, cliff views and almost no flat stretches.",
                },
                {
                  name: "16 km from Shivpuri",
                  grade: "moderate" as const,
                  km: 16,
                  min: 150,
                  price: 1590,
                  compare: null,
                  rating: 4.8,
                  count: 1129,
                  badge: "Most popular",
                  open: true,
                  blurb:
                    "Splashy rapids and calm stretches, ideal for groups and first-timers.",
                },
                {
                  name: "12 km from Brahmpuri",
                  grade: "easy" as const,
                  km: 12,
                  min: 120,
                  price: 1290,
                  compare: null,
                  rating: 4.6,
                  count: 288,
                  badge: "Best for beginners",
                  open: false,
                  blurb:
                    "A gentle introduction — scenic floats and calm water, good with kids.",
                },
              ].map((s) => (
                <Card key={s.name} interactive>
                  {/* Real photography drops straight in here in Phase 3; the
                      scrim and ratio already belong to MediaFrame. */}
                  <MediaFrame media={null} ratio="card">
                    {/* The closed scrim sits BEHIND the chips, never over them.
                        Painting it across the whole frame took the grade chip
                        down to 1.95:1 — on the state that covers every rafting
                        card for four monsoon months. */}
                    {!s.open && (
                      <div className="absolute inset-0 bg-granite-950/55" aria-hidden />
                    )}
                    <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
                      <GradeChip grade={s.grade} size="sm" onMedia />
                      <Chip tone="onMedia" size="sm" icon={<Clock />}>
                        {formatDuration(s.min)}
                      </Chip>
                    </div>
                    {!s.open && (
                      <div className="absolute inset-0 grid place-items-center px-4 text-center">
                        <AvailabilityPill open={false} label="Paused for monsoon" onMedia />
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3">
                      <Chip tone="onMedia" size="sm">
                        {s.badge}
                      </Chip>
                      <span className="rounded-full bg-canvas px-2.5 py-1 shadow-sm">
                        <Rating value={s.rating} size="sm" />
                      </span>
                    </div>
                  </MediaFrame>

                  <CardBody className="flex flex-col gap-4">
                    <div>
                      <h3 className="text-title text-ink">{s.name}</h3>
                      <p className="mt-1.5 text-small text-ink-muted">{s.blurb}</p>
                    </div>

                    <StatRow
                      items={[
                        {
                          label: "Distance",
                          value: formatKm(s.km),
                          icon: <Route />,
                        },
                        {
                          label: "Duration",
                          value: formatDuration(s.min),
                          icon: <Clock />,
                        },
                      ]}
                    />

                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <p className="text-display-md tabular leading-none text-ink">
                          {formatINR(s.price)}
                        </p>
                        <p className="mt-1.5 text-caption text-ink-faint">
                          {s.compare ? (
                            <>
                              <s className="tabular">{formatINR(s.compare)}</s> ·
                              per person
                            </>
                          ) : (
                            "per person"
                          )}
                        </p>
                      </div>
                      {s.open ? (
                        <Button>
                          Book now <ArrowRight className="size-4" aria-hidden />
                        </Button>
                      ) : (
                        <Button variant="outline" disabled>
                          Closed
                        </Button>
                      )}
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          </Block>

          {/* ── Forms ────────────────────────────────────────────────────── */}
          <Block
            id="forms"
            title="Forms"
            note="Errors name the problem and the recovery. Every control is at least 44px tall, because the client will be editing prices on a phone at the riverbank."
          >
            <div className="grid max-w-3xl gap-5 sm:grid-cols-2">
              <Field label="Your name" required>
                <Input placeholder="Aarav Sharma" autoComplete="name" />
              </Field>
              <Field
                label="Phone"
                required
                error="Indian mobile numbers are 10 digits starting with 6, 7, 8 or 9."
              >
                <Input defaultValue="12345" inputMode="numeric" />
              </Field>
              <Field label="Travel date" hint="Rafting runs mid-September to mid-June.">
                <Input type="date" />
              </Field>
              <Field label="Group size">
                <Select defaultValue="4">
                  {[1, 2, 4, 6, 8, 12, 20].map((n) => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? "person" : "people"}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Anything we should know?" className="sm:col-span-2">
                <Textarea placeholder="Two of us have never rafted before." />
              </Field>
              <Field label="Locked field" hint="Disabled controls stay readable.">
                <Input defaultValue="GV-7Q4KD2" disabled />
              </Field>
            </div>
          </Block>

          {/* ── Disclosure ───────────────────────────────────────────────── */}
          <Block
            id="disclosure"
            title="Disclosure"
            note="Both are built on the platform: the accordion is a <details>, so find-on-page can open it. A div-and-state version loses that, and a hotel's policies are exactly the thing people search for."
          >
            <div className="grid gap-10 lg:grid-cols-2">
              {/* min-w-0: grid children default to min-width:auto, so the tab
                  rail's content would otherwise widen the track past the page. */}
              <div className="min-w-0">
                <Tabs
                tabs={[
                  {
                    id: "overview",
                    label: "Overview",
                    content: (
                      <p className="measure text-ink-muted">
                        Sixteen kilometres from Shivpuri to Rishikesh, through Three
                        Blind Mice, Cross Fire and Roller Coaster.
                      </p>
                    ),
                  },
                  {
                    id: "included",
                    label: "What’s included",
                    content: (
                      <ul className="measure list-disc space-y-1.5 pl-5 text-ink-muted">
                        <li>Certified guide and safety kayaker</li>
                        <li>Helmet, life jacket and paddle</li>
                        <li>Changing rooms and lockers at the base</li>
                      </ul>
                    ),
                  },
                  {
                    id: "meet",
                    label: "Meeting point",
                    content: (
                      <p className="measure text-ink-muted">
                        Report at the Shivpuri base 30 minutes before your slot.
                      </p>
                    ),
                  },
                  ]}
                />
              </div>
              <Accordion
                className="min-w-0"
                items={[
                  {
                    q: "Do I need to know how to swim?",
                    a: "No. Everyone wears a life jacket and a guide is in every raft.",
                  },
                  {
                    q: "What is the minimum age?",
                    a: "14 for this stretch. The 12 km Brahmpuri run takes children from 10.",
                  },
                  {
                    q: "What happens if the river closes?",
                    a: "Your enquiry is held and we message you the moment bookings reopen.",
                  },
                ]}
              />
            </div>
          </Block>

          {/* ── Overlays ─────────────────────────────────────────────────── */}
          <Block
            id="overlays"
            title="Overlays"
            note="The dialog is a native <dialog>, so focus trapping, Escape and the top layer come from the platform rather than from a hand-rolled trap that gets it wrong."
          >
            <div className="space-y-8">
              <div className="flex flex-wrap items-center gap-6">
                <ModalDemo />
                <ToastDemo />
              </div>

              {/* Both overlays hide behind a trigger, which means neither of them
                  appears in a screenshot and neither can be regression-checked.
                  These static specimens render the same markup in place. */}
              <div className="grid gap-6 lg:grid-cols-2">
                <div>
                  <p className="mb-3 text-label uppercase text-ink-faint">
                    Dialog, rendered in place
                  </p>
                  <div className="rounded-lg bg-canvas shadow-xl">
                    <div className="flex items-start justify-between gap-4 px-6 pt-6">
                      <div>
                        <h3 className="text-title text-ink">
                          Enquire about 16 km from Shivpuri
                        </h3>
                        <p className="mt-1.5 text-small text-ink-muted">
                          We&rsquo;ll confirm on WhatsApp within a few hours.
                        </p>
                      </div>
                    </div>
                    <div className="grid gap-4 px-6 py-5 sm:grid-cols-2">
                      <Field label="Your name" required>
                        <Input placeholder="Aarav Sharma" readOnly />
                      </Field>
                      <Field label="Phone" required>
                        <Input placeholder="98765 43210" readOnly />
                      </Field>
                    </div>
                    <div className="flex justify-end gap-2 border-t border-hairline bg-canvas-sunk px-6 py-4">
                      <Button variant="ghost">Cancel</Button>
                      <Button>Send enquiry</Button>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-label uppercase text-ink-faint">
                    Toasts, rendered in place
                  </p>
                  {/* The real component, not a copy of its markup — a
                      hand-copied specimen is how a success toast ends up
                      showing the wrong icon. */}
                  <div className="flex flex-col gap-2">
                    {(
                      [
                        {
                          tone: "success",
                          title: "Enquiry sent",
                          body: "Reference GV-7Q4KD2. We\u2019ll message you on WhatsApp.",
                        },
                        {
                          tone: "error",
                          title: "That phone number isn\u2019t valid",
                          body: "Indian mobile numbers are 10 digits starting with 6, 7, 8 or 9.",
                        },
                        { tone: "warning", title: "Rafting closes in 6 days", body: undefined },
                        { tone: "info", title: "Draft saved", body: undefined },
                      ] as const satisfies readonly {
                        tone: ToastTone;
                        title: string;
                        body?: string;
                      }[]
                    ).map((t) => (
                      <ToastCard key={t.title} tone={t.tone} title={t.title} body={t.body} />
                    ))}
                  </div>
                  <p className="mt-3 measure text-small text-ink-faint">
                    The live toast layer is a manual popover, so it renders in the
                    browser&rsquo;s top layer above an open{" "}
                    <code>&lt;dialog&gt;</code>. Without that, a toast fired from
                    inside the enquiry dialog is invisible.
                  </p>
                </div>
              </div>

              <div>
                <p className="mb-3 text-label uppercase text-ink-faint">
                  Sticky mobile booking bar
                </p>
                <div className="relative overflow-hidden rounded-lg bg-canvas-sunk pt-10">
                  <div className="relative border-t border-hairline bg-canvas px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-display-md tabular leading-none text-ink">
                          {formatINR(1590)}
                        </p>
                        <p className="mt-1 text-caption text-ink-faint">per person</p>
                      </div>
                      <Button size="lg">
                        Book now <ArrowRight className="size-4" aria-hidden />
                      </Button>
                    </div>
                  </div>
                </div>
                <p className="mt-3 measure text-small text-ink-faint">
                  The shipped component pads with{" "}
                  <code>max(1rem, env(safe-area-inset-bottom))</code>, because{" "}
                  <code>viewportFit</code> is <code>cover</code> and an unpadded bar
                  sits under the home indicator.
                </p>
              </div>
            </div>
          </Block>

          {/* ── Data ─────────────────────────────────────────────────────── */}
          <Block
            id="data"
            title="Data"
            note="Wide tables scroll inside their own container and the region is focusable, so the page body never scrolls sideways and a keyboard can still reach the overflow."
          >
            <TableScroller label="Rafting stretches">
              <Table>
                <thead>
                  <tr>
                    <Th>Stretch</Th>
                    <Th>Grade</Th>
                    <Th className="text-right">Distance</Th>
                    <Th className="text-right">Duration</Th>
                    <Th className="text-right">Price</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["12 km from Brahmpuri", "easy", 12, 120, 1290, false],
                    ["16 km from Shivpuri", "moderate", 16, 150, 1590, true],
                    ["24 km from Marine Drive", "challenging", 24, 210, 2490, true],
                    ["32 km from Kaudiyala", "challenging", 32, 270, 3290, true],
                  ].map(([name, grade, km, min, price, open]) => (
                    <Tr key={String(name)}>
                      <Td className="font-semibold text-ink">{name as string}</Td>
                      <Td>
                        <GradeChip
                          grade={grade as "easy" | "moderate" | "challenging"}
                          size="sm"
                        />
                      </Td>
                      <Td className="text-right tabular">{formatKm(km as number)}</Td>
                      <Td className="text-right tabular">
                        {formatDuration(min as number)}
                      </Td>
                      <Td className="text-right tabular font-semibold">
                        {formatINR(price as number)}
                      </Td>
                      <Td>
                        <AvailabilityPill open={open as boolean} />
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </TableScroller>
          </Block>

          {/* ── States ───────────────────────────────────────────────────── */}
          <Block
            id="states"
            title="States"
            note="An empty panel with a shrug is a bug the client phones about. Every empty state names what is missing and what to do next."
          >
            <div className="grid gap-6 lg:grid-cols-2">
              <EmptyState
                icon={<MapPin />}
                title="No hotels yet"
                description="Add your first property and it appears on the site the moment you publish it."
                action={<Button>Add a hotel</Button>}
              />
              <Card elevation="flat">
                <CardBody className="space-y-3">
                  <Skeleton className="h-40 w-full" />
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                </CardBody>
              </Card>
            </div>
          </Block>

          {/* ── Surfaces ─────────────────────────────────────────────────── */}
          <Block
            id="surfaces"
            title="Surfaces &amp; motion"
            note="Shadows carry an offset and a soft blur — a zero-offset coloured halo is decoration, not depth. Every duration and easing below is a token, so motion stays consistent across the site and the admin panel."
          >
            <div className="space-y-10">
              <div className="grid grid-cols-2 gap-5 rounded-lg bg-canvas-sunk p-6 sm:grid-cols-5">
                {["xs", "sm", "md", "lg", "xl"].map((s) => (
                  <div key={s}>
                    <div
                      className="h-20 rounded-lg bg-canvas"
                      style={{ boxShadow: `var(--shadow-${s})` }}
                    />
                    <p className="mt-2 text-caption font-semibold text-ink-faint">
                      shadow-{s}
                    </p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
                {[
                  ["sm", "8px", "Chips, small controls"],
                  ["md", "10px", "Inputs, buttons"],
                  ["lg", "14px", "Cards, dialogs"],
                  ["xl", "18px", "Hero media"],
                ].map(([s, px, use]) => (
                  <div key={s}>
                    <div
                      className="h-16 bg-granite-200"
                      style={{ borderRadius: `var(--radius-${s})` }}
                    />
                    <p className="mt-2 text-caption font-semibold text-ink">
                      rounded-{s} · {px}
                    </p>
                    <p className="text-micro text-ink-faint">{use}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ["--ease-out-expo", "Entrances, dialogs"],
                  ["--ease-out-quart", "Hover, colour change"],
                  ["--ease-out-quint", "The one authored moment"],
                ].map(([token, use]) => (
                  <div key={token} className="rounded-md bg-canvas-sunk p-4">
                    <p className="text-small font-semibold text-ink">{token}</p>
                    <p className="mt-0.5 text-caption text-ink-faint">{use}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-lg bg-canvas-sunk p-6">
                <p className="text-subtitle text-ink">Browser surfaces</p>
                <p className="mt-1.5 measure text-small text-ink-muted">
                  Text selection, the caret, the scrollbar and the focus ring are
                  themed from the palette rather than left at browser defaults.
                  Select this paragraph, tab through this page, or scroll the
                  table above to see them.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Button variant="outline" size="sm">
                    Tab to me
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="size-4" aria-hidden /> And me
                  </Button>
                </div>
              </div>
            </div>
          </Block>
        </main>
      </div>
    </ToastProvider>
  );
}
