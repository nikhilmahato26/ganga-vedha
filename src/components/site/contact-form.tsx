"use client";

import * as React from "react";
import { ArrowRight, CircleCheck, MessageCircle } from "lucide-react";
import { Button, Field, Input, LinkButton, Select, Textarea } from "@/components/ui";
import { todayIST, whatsappHref } from "@/lib/format";
import { submitEnquiry } from "@/app/actions/enquiry";

/**
 * The contact-page enquiry form. Unlike the product modal, this has no trip
 * attached — it submits as a `general` enquiry with a free-text subject, and
 * still lands in the same admin inbox.
 */
export function ContactForm({ whatsappNumber }: { whatsappNumber: string }) {
  const [busy, setBusy] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState<{ refCode: string } | null>(null);
  const [values, setValues] = React.useState({
    name: "",
    phone: "",
    email: "",
    subject: "",
    travelDate: "",
    groupSize: "2",
    message: "",
  });

  const set =
    (k: keyof typeof values) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setValues((v) => ({ ...v, [k]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    setFormError(null);
    const res = await submitEnquiry({
      ...values,
      productKind: "general",
      productSlug: "",
      source: "contact",
      website: "",
    });
    setBusy(false);
    if (res.ok) setDone({ refCode: res.refCode });
    else {
      setErrors(res.fieldErrors);
      setFormError(res.formError ?? null);
    }
  }

  const waLink = whatsappHref(
    whatsappNumber,
    done
      ? `Hi Ganga Vedha — I've sent an enquiry. My reference is ${done.refCode}.`
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
        <p className="mt-2 text-small text-ink-muted">
          We have your details and will reply, usually within a couple of hours. The
          fastest way to carry on is WhatsApp.
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

      <Field
        label="Destination, activity or package"
        required
        error={errors.subject}
        className="sm:col-span-1"
      >
        <Input
          value={values.subject}
          onChange={set("subject")}
          placeholder="e.g. Char Dham Yatra, or 16 km rafting"
        />
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
