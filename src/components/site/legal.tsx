import Link from "next/link";
import { Breadcrumb, SectionHeading } from "@/components/ui";

/**
 * The shell every policy page shares — breadcrumb, title, a visible
 * "last updated" date, a sticky contents rail on wide screens, and a single
 * measure-width column for the prose. Policy pages are read, not skimmed, so
 * the column stays narrow and the type stays at body size throughout.
 */
export function LegalPage({
  title,
  intro,
  updated,
  sections,
  children,
}: {
  title: string;
  intro: string;
  updated: string;
  /** Anchor targets for the contents rail, in document order. */
  sections: { id: string; label: string }[];
  children: React.ReactNode;
}) {
  return (
    <div className="container-page pt-6 pb-8">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: title }]} />

      <div className="pt-8">
        <SectionHeading as="h1" title={title} description={intro} />
        <p className="mt-4 text-small text-ink-faint">Last updated: {updated}</p>
      </div>

      <div className="mt-12 grid gap-12 lg:grid-cols-[16rem_1fr] lg:gap-16">
        {/* Hidden below lg: ten anchors ahead of the prose is a wall of links
            to scroll past on a phone, and the sections are short enough to
            read straight through. */}
        <nav
          aria-label="On this page"
          className="hidden lg:sticky lg:top-28 lg:block lg:self-start"
        >
          <p className="text-label uppercase text-ink-faint">On this page</p>
          <ul className="mt-4 space-y-2.5">
            {sections.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="text-small text-ink-muted no-underline hover:text-ink hover:underline"
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0 space-y-12">{children}</div>
      </div>
    </div>
  );
}

/** One numbered-in-spirit policy section: an anchored h2 and its prose. */
export function LegalSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28">
      <h2 className="text-title text-ink">{title}</h2>
      <div className="mt-4 measure space-y-4 text-ink-muted">{children}</div>
    </section>
  );
}

/** A definition list for the "Definitions" blocks the policies open with. */
export function LegalDefinitions({
  items,
}: {
  items: { term: string; body: React.ReactNode }[];
}) {
  return (
    <dl className="measure space-y-4">
      {items.map((i) => (
        <div key={i.term}>
          <dt className="text-subtitle text-ink">{i.term}</dt>
          <dd className="mt-1 text-ink-muted">{i.body}</dd>
        </div>
      ))}
    </dl>
  );
}

/** The bulleted list style the policies use throughout. */
export function LegalList({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="measure space-y-2.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5 text-ink-muted">
          <span
            className="mt-2.5 size-1.5 shrink-0 rounded-full bg-jade-500"
            aria-hidden
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/** The "Contact us" card both policies close with. */
export function LegalContact({
  brandName,
  address,
  phone,
  email,
}: {
  brandName: string;
  address: string;
  phone: string;
  email: string;
}) {
  return (
    <div className="rounded-xl border border-hairline bg-jade-50 p-6 sm:p-8">
      <p className="text-subtitle text-ink">Questions about this policy?</p>
      <p className="mt-2 measure text-small text-ink-muted">
        Write to us, call us, or use the form on our contact page. We answer every
        message about a booking, a cancellation or your personal data.
      </p>
      <address className="mt-5 space-y-2 text-small not-italic text-ink-muted">
        <p className="font-semibold text-ink">{brandName}</p>
        <p>{address}</p>
        {phone && (
          <p>
            <a href={`tel:+91${phone}`} className="text-jade-700 no-underline hover:underline">
              +91 {phone.slice(0, 5)} {phone.slice(5)}
            </a>
          </p>
        )}
        {email && (
          <p>
            <a href={`mailto:${email}`} className="text-jade-700 no-underline hover:underline">
              {email}
            </a>
          </p>
        )}
      </address>
      <Link
        href="/contact"
        className="mt-5 inline-flex h-11 items-center rounded-md bg-jade-950 px-5 text-small font-semibold text-white no-underline hover:bg-jade-900"
      >
        Go to the contact page
      </Link>
    </div>
  );
}
