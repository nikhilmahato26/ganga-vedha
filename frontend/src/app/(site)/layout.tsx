import {
  SeedBanner,
  SiteHeader,
  StatusStrap,
  ContactFabs,
} from "@/components/site/chrome";
import {
  getBungeeBrands,
  getClosures,
  getDestinations,
  getPackageCategories,
  getRaftingByDistance,
  getRentalKinds,
  getSiteSettings,
  isSeedContent,
  type Adventure,
  type SiteSettings,
} from "@/lib/content";
import { Outlet, useLoaderData } from "react-router-dom";
import Link from "@/components/link";
import { BrandLogo } from "@/components/brand-logo";
import { resolveClosure } from "@/lib/closure";
import { InstagramIcon, FacebookIcon, SOCIAL_LINKS } from "@/components/icons";

/**
 * The public site's frame: status strap, header, footer and contact buttons. Its loader fetches
 * what every page's chrome needs once; pages fetch their own content (memoised in lib/content.ts,
 * so a page asking for the same list again costs nothing).
 */
export async function loader() {
  const [settings, closures, bungeeBrands, packageCategories, rentalKinds, destinations, stretches] =
    await Promise.all([
      getSiteSettings(),
      getClosures(),
      getBungeeBrands(),
      getPackageCategories(),
      getRentalKinds(),
      getDestinations(),
      getRaftingByDistance(),
    ]);
  return { settings, closures, bungeeBrands, packageCategories, rentalKinds, destinations, stretches };
}

export default function SiteLayout() {
  const { settings, closures, bungeeBrands, packageCategories, rentalKinds, destinations, stretches } =
    useLoaderData<typeof loader>();

  const raftingClosure = resolveClosure(closures, { service: "rafting" });
  // No full-screen takeover on page load, anywhere, for any scope — a
  // closure (rafting, bungee, one hotel, or the whole site) only shows its
  // modal when a visitor actually presses the "book" spot for that specific
  // listing (`ClosureTrigger`, on each detail page). A true site-wide closure
  // still reaches every listing that way, since `resolveClosure` falls back
  // to it when nothing more specific is set — nothing sitewide needed here.

  // The strap and the nav pill both need every closed service, not just
  // rafting — they rotate through whichever of these is non-empty.
  const closedServices = (
    [
      raftingClosure && "rafting",
      resolveClosure(closures, { service: "bungee" }) && "bungee",
      resolveClosure(closures, { service: "hotel" }) && "hotel",
    ] as const
  ).filter((s): s is "rafting" | "bungee" | "hotel" => Boolean(s));

  // The nav only needs a name, a slug and the region — the rest of a
  // destination row (cover image, FAQs, how-to-reach) would ride into the
  // client bundle on every page for nothing.
  const navDestinations = destinations.map((d) => ({
    name: d.name,
    slug: d.slug,
    note: d.region,
  }));

  return (
    <div className="flex min-h-dvh flex-col">
      {isSeedContent() && <SeedBanner />}
      <StatusStrap
        closedServices={closedServices}
        openLabel={settings.riverStatusLabel}
        gauge={settings.gaugeLocation}
      />
      <SiteHeader
        brandName={settings.brandName}
        whatsappNumber={settings.whatsappNumber}
        closedServices={closedServices}
        bungeeBrands={bungeeBrands}
        packageCategories={packageCategories}
        rentalKinds={rentalKinds}
        destinations={navDestinations}
      />
      <main className="flex-1">
        <Outlet />
      </main>
      <SiteFooter settings={settings} stretches={stretches} />
      <ContactFabs whatsappNumber={settings.whatsappNumber} phone={settings.phone} />
    </div>
  );
}

/** The policy pages, in the order the footer lists them. */
const LEGAL_LINKS: [string, string][] = [
  ["Privacy Policy", "/privacy-policy"],
  ["Return & Refund Policy", "/refund-policy"],
];

function SiteFooter({ settings, stretches }: { settings: SiteSettings; stretches: Adventure[] }) {
  return (
    <footer id="contact" className="mt-24 bg-jade-950 text-jade-100">
      <div className="container-page grid gap-10 py-16 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <div className="flex items-center gap-3">
            <BrandLogo size="lg" className="ring-1 ring-white/15" />
            <p
              className="text-title text-white"
              style={{ fontVariationSettings: '"wdth" 112' }}
            >
              {settings.brandName}
            </p>
          </div>
          <p className="mt-3 text-small text-jade-200">{settings.tagline}</p>
          <div className="mt-5">
            <p className="text-caption font-semibold uppercase tracking-wide text-jade-300">
              Follow us
            </p>
            <div className="mt-2.5 flex items-center gap-2.5">
              <a
                href={SOCIAL_LINKS.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow Ganga Vedha on Instagram"
                className="inline-flex size-9 items-center justify-center rounded-full bg-white/10 text-jade-200 ring-1 ring-white/15 transition hover:bg-white/20 hover:text-white"
              >
                <InstagramIcon className="size-4.5" aria-hidden="true" />
              </a>
              <a
                href={SOCIAL_LINKS.facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow Ganga Vedha on Facebook"
                className="inline-flex size-9 items-center justify-center rounded-full bg-white/10 text-jade-200 ring-1 ring-white/15 transition hover:bg-white/20 hover:text-white"
              >
                <FacebookIcon className="size-4.5" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>

        <nav aria-label="Rafting">
          <p className="text-label uppercase text-jade-300">Rafting</p>
          <ul className="mt-4 space-y-2.5">
            {stretches.map((s) => (
              <li key={s.slug}>
                <Link
                  href={`/rafting/${s.slug}`}
                  className="text-small text-jade-100 no-underline hover:text-white hover:underline"
                >
                  {s.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="More">
          <p className="text-label uppercase text-jade-300">Explore</p>
          <ul className="mt-4 space-y-2.5">
            {[
              ["Adventures", "/adventures"],
              ["Holiday packages", "/packages"],
              ["Stays & destinations", "/stays"],
              ["Car & bike rental", "/rentals"],
              ["Gallery", "/gallery"],
              ["About us", "/about"],
              ["Contact", "/contact"],
            ].map(([label, href]) => (
              <li key={label}>
                <Link
                  href={href}
                  className="text-small text-jade-100 no-underline hover:text-white hover:underline"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <p className="text-label uppercase text-jade-300">Contact</p>
          <address className="mt-4 space-y-2.5 text-small not-italic text-jade-100">
            <p>{settings.address}</p>
            <p>
              <a href={`tel:+91${settings.phone}`} className="text-jade-100 no-underline hover:text-white">
                +91 {settings.phone.slice(0, 5)} {settings.phone.slice(5)}
              </a>
            </p>
            <p>
              <a href={`mailto:${settings.email}`} className="text-jade-100 no-underline hover:text-white">
                {settings.email}
              </a>
            </p>
            <div className="pt-2">
              <p className="text-caption font-semibold uppercase tracking-wide text-jade-300">
                Social
              </p>
              <div className="mt-2 flex items-center gap-3">
                <a
                  href={SOCIAL_LINKS.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-small text-jade-100 no-underline hover:text-white hover:underline"
                >
                  <InstagramIcon className="size-4 text-jade-300" aria-hidden="true" />
                  <span>Instagram</span>
                </a>
                <span className="text-white/20" aria-hidden="true">·</span>
                <a
                  href={SOCIAL_LINKS.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-small text-jade-100 no-underline hover:text-white hover:underline"
                >
                  <FacebookIcon className="size-4 text-jade-300" aria-hidden="true" />
                  <span>Facebook</span>
                </a>
              </div>
            </div>
          </address>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-4 py-6 text-caption text-jade-300 lg:flex-row lg:items-center lg:justify-between">
          <p>© {new Date().getFullYear()} {settings.brandName}. All rights reserved.</p>
          <nav aria-label="Legal">
            <ul className="flex flex-wrap items-center gap-x-5 gap-y-2">
              {LEGAL_LINKS.map(([label, href]) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-jade-200 no-underline hover:text-white hover:underline"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex items-center gap-3">
            <a
              href={SOCIAL_LINKS.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-jade-200 no-underline hover:text-white hover:underline"
            >
              <InstagramIcon className="size-3.5" aria-hidden="true" />
              <span>Instagram</span>
            </a>
            <span className="text-white/20" aria-hidden="true">·</span>
            <a
              href={SOCIAL_LINKS.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-jade-200 no-underline hover:text-white hover:underline"
            >
              <FacebookIcon className="size-3.5" aria-hidden="true" />
              <span>Facebook</span>
            </a>
          </div>
          <p>Rafting operates mid-September to mid-June, water levels permitting.</p>
        </div>
      </div>
    </footer>
  );
}
