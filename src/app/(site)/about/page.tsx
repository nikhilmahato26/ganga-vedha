import type { Metadata } from "next";
import Link from "next/link";
import {
  Award,
  CalendarClock,
  MapPin,
  MessageCircle,
  Route,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { Breadcrumb, LinkButton, SectionHeading } from "@/components/ui";
import { getContentBlock, getSiteSettings } from "@/lib/content";
import { WHY_US_ICONS, isWhyUsIconKey } from "@/lib/why-us-icons";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "About Ganga Vedha",
  description:
    "A Rishikesh-based adventure, travel and hospitality operator — rafting and activities we run ourselves, stays and packages across Uttarakhand and Himachal, and a booking process that puts price and availability first.",
  alternates: { canonical: "/about" },
};

const WHY_US_FALLBACK = [
  {
    icon: "map-pin",
    title: "Local destination expertise",
    body: "We are based in Rishikesh and plan trips across Uttarakhand and Himachal ourselves — not resold from a portal three states away.",
  },
  {
    icon: "shield",
    title: "Carefully selected activity partners",
    body: "Rafting we run ourselves; bungee, paragliding and zip-line sites we send you to are ones we have used and checked.",
  },
  {
    icon: "check-circle",
    title: "Transparent package information",
    body: "Itinerary, inclusions, exclusions and a clearly labelled starting price on every package page — before you enquire.",
  },
  {
    icon: "life-buoy",
    title: "Safety-first approach",
    body: "Age, weight and grade limits are stated on the card. Nobody arrives at a put-in or a platform to be turned away.",
  },
  {
    icon: "calendar",
    title: "Flexible itineraries",
    body: "Fixed packages are a starting point. Tell us your dates and group and we adjust the route, the stays and the pace.",
  },
  {
    icon: "clock",
    title: "Responsive booking assistance",
    body: "Your enquiry lands in a real WhatsApp thread with the people running the trip, usually answered within a couple of hours.",
  },
];

export default async function AboutPage() {
  const [settings, whyUsBlock] = await Promise.all([
    getSiteSettings(),
    getContentBlock("why-choose-us"),
  ]);

  const whyUs =
    whyUsBlock && whyUsBlock.items.length > 0 ? whyUsBlock.items : WHY_US_FALLBACK;

  return (
    <div className="container-page pt-6 pb-8">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "About us" }]} />

      <div className="pt-8">
        <SectionHeading
          as="h1"
          title={`About ${settings.brandName}`}
          description="A Rishikesh-based adventure, travel and hospitality partner. We run river rafting and activities on the ground here, and plan stays, pilgrimages and multi-day tours across Uttarakhand and Himachal — with the same rule on every page: price, grade and availability stated before anything is sold."
        />
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_18rem]">
        <div className="measure space-y-4 text-ink-muted">
          <p>
            {settings.brandName} started on the Ganga at Rishikesh, taking groups down
            the river by the kilometre. That is still the core of what we do — five
            rafting stretches from a gentle 12 km float to 32 km of big water, run with
            our own guides and safety kayakers.
          </p>
          <p>
            Around that, we have built the rest of a trip: bungee, paragliding and a
            zip line within a short drive; riverside camps and guesthouses to sleep in;
            and fixed packages for the journeys people ask us to plan most — the Char
            Dham and Do Dham yatras, a week of yoga, and the classic Uttarakhand and
            Himachal loops.
          </p>
          <p>
            We believe in responsible tourism: small groups, local staff, and honesty
            about when the river is closed for the monsoon rather than a year-round
            &ldquo;Book Now&rdquo; button over a video of high water.
          </p>
        </div>

        <aside className="space-y-4 rounded-lg border border-hairline p-6 text-small">
          <p className="text-subtitle text-ink">In short</p>
          <ul className="space-y-3 text-ink-muted">
            <li className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 size-4 shrink-0 text-jade-600" aria-hidden />
              Based in Tapovan, Rishikesh
            </li>
            <li className="flex items-start gap-2.5">
              <Route className="mt-0.5 size-4 shrink-0 text-jade-600" aria-hidden />
              Rafting run in-house; activities via checked partners
            </li>
            <li className="flex items-start gap-2.5">
              <CalendarClock className="mt-0.5 size-4 shrink-0 text-jade-600" aria-hidden />
              Rafting season mid-September to mid-June
            </li>
            <li className="flex items-start gap-2.5">
              <Wallet className="mt-0.5 size-4 shrink-0 text-jade-600" aria-hidden />
              Enquiry first — nothing charged until confirmed
            </li>
          </ul>
        </aside>
      </div>

      <section className="mt-20">
        <SectionHeading
          as="h2"
          title="Why choose us"
          description={whyUsBlock?.subtitle ?? "Eight things you can check before you pay us anything."}
        />
        <div className="mt-10 grid gap-8 sm:grid-cols-2">
          {whyUs.map((f) => {
            const Icon = isWhyUsIconKey(f.icon) ? WHY_US_ICONS[f.icon] : ShieldCheck;
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

      <section className="mt-20 rounded-xl bg-jade-950 p-8 text-white sm:p-12">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <h2 className="text-display-md text-white">Planning a trip?</h2>
            <p className="mt-2 max-w-md text-white/80">
              Tell us the dates, the group and roughly what you want to do. We&rsquo;ll
              come back with a plan and a quote.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <LinkButton href="/contact" size="lg">
              Contact us
            </LinkButton>
            <Link
              href="/packages"
              className="inline-flex h-12 items-center rounded-md border border-white/30 bg-white/10 px-5 font-semibold text-white no-underline hover:bg-white/20"
            >
              Browse packages
            </Link>
          </div>
        </div>
        <p className="mt-6 inline-flex items-center gap-2 text-caption text-white/60">
          <Award className="size-4" aria-hidden /> Local operator · responsible tourism ·
          transparent pricing
        </p>
        <p className="mt-1 inline-flex items-center gap-2 text-caption text-white/60">
          <MessageCircle className="size-4" aria-hidden /> WhatsApp {settings.whatsappNumber}
        </p>
      </section>
    </div>
  );
}
