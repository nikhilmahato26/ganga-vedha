import Link from "next/link";
import { ArrowRight, BedDouble, Mountain, ShieldCheck, Waves } from "lucide-react";
import {
  Alert,
  Card,
  CardBody,
  Chip,
  GradeChip,
  LinkButton,
  MediaFrame,
  Rating,
  SectionHeading,
  Table,
  TableScroller,
  Td,
  Th,
  Tr,
} from "@/components/ui";
import { AdventureCard, CardLink, HotelCard } from "@/components/site/product-card";
import { DestinationCard, PackageCard, RentalCard } from "@/components/site/catalog-cards";
import { EnquireButton } from "@/components/site/enquiry";
import { GallerySection } from "@/components/site/gallery";
import {
  getActivities,
  getAdventures,
  getClosures,
  getContentBlock,
  getDestinations,
  getGalleryItems,
  getHotels,
  getPackages,
  getRaftingByDistance,
  getRentals,
  getReviews,
  getSiteSettings,
} from "@/lib/content";
import { WHY_US_ICONS, isWhyUsIconKey } from "@/lib/why-us-icons";
import { isBookable, resolveClosure } from "@/lib/closure";
import { formatDuration, formatINR, formatKm } from "@/lib/format";

// 30s: the shortest read on this page is closures, the monsoon switch.
export const revalidate = 30;

/**
 * Shown when no admin has ever saved this section, or when running on the
 * DB-less seed fallback — the page must never render an empty "Why us"
 * section just because the content-blocks row does not exist yet.
 */
const WHY_US_FALLBACK = {
  title: "Why book with us",
  subtitle: "Four things we do differently, all of which you can check before you pay us anything.",
  items: [
    {
      icon: "route",
      title: "Sold by distance, not by package name",
      body: "Every stretch has its kilometres, its put-in point, its grade and its price on the card. You are choosing a stretch of river, not a marketing tier.",
    },
    {
      icon: "radio",
      title: "We tell you when the river is shut",
      body: "The Ganga closes through the monsoon. Our booking button closes with it, and the strap at the top of this page says so every day of the year.",
    },
    {
      icon: "life-buoy",
      title: "Limits stated before you book",
      body: "Minimum age, minimum and maximum weight, and what the grade actually means. Nobody arrives at the put-in to be turned away.",
    },
    {
      icon: "sparkles",
      title: "One number, one person",
      body: "Your enquiry goes to a real WhatsApp thread with the people running the raft, not a call centre. Your details are saved either way.",
    },
  ],
} as const;

export default async function LandingPage() {
  const [
    settings,
    rafting,
    bungeeList,
    hotels,
    reviews,
    closures,
    whyUsBlock,
    galleryItems,
    activities,
    packages,
    destinations,
    rentals,
  ] = await Promise.all([
    getSiteSettings(),
    getRaftingByDistance(),
    getAdventures("bungee"),
    getHotels(),
    getReviews(),
    getClosures(),
    getContentBlock("why-choose-us"),
    getGalleryItems(),
    getActivities(),
    getPackages(),
    getDestinations(),
    getRentals(),
  ]);
  const whyUs = whyUsBlock ?? WHY_US_FALLBACK;

  const bungee = bungeeList[0];
  const raftingOpen = isBookable(closures, { service: "rafting" });
  const bungeeOpen = isBookable(closures, { service: "bungee" });
  const hotelsOpen = isBookable(closures, { service: "hotel" });
  const raftingClosure = resolveClosure(closures, { service: "rafting" });

  const headline = settings.heroHeading.split("\n");
  const cheapest = Math.min(...rafting.map((r) => r.priceInr));

  return (
    <>
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden bg-jade-950">
        <MediaFrame
          media={null}
          ratio="hero"
          standInSeed="ganga-vedha-hero"
          priority
          mark={false}
          scrim={false}
          className="absolute inset-0 h-full w-full"
          emptyLabel="Hero photograph pending"
        />
        <div
          className="absolute inset-0 bg-[linear-gradient(to_top,rgb(5_41_38/0.92)_0%,rgb(5_41_38/0.66)_45%,rgb(5_41_38/0.42)_100%)]"
          aria-hidden
        />
        <div className="container-page relative flex min-h-[clamp(28rem,68vh,40rem)] flex-col justify-end py-14 lg:py-20">
          <div className="max-w-3xl">
            <h1 className="text-display-xl text-white">
              {headline[0]}
              {headline[1] && (
                <>
                  <br />
                  <span className="text-jade-300">{headline[1]}</span>
                </>
              )}
            </h1>
            <p className="mt-6 max-w-xl text-subtitle font-normal text-white/85">
              {settings.heroSubheading}
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <LinkButton href="#adventures" size="lg">
                See all rafting stretches
                <ArrowRight className="size-4" aria-hidden />
              </LinkButton>
              <LinkButton href="/hotels" size="lg" variant="outline" className="border-white/30 bg-white/10 text-white hover:border-white/50 hover:bg-white/20">
                Where to stay
              </LinkButton>
            </div>

            <dl className="mt-12 grid max-w-2xl grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
              {[
                ["From", formatINR(cheapest), "per person"],
                ["Rafting", String(rafting.length), "options · 7–26 km"],
                ["Bungee", `${bungee?.heightM ?? "—"} m`, "free fall"],
                ["Season", "Sep–Jun", "water permitting"],
              ].map(([label, value, note]) => (
                <div key={label}>
                  <dt className="text-caption text-white/60">{label}</dt>
                  <dd className="mt-1 tabular text-title text-white">{value}</dd>
                  <dd className="text-caption text-white/60">{note}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* ── The three service lines ───────────────────────────────────────── */}
      <section id="adventures" className="container-page scroll-mt-28 pt-20">
        <SectionHeading
          as="h2"
          title="Three ways to spend a day here"
          description="Everything is priced per person, every limit is on the card, and nothing takes a booking while it is closed."
        />

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {[
            {
              key: "hotel" as const,
              icon: BedDouble,
              title: "Hotel booking",
              blurb:
                "Riverside camps and guesthouses in Tapovan and Byasi, with meals and shuttles to the put-in.",
              href: "/hotels",
              cta: "Browse stays",
              open: hotelsOpen,
              closure: resolveClosure(closures, { service: "hotel" }),
              from: hotels.length ? Math.min(...hotels.map((h) => h.pricePerNightInr)) : null,
              unit: "per night",
              count: `${hotels.length} properties`,
              media: hotels[0]?.coverMedia ?? null,
            },
            {
              key: "rafting" as const,
              icon: Waves,
              title: "River rafting",
              blurb:
                "Five stretches of the Ganga, sold by the kilometre. Grade, distance and age limit stated up front.",
              href: "/rafting",
              cta: "Choose a stretch",
              open: raftingOpen,
              closure: resolveClosure(closures, { service: "rafting" }),
              from: cheapest,
              unit: "per person",
              count: `${rafting.length} options · Rishikesh & Manali`,
              media: rafting[0]?.coverMedia ?? null,
            },
            {
              key: "bungee" as const,
              icon: Mountain,
              title: "Bungee jumping",
              blurb:
                "83 metres off a cantilever platform over the Hyul valley, run against a written safety checklist.",
              href: bungee ? `/bungee/${bungee.slug}` : "/",
              cta: "See the jump",
              open: bungeeOpen,
              closure: resolveClosure(closures, { service: "bungee" }),
              from: bungee?.priceInr ?? null,
              unit: "per person",
              count: "83 m · 3 sec free fall",
              media: bungee?.coverMedia ?? null,
            },
          ].map((s) => (
            <Card key={s.key} elevation="flat" interactive className="flex flex-col">
              <CardLink closure={s.closure} href={s.href} className="block no-underline">
                <MediaFrame
                  media={s.media}
                  ratio="wide"
                  standInSeed={s.key}
                  emptyLabel={`${s.title} — photograph pending`}
                >
                  <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
                    <span className="grid size-9 place-items-center rounded-md bg-canvas/90 text-jade-800">
                      <s.icon className="size-4.5" aria-hidden />
                    </span>
                    {!s.open && <Chip tone="closed" size="sm">Closed</Chip>}
                  </div>
                </MediaFrame>
              </CardLink>
              <div className="flex flex-1 flex-col p-6">
                <h3 className="text-title text-ink">{s.title}</h3>
                <p className="mt-2 flex-1 text-small text-ink-muted">{s.blurb}</p>
                <p className="mt-4 text-caption text-ink-faint">{s.count}</p>
                <div className="mt-5 flex items-end justify-between gap-3 border-t border-hairline pt-5">
                  {s.from !== null && (
                    <div>
                      <p className="tabular text-title text-ink">{formatINR(s.from)}</p>
                      <p className="text-caption text-ink-faint">from · {s.unit}</p>
                    </div>
                  )}
                  <CardLink
                    closure={s.closure}
                    href={s.href}
                    className="inline-flex h-11 items-center gap-2 rounded-md px-4 text-small font-semibold text-link no-underline hover:bg-ember-50"
                  >
                    {s.cta} <ArrowRight className="size-4" aria-hidden />
                  </CardLink>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* ── Rafting, by the kilometre ─────────────────────────────────────── */}
      <section id="rafting" className="container-page scroll-mt-28 pt-24">
        <SectionHeading
          as="h2"
          title="Rafting, by the kilometre"
          description="The distance is the decision. Longer runs mean bigger water, more rapids and a longer day — not simply more of the same river."
          action={
            <LinkButton href="/rafting" variant="outline">
              Compare all stretches
            </LinkButton>
          }
        />

        {raftingClosure && (
          <Alert
            tone="closed"
            title={raftingClosure.title}
            className="mt-8"
          >
            {raftingClosure.body}
          </Alert>
        )}

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rafting.map((a, i) => (
            <AdventureCard
              key={a.id}
              adventure={a}
              closure={resolveClosure(closures, {
                service: "rafting",
                entityType: "adventure",
                entityId: a.id,
              })}
              whatsappNumber={settings.whatsappNumber}
              priority={i === 0}
            />
          ))}
        </div>

        {/* The comparison the cards cannot make: all stretches on one axis. */}
        <div className="mt-10">
          <TableScroller label="Every rafting stretch compared">
            <Table>
              <thead>
                <tr>
                  <Th>Stretch</Th>
                  <Th>Put-in</Th>
                  <Th>Grade</Th>
                  <Th className="text-right">Distance</Th>
                  <Th className="text-right">Duration</Th>
                  <Th className="text-right">Min age</Th>
                  <Th className="text-right">Price</Th>
                </tr>
              </thead>
              <tbody>
                {rafting.map((a) => (
                  <Tr key={a.id}>
                    <Td className="font-semibold whitespace-nowrap">
                      <Link href={`/rafting/${a.slug}`} className="text-ink no-underline hover:underline">
                        {a.name}
                      </Link>
                    </Td>
                    <Td className="text-ink-muted">{a.putInPoint}</Td>
                    <Td>{a.grade && <GradeChip grade={a.grade} size="sm" />}</Td>
                    <Td className="text-right tabular">{formatKm(a.distanceKm)}</Td>
                    <Td className="text-right tabular">{formatDuration(a.durationMinutes)}</Td>
                    <Td className="text-right tabular">{a.minAge}</Td>
                    <Td className="text-right tabular font-semibold">{formatINR(a.priceInr)}</Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </TableScroller>
        </div>
      </section>

      {/* ── Bungee ────────────────────────────────────────────────────────── */}
      {bungee && (
        <section className="container-page pt-24">
          <Card className="grid overflow-hidden lg:grid-cols-2">
            <MediaFrame
              media={bungee.coverMedia ?? null}
              ratio="wide"
              standInSeed={bungee.slug}
              className="lg:h-full lg:aspect-auto"
              emptyLabel="Bungee platform photograph pending"
            >
              <div className="absolute inset-x-0 top-0 p-4">
                <Chip tone="onMedia" size="sm">
                  {bungee.heightM} m platform
                </Chip>
              </div>
            </MediaFrame>
            <CardBody className="flex flex-col justify-center gap-5 p-8 lg:p-12">
              <h2 className="text-display-md text-ink">{bungee.name}</h2>
              <p className="measure text-ink-muted">{bungee.summary}</p>
              <ul className="grid gap-2 text-small text-ink-muted sm:grid-cols-2">
                {[
                  `Weight ${bungee.minWeightKg}–${bungee.maxWeightKg} kg`,
                  `Minimum age ${bungee.minAge}`,
                  `About ${formatDuration(bungee.durationMinutes)} on site`,
                  "Medical screening at the platform",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2">
                    <ShieldCheck className="mt-0.5 size-4 shrink-0 text-jade-600" aria-hidden />
                    {t}
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap items-end justify-between gap-4 border-t border-hairline pt-5">
                <div>
                  <p className="tabular text-display-md leading-none text-ink">
                    {formatINR(bungee.priceInr)}
                  </p>
                  <p className="mt-1.5 text-caption text-ink-faint">per person</p>
                </div>
                {bungeeOpen ? (
                  <EnquireButton
                    size="lg"
                    source="detail"
                    whatsappNumber={settings.whatsappNumber}
                    product={{
                      kind: "bungee",
                      slug: bungee.slug,
                      name: bungee.name,
                      priceInr: bungee.priceInr,
                      priceUnit: "per person",
                    }}
                  />
                ) : (
                  <Chip tone="closed">Bookings closed</Chip>
                )}
              </div>
            </CardBody>
          </Card>
        </section>
      )}

      {/* ── Other adventures ──────────────────────────────────────────────── */}
      {activities.length > 0 && (
        <section className="container-page pt-24">
          <SectionHeading
            as="h2"
            title="Paragliding, zip line and more"
            description="Not everything here happens on the water. A tandem flight and a valley zip line, both a short drive from town."
            action={
              <LinkButton href="/adventures" variant="outline">
                All adventures
              </LinkButton>
            }
          />
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {activities.map((a) => (
              <AdventureCard
                key={a.id}
                adventure={a}
                closure={resolveClosure(closures, {
                  service: "activity",
                  entityType: "adventure",
                  entityId: a.id,
                })}
                whatsappNumber={settings.whatsappNumber}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Holiday packages ──────────────────────────────────────────────── */}
      {packages.length > 0 && (
        <section className="container-page pt-24">
          <SectionHeading
            as="h2"
            title="Holiday packages"
            description="Fixed itineraries for the trips people ask us to plan most — the Char Dham and Do Dham yatras, a week of yoga, and the Uttarakhand and Himachal loops."
            action={
              <LinkButton href="/packages" variant="outline">
                All packages
              </LinkButton>
            }
          />
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {packages.slice(0, 3).map((p) => (
              <PackageCard key={p.id} pkg={p} whatsappNumber={settings.whatsappNumber} />
            ))}
          </div>
        </section>
      )}

      {/* ── Stays ─────────────────────────────────────────────────────────── */}
      <section className="container-page pt-24">
        <SectionHeading
          as="h2"
          title="Somewhere to sleep after"
          description="Camps on the sand and rooms in town, both a short shuttle from the put-in."
          action={
            <LinkButton href="/hotels" variant="outline">
              All stays
            </LinkButton>
          }
        />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {hotels.map((h) => (
            <HotelCard
              key={h.id}
              hotel={h}
              closure={resolveClosure(closures, {
                service: "hotel",
                entityType: "hotel",
                entityId: h.id,
              })}
              whatsappNumber={settings.whatsappNumber}
            />
          ))}
        </div>
      </section>

      {/* ── Destinations ──────────────────────────────────────────────────── */}
      {destinations.length > 0 && (
        <section className="container-page pt-24">
          <SectionHeading
            as="h2"
            title="Where we take people"
            description="Rishikesh is home base, but we plan trips across Uttarakhand and Himachal — each with a short guide and where to stay."
            action={
              <LinkButton href="/stays" variant="outline">
                All destinations
              </LinkButton>
            }
          />
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {destinations.slice(0, 8).map((d) => (
              <DestinationCard key={d.id} destination={d} />
            ))}
          </div>
        </section>
      )}

      {/* ── Rentals ───────────────────────────────────────────────────────── */}
      {rentals.length > 0 && (
        <section className="container-page pt-24">
          <SectionHeading
            as="h2"
            title="Getting around"
            description="A car with a driver, priced per route, or a bike by the day from our Tapovan office."
            action={
              <LinkButton href="/rentals" variant="outline">
                Car &amp; bike rental
              </LinkButton>
            }
          />
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {rentals.map((r) => (
              <RentalCard key={r.id} rental={r} whatsappNumber={settings.whatsappNumber} />
            ))}
          </div>
        </section>
      )}

      {/* ── Why us ────────────────────────────────────────────────────────── */}
      <section className="container-page pt-24">
        <SectionHeading as="h2" title={whyUs.title} description={whyUs.subtitle ?? undefined} />
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {whyUs.items.map((f) => {
            const Icon = isWhyUsIconKey(f.icon) ? WHY_US_ICONS[f.icon] : WHY_US_ICONS.sparkles;
            return (
              <div key={f.title} className="flex gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-md bg-jade-100 text-jade-800">
                  <Icon className="size-5" aria-hidden />
                </span>
                <div>
                  <h3 className="text-subtitle text-ink">{f.title}</h3>
                  <p className="mt-1.5 measure text-small text-ink-muted">{f.body}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Gallery ───────────────────────────────────────────────────────── */}
      <GallerySection items={galleryItems} />
      {galleryItems.length > 0 && (
        <div className="container-page mt-8 text-center">
          <LinkButton href="/gallery" variant="outline">
            See the full gallery
          </LinkButton>
        </div>
      )}

      {/* ── Reviews ───────────────────────────────────────────────────────── */}
      <section className="container-page pt-24">
        <SectionHeading as="h2" title="What people say afterwards" />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {reviews.map((r) => (
            <Card key={r.id} elevation="flat" className="flex flex-col p-6">
              <Rating value={r.rating} />
              <blockquote className="mt-4 flex-1 text-small text-ink-muted">
                “{r.body}”
              </blockquote>
              <footer className="mt-5 border-t border-hairline pt-4">
                <p className="text-small font-semibold text-ink">{r.authorName}</p>
                {r.tripLabel && (
                  <p className="text-caption text-ink-faint">{r.tripLabel}</p>
                )}
              </footer>
            </Card>
          ))}
        </div>
      </section>
    </>
  );
}
