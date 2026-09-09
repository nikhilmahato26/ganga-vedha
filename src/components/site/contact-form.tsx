"use client";

import * as React from "react";
import { ArrowRight, CircleCheck, MessageCircle } from "lucide-react";
import {
  Alert,
  Button,
  Combobox,
  Field,
  Input,
  LinkButton,
  Select,
  Textarea,
  type ComboboxGroup,
  type ComboboxOption,
} from "@/components/ui";
import { todayIST, whatsappHref } from "@/lib/format";
import { submitEnquiry } from "@/app/actions/enquiry";
import { StateField } from "@/components/site/enquiry";
import type { EnquiryOption, EnquiryOptionGroup } from "@/lib/enquiry-schema";

/**
 * The contact-page enquiry form. Unlike the product modal, this has no trip
 * attached — it submits as a `general` enquiry with a free-text subject, and
 * still lands in the same admin inbox.
 */
export function ContactForm({
  whatsappNumber,
  catalogue,
}: {
  whatsappNumber: string;
  /** Every published listing, grouped, for the "what is this about" picker. */
  catalogue: EnquiryOptionGroup[];
}) {
  const [busy, setBusy] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState<{ refCode: string; productName: string } | null>(
    null,
  );
  /**
   * What the enquiry is about, held as two mutually exclusive things: a
   * listing the guest picked, or the words they typed. Whichever is set
   * decides how the enquiry is filed on submit.
   */
  const [picked, setPicked] = React.useState<EnquiryOption | null>(null);
  const [values, setValues] = React.useState({
    name: "",
    phone: "",
    email: "",
    state: "",
    subject: "",
    travelDate: "",
    groupSize: "2",
    message: "",
  });

  /**
   * The catalogue arrives grouped for display and is indexed once for lookup,
   * so choosing a row does not walk every group on each keystroke.
   */
  const comboGroups = React.useMemo<ComboboxGroup[]>(
    () =>
      catalogue.map((group) => ({
        label: group.label,
        shortLabel: CHIP_LABEL[group.label],
        options: group.options.map(toComboOption),
      })),
    [catalogue],
  );
  const byId = React.useMemo(
    () => new Map(catalogue.flatMap((g) => g.options).map((o) => [o.id, o])),
    [catalogue],
  );

  const set =
    (k: keyof typeof values) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setValues((v) => ({ ...v, [k]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    setFormError(null);
    /**
     * A picked listing travels as its real kind and slug, so the server
     * resolves the row, checks its closure and snapshots the price — the
     * enquiry lands in the inbox attached to the product rather than as a
     * line of text somebody has to look up.
     *
     * A destination, a closed listing, or anything typed by hand has no row
     * to attach to, so it travels as a general enquiry with a subject. A
     * closed listing is deliberately not sent as a product: the server
     * refuses those outright, and losing the lead helps nobody.
     */
    const attachable = picked !== null && picked.kind !== "general" && !picked.closed;
    const res = await submitEnquiry({
      ...values,
      subject: attachable ? "" : (picked?.name ?? values.subject),
      productKind: attachable ? picked.kind : "general",
      productSlug: attachable ? picked.slug : "",
      source: "contact",
      website: "",
    });
    setBusy(false);
    if (res.ok) setDone({ refCode: res.refCode, productName: res.productName });
    else {
      setErrors(res.fieldErrors);
      setFormError(res.formError ?? null);
    }
  }

  const waLink = whatsappHref(
    whatsappNumber,
    done
      ? `Hi Ganga Vedha — I've sent an enquiry about ${done.productName}. My reference is ${done.refCode}.`
      : "Hi Ganga Vedha — I have a question about a trip.",
  );

  if (done) {
    return (
      <div className="rounded-lg border border-hairline p-8 text-center">
        <CircleCheck className="mx-auto size-10 text-open" aria-hidden />
        <p className="mt-4 text-ink">
          Thanks — your reference is{" "}
          <strong className="tabular font-semibold">{done.refCode}</strong>.
        </p>
        <p className="mt-1 text-small text-ink-muted">
          Your enquiry about <span className="font-semibold text-ink">{done.productName}</span> is with us.
        </p>
        <p className="mt-2 text-small text-ink-muted">
          We will reply, usually within a couple of hours. The fastest way to carry
          on is WhatsApp.
        </p>
        {waLink && (
          <LinkButton
            href={waLink}
            target="_blank"
            rel="noopener"
            variant="secondary"
            className="mt-5"
          >
            <MessageCircle className="size-4" aria-hidden />
            Continue on WhatsApp
          </LinkButton>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5 sm:grid-cols-2" noValidate>
      <div aria-hidden className="absolute left-[-9999px] h-px w-px overflow-hidden">
        <label htmlFor="contact-website">Leave this empty</label>
        <input id="contact-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <Field label="Your name" required error={errors.name}>
        <Input value={values.name} onChange={set("name")} autoComplete="name" placeholder="Aarav Sharma" />
      </Field>

      <Field
        label="Phone / WhatsApp"
        required
        error={errors.phone}
        hint={errors.phone ? undefined : "We message here — we don't cold-call."}
      >
        <Input
          value={values.phone}
          onChange={set("phone")}
          inputMode="tel"
          autoComplete="tel"
          placeholder="98765 43210"
        />
      </Field>

      <Field label="Email" error={errors.email} hint="Optional">
        <Input
          type="email"
          value={values.email}
          onChange={set("email")}
          autoComplete="email"
          placeholder="you@example.com"
        />
      </Field>

      <StateField value={values.state} onChange={set("state")} error={errors.state} />

      <Field
        label="Destination, activity or package"
        required
        error={errors.subject ?? errors.productSlug}
        hint="Search our trips and stays, or type it yourself."
        className="sm:col-span-1"
      >
        <Combobox
          groups={comboGroups}
          selected={picked ? toComboOption(picked) : null}
          onSelect={(option) => {
            setPicked(option ? byId.get(option.id) ?? null : null);
            if (option) setValues((v) => ({ ...v, subject: option.label }));
          }}
          text={values.subject}
          onTextChange={(subject) => {
            setPicked(null);
            setValues((v) => ({ ...v, subject }));
          }}
          placeholder="Search trips, stays and rentals"
          filterable
          allLabel="Everything"
          allowFreeText
          freeTextLabel="Ask about this"
          emptyLabel="Nothing we list matches that. Ask for it anyway."
        />
        {picked?.closed && (
          <Alert tone="closed" className="mt-1 p-3">
            Bookings for this are closed right now. Send the enquiry anyway and we
            will tell you the moment it reopens.
          </Alert>
        )}
      </Field>

      <Field label="Preferred travel date" error={errors.travelDate} hint="Leave blank if flexible.">
        <Input type="date" min={todayIST()} value={values.travelDate} onChange={set("travelDate")} />
      </Field>

      <Field label="Number of guests" error={errors.groupSize}>
        <Select value={values.groupSize} onChange={set("groupSize")}>
          {[1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 30, 40].map((n) => (
            <option key={n} value={n}>
              {n} {n === 1 ? "person" : "people"}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Special requests" className="sm:col-span-2" error={errors.message}>
        <Textarea
          rows={4}
          value={values.message}
          onChange={set("message")}
          placeholder="Anything we should know — dietary needs, first-timers, a rough budget…"
        />
      </Field>

      {formError && (
        <p role="alert" className="sm:col-span-2 rounded-md bg-danger-soft p-3 text-small text-danger">
          {formError}
        </p>
      )}

      <div className="sm:col-span-2">
        <Button type="submit" size="lg" loading={busy} loadingLabel="Sending">
          Send enquiry <ArrowRight className="size-4" aria-hidden />
        </Button>
        <p className="mt-2 text-caption text-ink-faint">
          Nothing is charged — this is an enquiry and we confirm everything before payment.
        </p>
      </div>
    </form>
  );
}

/**
 * Filter chips speak the nav's words, not the list heading's: a guest who
 * came here from "Rentals" in the header should find "Rentals" in the picker,
 * and the shorter labels keep the filter row to two lines.
 */
const CHIP_LABEL: Record<string, string> = {
  "Other adventures": "Adventures",
  "Holiday packages": "Packages",
  "Hotels & resorts": "Hotels",
  "Car & bike rental": "Rentals",
};

/**
 * A catalogue row as the picker renders it. Closed is stated on the row
 * rather than hidden from the list: a guest looking for the monsoon-shut
 * stretch should find it and read why, not conclude we stopped running it.
 */
function toComboOption(option: EnquiryOption): ComboboxOption {
  return {
    id: option.id,
    label: option.name,
    meta: option.meta,
    tag: option.closed ? "Closed" : null,
    keywords: option.keywords,
  };
}
