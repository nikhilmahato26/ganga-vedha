import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Ganga Vedha — River rafting, bungee and stays in Rishikesh",
    template: "%s · Ganga Vedha",
  },
  description:
    "Rafting the Ganga by the kilometre, bungee jumping, and riverside stays in Rishikesh. Every price, grade and limit shown up front — and we tell you when the river is closed.",
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "Ganga Vedha",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#13433e",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

/* The direction contract. Audited against the render at the finish review. */
const DIRECTION_CONTRACT = `<!--
impeccable:direction seed=ca7695e6 mode=persuade form=canon

THESIS: Rishikesh sold by the kilometre, with the river's real status stated
before anything is sold. Refuses the category habit of a year-round live
"Book Now" over a hero video when the Ganga is shut for monsoon.

OWN-WORLD: Light ground for a phone in Himalayan morning sun. Ganga jade as
the brand anchor, rescue orange as the single action colour, granite neutrals
with a green cast. One family, Archivo, width axis carrying the display voice.
Cards at 14px radius, elevation by shadow alone, tabular figures wherever a
number is compared. Grade owns a colour by law and never travels without its
label.

STORY: A traveller comparing operators learns the stretch, the distance, the
grade and the price in one glance, sees that it is running today, and lands in
a WhatsApp conversation with their details already captured.

FIRST VIEWPORT: River-status strap pinned above the header; full-bleed hero
with a dark scrim, headline and enquiry action left, three service cards
breaking the fold beneath.

FORM: The category standard, played straight — the standing exit, taken by the
user after a grounded hand and a bolder foreign-form hand. Craft bar: Klook,
GetYourGuide, Viator.

FINISH: unreviewed and undocumented is unfinished; this build ends with the
finish review, the verdict, DESIGN.md, and every shipping raster carrying its
provenance.
-->`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-IN" className={`${archivo.variable} h-full`}>
      <body className="min-h-full bg-canvas text-ink antialiased">
        <div hidden dangerouslySetInnerHTML={{ __html: DIRECTION_CONTRACT }} />
        {children}
      </body>
    </html>
  );
}
