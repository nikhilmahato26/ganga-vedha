import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Mountain, Waves, Wind, Zap } from "lucide-react";
import {
  Breadcrumb,
  Card,
  CardBody,
  LinkButton,
  SectionHeading,
} from "@/components/ui";
import { AdventureCard } from "@/components/site/product-card";
import {
  getActivities,
  getAdventures,
  getClosures,
  getRaftingByDistance,
  getSiteSettings,
} from "@/lib/content";
import { resolveClosure } from "@/lib/closure";
import { formatINR } from "@/lib/format";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Adventure activities in Rishikesh",
  description:
    "Everything we run in one place — river rafting by the kilometre, an 83 m bungee jump, tandem paragliding and a valley zip line. Price, grade and age limit on every card.",
  alternates: { canonical: "/adventures" },
};

const KIND_META = {
  rafting: { icon: Waves, label: "River rafting" },
  bungee: { icon: Mountain, label: "Bungee jumping" },
  paragliding: { icon: Wind, label: "Paragliding" },
  zipline: { icon: Zap, label: "Zip lining" },
} as const;

export default async function AdventuresIndex() {
  const [rafting, bungeeList, activities, settings, closures] = await Promise.all([
    getRaftingByDistance(),
    getAdventures("bungee"),
    getActivities(),
    getSiteSettings(),
    getClosures(),
  ]);

  const cheapest = Math.min(
    ...[...rafting, ...bungeeList, ...activities].map((a) => a.priceInr),
  );

  const pillars = [
    {
      kind: "rafting" as const,
      count: `${rafting.length} options · Rishikesh & Manali`,
      from: rafting.length ? Math.min(...rafting.map((r) => r.priceInr)) : null,
      href: "/rafting",
      blurb:
        "The Ganga at Rishikesh and the Beas at Manali, sold and compared by distance. Longer runs mean bigger water, not just more river.",
    },
    {
      kind: "bungee" as const,
      count: bungeeList.length ? `${bungeeList.length} operators` : "Fixed platforms",
      from: bungeeList.length ? Math.min(...bungeeList.map((b) => b.priceInr)) : null,
      href: "#dry-land",
      blurb:
        "Several fixed-platform bungee operators around Rishikesh and Jim Corbett, each run by trained jump masters against a written checklist.",
    },
    ...activities.map((a) => ({
      kind: a.kind as "paragliding" | "zipline",
      count: a.putInPoint ? `Near ${a.putInPoint}` : "Rishikesh",
      from: a.priceInr,
      href: `/adventures/${a.slug}`,
      blurb: a.summary,
    })),
  ];

  return (
    <div className="container-page pt-6 pb-8">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Adventures" }]} />

      <div className="pt-8">
        <SectionHeading
          as="h1"
          title="Everything we run"
          description="Four ways to spend a morning here — rafting, bungee, paragliding and a zip line. Every one lists its price, its grade and its age and weight limits before you book, and nothing takes an enquiry while it is closed."
        />
      </div>

      <dl className="mt-8 grid max-w-lg grid-cols-3 gap-x-6 gap-y-4">
        {[
          ["Activities", String(pillars.length), "in and around Rishikesh"],
          ["From", formatINR(cheapest), "per person"],
          ["Season", "Sep–Jun", "rafting; others year-round"],
        ].map(([label, value, note]) => (
          <div key={label}>
            <dt className="text-caption text-ink-faint">{label}</dt>
            <dd className="mt-1 tabular text-title text-ink">{value}</dd>
            <dd className="text-caption text-ink-faint">{note}</dd>
          </div>
        ))}
      </dl>

      {/* Pillar cards — one per activity type. */}
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {pillars.map((p) => {
          const meta = KIND_META[p.kind];
          const Icon = meta.icon;
          return (
            <Card key={p.href + p.kind} elevation="flat" interactive className="flex flex-col">
              <CardBody className="flex flex-1 flex-col p-6">
                <span className="grid size-10 place-items-center rounded-md bg-jade-100 text-jade-800">
                  <Icon className="size-5" aria-hidden />
                </span>
                <h2 className="mt-4 text-title text-ink">{meta.label}</h2>
                <p className="mt-2 flex-1 text-small text-ink-muted">{p.blurb}</p>
                <p className="mt-4 text-caption text-ink-faint">{p.count}</p>
                <div className="mt-4 flex items-end justify-between gap-3 border-t border-hairline pt-4">
                  {p.from !== null && (
                    <div>
                      <p className="tabular text-subtitle text-ink">{formatINR(p.from)}</p>
                      <p className="text-caption text-ink-faint">from</p>
                    </div>
                  )}
                  <Link
                    href={p.href}
                    className="inline-flex h-10 items-center gap-1.5 rounded-md px-3 text-small font-semibold text-link no-underline hover:bg-ember-50"
                  >
                    View <ArrowRight className="size-4" aria-hidden />
                  </Link>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>

      {/* Rafting stretches */}
      <section className="mt-20">
        <SectionHeading
          as="h2"
          title="Rafting, by the kilometre"
          action={
            <LinkButton href="/rafting" variant="outline">
              Compare all stretches
            </LinkButton>
          }
        />
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
      </section>

      {/* Everything else */}
      {(bungeeList.length > 0 || activities.length > 0) && (
        <section id="dry-land" className="mt-20 scroll-mt-24">
          <SectionHeading as="h2" title="Bungee, paragliding & zip line" />
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...bungeeList, ...activities].map((a) => (
              <AdventureCard
                key={a.id}
                adventure={a}
                closure={resolveClosure(closures, {
                  service: a.kind === "bungee" ? "bungee" : "activity",
                  entityType: "adventure",
                  entityId: a.id,
                })}
                whatsappNumber={settings.whatsappNumber}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
