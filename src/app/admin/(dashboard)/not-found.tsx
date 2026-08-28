import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";

export default function AdminNotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center py-20 text-center">
      <span className="grid size-14 place-items-center rounded-full bg-granite-100 text-ink-faint">
        <SearchX className="size-6" aria-hidden />
      </span>
      <h1 className="mt-5 text-title text-ink">That listing doesn&rsquo;t exist</h1>
      <p className="mt-2 text-small text-ink-muted">
        It may have been deleted, or the link is out of date.
      </p>
      <Link
        href="/admin"
        className="mt-6 inline-flex items-center gap-1.5 text-small font-semibold text-link no-underline"
      >
        <ArrowLeft className="size-4" aria-hidden /> Back to dashboard
      </Link>
    </div>
  );
}
