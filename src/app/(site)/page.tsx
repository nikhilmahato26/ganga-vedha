import { ArrowRight, BedDouble, Images, Mountain, Star, Waves } from "lucide-react";
import {
  Card,
  Chip,
  LinkButton,
  MediaFrame,
  Rating,
  SectionHeading,
} from "@/components/ui";
import { AdventureCard, CardLink, HotelCard } from "@/components/site/product-card";
import { DestinationCard, PackageCard, RentalCard } from "@/components/site/catalog-cards";
import { RaftingSection } from "@/components/site/rafting-section";
import { BungeeBrands } from "@/components/site/bungee-brands";
import { PromoStrip } from "@/components/site/promo-strip";
import { GallerySection } from "@/components/site/gallery";
import { HeroRooms } from "@/components/site/hero-rooms";
import { FacebookIcon, InstagramIcon, SOCIAL_LINKS } from "@/components/icons";
import {
  getActivities,
  getAdventures,
  getClosures,
  getContentBlock,
  getDestinations,
  getGalleryItems,
  getHotels,
  getPackages,
  getPromotions,
  getRaftingByDistance,
  getRentals,
  getReviews,
  getSiteSettings,
} from "@/lib/content";
import { WHY_US_ICONS, isWhyUsIconKey } from "@/lib/why-us-icons";
import { isBookable, resolveClosure } from "@/lib/closure";
import { formatINR } from "@/lib/format";

// 30s: the shortest read on this page is closures, the monsoon switch.
export const revalidate = 30;

const INSTAGRAM_REELS = "https://www.instagram.com/ganga_veda.in/reels/";

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
    promotions,
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
    getPromotions(),
  ]);
  const whyUs = whyUsBlock ?? WHY_US_FALLBACK;

  const raftingOpen = isBookable(closures, { service: "rafting" });
  const bungeeOpen = isBookable(closures, { service: "bungee" });
  const hotelsOpen = isBookable(closures, { service: "hotel" });

  const cheapest = Math.min(...rafting.map((r) => r.priceInr));

  return (
    <>
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden bg-jade-950">
        <MediaFrame
          media={settings.heroMedia ?? null}
          ratio="hero"
          standInSeed="ganga-vedha-hero"
          priority
          mark={false}
          scrim={false}
          // Blurred so a hero image that carries its own lettering (the owner's
          // poster) reads as texture behind the headline instead of competing.
          className="absolute inset-0 h-full w-full [&_img]:scale-110 [&_img]:blur-sm"
          emptyLabel="Hero photograph pending"
        />
        <div
          className="absolute inset-0 bg-[linear-gradient(to_top,rgb(5_41_38/0.94)_0%,rgb(5_41_38/0.8)_50%,rgb(5_41_38/0.66)_100%)]"
          aria-hidden
        />
        <div className="container-page relative pt-12 pb-10 lg:pt-20 lg:pb-14">
          <div className="max-w-3xl">
            <p className="text-caption font-semibold uppercase tracking-wide text-jade-300">
              Tapovan, Rishikesh, Uttarakhand
            </p>
            <h1 className="mt-3 text-display-lg text-white">
              Welcome to {settings.brandName}
              <br />
              <span className="text-jade-300">Hotels &amp; Resorts</span>
            </h1>
            <p className="mt-4 max-w-xl text-subtitle font-normal text-white/90">
              Stay by the Ganga in Tapovan, and book rafting, bungee jumping and bike
              rental with us too.
            </p>
          </div>

          <div className="mt-8 lg:mt-10">
            <HeroRooms whatsappNumber={settings.whatsappNumber} open={hotelsOpen} />
          </div>

          <nav aria-label="See more of Ganga Veda" className="mt-6 flex flex-wrap gap-2 sm:gap-3">
            {[
              { href: "/gallery", label: "Gallery", icon: <Images className="size-4" aria-hidden /> },
              {
                href: SOCIAL_LINKS.facebook,
                label: "Facebook",
                icon: <FacebookIcon className="size-4" aria-hidden="true" />,
                external: true,
              },
              {
                href: INSTAGRAM_REELS,
                label: "Instagram Reels",
                icon: <InstagramIcon className="size-4" aria-hidden="true" />,
                external: true,
              },
              ...(reviews.length > 0
                ? [{ href: "#reviews", label: "Reviews", icon: <Star className="size-4" aria-hidden /> }]
                : []),
            ].map((l) => (
              <a
                key={l.label}
                href={l.href}
                {...("external" in l ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="inline-flex h-11 items-center gap-2 rounded-full border border-white/30 bg-jade-950/40 px-4 text-small font-semibold text-white no-underline backdrop-blur-sm hover:border-white/60 hover:bg-jade-950/60"
              >
                {l.icon}
                {l.label}
              </a>
            ))}
          </nav>
        </div>
      </section>

      {/* ── Promotions ────────────────────────────────────────────────────── */}
      <PromoStrip promotions={promotions} />

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
              count: `${rafting.length} options · 12–26 km`,
              media: rafting[0]?.coverMedia ?? null,
            },
            {
              key: "bungee" as const,
              icon: Mountain,
              title: "Bungee & activities",
              blurb:
                "Bungee jumps from several operators, tandem paragliding and a valley zip line — each run against a written safety checklist.",
              href: "/adventures",
              cta: "See adventures",
              open: bungeeOpen,
              closure: resolveClosure(closures, { service: "bungee" }),
              from: bungeeList.length
                ? Math.min(...[...bungeeList, ...activities].map((a) => a.priceInr))
                : null,
              unit: "per person",
              count: `${bungeeList.length} bungee operators · paragliding · zip line`,
              media: bungeeList[0]?.coverMedia ?? null,
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
      <RaftingSection
        stretches={rafting}
        closures={closures}
        whatsappNumber={settings.whatsappNumber}
      />

      {/* ── Bungee jumping, by operator ───────────────────────────────────── */}
      {bungeeList.length > 0 && (
        <section className="container-page pt-24">
          <SectionHeading
            as="h2"
            title="Bungee jumping"
            description="The operators we book with around Rishikesh and Jim Corbett. Each runs its jumps against a written safety checklist — height, grade and age limit on every card."
            action={
              <LinkButton href="/adventures" variant="outline">
                All adventures
              </LinkButton>
            }
          />
          <div className="mt-10">
            <BungeeBrands
              bungee={bungeeList}
              closures={closures}
              whatsappNumber={settings.whatsappNumber}
            />
          </div>
        </section>
      )}

      {/* ── Paragliding & zip line ────────────────────────────────────────── */}
      {activities.length > 0 && (
        <section className="container-page pt-24">
          <SectionHeading
            as="h2"
            title="Paragliding & zip line"
            description="A tandem flight and a valley zip line, both a short drive from town."
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
      <section id="reviews" className="container-page scroll-mt-28 pt-24">
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
