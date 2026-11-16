import { MapPin, Navigation } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The landmarks people search for a hotel near ("hotels near Laxman Jhula", "near Ram Jhula"…),
 * each with a Google Maps directions link from the hotel. No distances are written here: Maps
 * shows the real one, so nothing on the page can drift out of date or overstate how close it is.
 */
const PLACES = [
  "Laxman Jhula",
  "Tapovan Market",
  "Ram Jhula",
  "Parmarth Niketan",
  "The Beatles Ashram",
  "Neer Garh Waterfall",
  "Triveni Ghat",
  "Shivpuri",
] as const;

const ORIGIN = "Ganga Veda Hotels & Resorts, Tapovan, Rishikesh";

const directions = (place: string) =>
  `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(ORIGIN)}&destination=${encodeURIComponent(
    `${place}, Rishikesh, Uttarakhand`,
  )}`;

export function NearbyPlaces({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border border-hairline bg-canvas-sunk p-6 sm:p-8", className)}>
      <h2 className="text-title text-ink">
        A hotel in Tapovan, Rishikesh — near Laxman Jhula and Ram Jhula
      </h2>
      <p className="mt-3 measure text-small text-ink-muted">
        Ganga Veda Hotels &amp; Resorts is in Tapovan, the quieter end of Rishikesh above the Ganga.
        Laxman Jhula and Tapovan Market are close by; Ram Jhula, Parmarth Niketan, the Beatles Ashram,
        Neer Garh waterfall and Triveni Ghat are a short ride away, and Shivpuri — where most rafting
        starts — is up the river. Tap a place for directions from the hotel.
      </p>
      <ul className="mt-5 flex flex-wrap gap-2.5">
        {PLACES.map((place) => (
          <li key={place}>
            <a
              href={directions(place)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-hairline bg-canvas px-3.5 text-small text-ink no-underline transition-colors hover:border-jade-300 hover:bg-jade-50"
            >
              <MapPin className="size-4 text-jade-700" aria-hidden />
              {place}
              <Navigation className="size-3.5 text-ink-faint" aria-hidden />
              <span className="sr-only">(directions in Google Maps)</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
