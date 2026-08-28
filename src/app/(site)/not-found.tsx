import Link from "next/link";
import { ArrowRight, Compass } from "lucide-react";
import { LinkButton } from "@/components/ui";

export default function SiteNotFound() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <span className="grid size-16 place-items-center rounded-full bg-jade-100 text-jade-800">
        <Compass className="size-7" aria-hidden />
      </span>
      <h1 className="mt-6 text-display-md text-ink">That page has moved on</h1>
      <p className="mt-3 measure text-ink-muted">
        The stretch, stay or page you were after isn&rsquo;t here anymore — a listing may have
        been renamed or taken down.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <LinkButton href="/" size="lg">
          Back to home <ArrowRight className="size-4" aria-hidden />
        </LinkButton>
        <Link
          href="/rafting"
          className="inline-flex h-13 items-center rounded-md border border-granite-300 px-7 text-subtitle font-semibold text-ink no-underline hover:border-granite-400"
        >
          See rafting stretches
        </Link>
      </div>
    </div>
  );
}
