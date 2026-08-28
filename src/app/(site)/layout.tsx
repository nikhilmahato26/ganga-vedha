/**
 * Route segment config. `unstable_cache`'s own `revalidate` controls the
 * DATA cache entry; this controls the Full Route Cache — the served HTML —
 * which is a separate layer and does not reliably inherit a nested cache
 * call's window without an explicit value here. 30s matches the closures
 * read, the most time-sensitive one: the owner's monsoon switch.
 */
export const revalidate = 30;

import {
  ClosureNotice,
  SeedBanner,
  SiteHeader,
  StatusStrap,
  WhatsappFab,
} from "@/components/site/chrome";
import { getClosures, getRaftingByDistance, getSiteSettings, isSeedContent } from "@/lib/content";
import { resolveClosure } from "@/lib/closure";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [settings, stretches, closures] = await Promise.all([
    getSiteSettings(),
    getRaftingByDistance(),
    getClosures(),
  ]);

  const raftingClosure = resolveClosure(closures, { service: "rafting" });
  const globalClosure = resolveClosure(closures, { service: "hotel" });
  // Show the interstitial for the broadest active closure, once per session.
  const notice = globalClosure?.scope === "global" ? globalClosure : raftingClosure;

  return (
    <div className="flex min-h-dvh flex-col">
      {isSeedContent() && <SeedBanner />}
      <StatusStrap
        open={!raftingClosure}
        label={raftingClosure ? "Rafting paused — high water" : settings.riverStatusLabel}
        gauge={settings.gaugeLocation}
      />
      <SiteHeader
        brandName={settings.brandName}
        stretches={stretches.map((s) => ({
          slug: s.slug,
          name: s.name,
          distanceKm: s.distanceKm,
        }))}
        whatsappNumber={settings.whatsappNumber}
        raftingOpen={!raftingClosure}
      />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <WhatsappFab number={settings.whatsappNumber} />
      <ClosureNotice closure={notice} />
    </div>
  );
}

async function SiteFooter() {
  const [settings, stretches] = await Promise.all([
    getSiteSettings(),
    getRaftingByDistance(),
  ]);
  return (
    <footer id="contact" className="mt-24 bg-jade-950 text-jade-100">
      <div className="container-page grid gap-10 py-16 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <p
            className="text-title text-white"
            style={{ fontVariationSettings: '"wdth" 112' }}
          >
            {settings.brandName}
          </p>
          <p className="mt-3 text-small text-jade-200">{settings.tagline}</p>
        </div>

        <nav aria-label="Rafting">
          <p className="text-label uppercase text-jade-300">Rafting</p>
          <ul className="mt-4 space-y-2.5">
            {stretches.map((s) => (
              <li key={s.slug}>
                <a
                  href={`/rafting/${s.slug}`}
                  className="text-small text-jade-100 no-underline hover:text-white hover:underline"
                >
                  {s.name}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="More">
          <p className="text-label uppercase text-jade-300">More</p>
          <ul className="mt-4 space-y-2.5">
            {[
              ["Bungee jumping", "/bungee/bungee-jump-rishikesh"],
              ["Stays", "/hotels"],
              ["Design system", "/styleguide"],
            ].map(([label, href]) => (
              <li key={label}>
                <a
                  href={href}
                  className="text-small text-jade-100 no-underline hover:text-white hover:underline"
                >
                  {label}
                </a>
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
          </address>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-2 py-6 text-caption text-jade-300 sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} {settings.brandName}. All rights reserved.</p>
          <p>Rafting operates mid-September to mid-June, water levels permitting.</p>
        </div>
      </div>
    </footer>
  );
}
