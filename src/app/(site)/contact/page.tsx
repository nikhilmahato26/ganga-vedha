import type { Metadata } from "next";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { Breadcrumb, LinkButton, SectionHeading } from "@/components/ui";
import { ContactForm } from "@/components/site/contact-form";
import { getSiteSettings } from "@/lib/content";
import { formatPhoneIN, whatsappHref } from "@/lib/format";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Contact & booking",
  description:
    "Phone, WhatsApp, email and office details, plus an enquiry form for your travel dates, group size, destination and special requests.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const settings = await getSiteSettings();
  const wa = whatsappHref(
    settings.whatsappNumber,
    "Hi Ganga Vedha — I'd like to plan a trip.",
  );

  return (
    <div className="container-page pt-6 pb-8">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Contact" }]} />

      <div className="pt-8">
        <SectionHeading
          as="h1"
          title="Contact & booking"
          description="Send an enquiry with your dates and what you have in mind, or message us directly on WhatsApp. We usually reply within a couple of hours."
        />
      </div>

      <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_20rem]">
        <div className="min-w-0">
          <h2 className="text-subtitle text-ink">Enquiry form</h2>
          <div className="mt-5">
            <ContactForm whatsappNumber={settings.whatsappNumber} />
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-lg border border-hairline p-6">
            <h2 className="text-subtitle text-ink">Reach us</h2>
            <ul className="mt-4 space-y-4 text-small">
              {settings.whatsappNumber && (
                <li className="flex items-start gap-3">
                  <MessageCircle className="mt-0.5 size-4 shrink-0 text-jade-600" aria-hidden />
                  <span>
                    <span className="block font-semibold text-ink">WhatsApp</span>
                    {wa ? (
                      <a href={wa} target="_blank" rel="noopener" className="text-link hover:underline">
                        {formatPhoneIN(settings.whatsappNumber)}
                      </a>
                    ) : (
                      formatPhoneIN(settings.whatsappNumber)
                    )}
                  </span>
                </li>
              )}
              {settings.phone && (
                <li className="flex items-start gap-3">
                  <Phone className="mt-0.5 size-4 shrink-0 text-jade-600" aria-hidden />
                  <span>
                    <span className="block font-semibold text-ink">Phone</span>
                    <a href={`tel:+91${settings.phone}`} className="text-link hover:underline">
                      {formatPhoneIN(settings.phone)}
                    </a>
                  </span>
                </li>
              )}
              {settings.email && (
                <li className="flex items-start gap-3">
                  <Mail className="mt-0.5 size-4 shrink-0 text-jade-600" aria-hidden />
                  <span>
                    <span className="block font-semibold text-ink">Email</span>
                    <a href={`mailto:${settings.email}`} className="text-link hover:underline">
                      {settings.email}
                    </a>
                  </span>
                </li>
              )}
              {settings.address && (
                <li className="flex items-start gap-3">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-jade-600" aria-hidden />
                  <span>
                    <span className="block font-semibold text-ink">Office</span>
                    {settings.address}
                  </span>
                </li>
              )}
            </ul>
            {settings.mapUrl && (
              <LinkButton
                href={settings.mapUrl}
                target="_blank"
                rel="noopener"
                variant="outline"
                className="mt-5"
              >
                <MapPin className="size-4" aria-hidden /> Open in Maps
              </LinkButton>
            )}
          </div>

          <div className="rounded-lg bg-jade-950 p-6 text-white">
            <p className="text-subtitle text-white">Prefer to chat?</p>
            <p className="mt-1.5 text-small text-white/80">
              WhatsApp is the fastest way to reach the people running the trips.
            </p>
            {wa && (
              <a
                href={wa}
                target="_blank"
                rel="noopener"
                className="mt-4 inline-flex h-11 items-center gap-2 rounded-md bg-[#25D366] px-5 font-semibold text-white no-underline"
              >
                <MessageCircle className="size-4 fill-current" aria-hidden />
                Message on WhatsApp
              </a>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
