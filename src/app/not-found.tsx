import Link from "next/link";
import { Compass } from "lucide-react";

/**
 * Catches a genuinely unmatched URL outside both the (site) and admin route
 * groups — the (site) group has its own richer not-found with the full
 * header and footer chrome; this is the bare fallback beneath both.
 */
export default function RootNotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-canvas px-4 text-center">
      <div>
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-jade-100 text-jade-800">
          <Compass className="size-7" aria-hidden />
        </span>
        <h1 className="mt-6 text-display-md text-ink">Page not found</h1>
        <p className="mt-3 measure text-ink-muted">
          That page doesn&rsquo;t exist.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex h-13 items-center rounded-md bg-cta px-7 text-subtitle font-semibold text-white no-underline hover:bg-cta-hover"
        >
          Back to Ganga Vedha
        </Link>
      </div>
    </main>
  );
}
