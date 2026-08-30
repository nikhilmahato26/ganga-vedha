"use client";

import * as React from "react";
import { ArrowRight, CircleCheck, MessageCircle } from "lucide-react";
import {
  Button,
  Field,
  Input,
  LinkButton,
  Modal,
  Select,
  Textarea,
} from "@/components/ui";
import { formatINR, todayIST, whatsappHref } from "@/lib/format";
import { submitEnquiry } from "@/app/actions/enquiry";

export type EnquiryProduct = {
  kind: "rafting" | "bungee" | "paragliding" | "zipline" | "hotel" | "package" | "rental";
  slug: string;
  name: string;
  /** `null` for a quote-only product (car rental) — the modal shows "Custom quote". */
  priceInr: number | null;
  priceUnit: string;
};

type Source = "hero" | "card" | "detail" | "floating" | "contact";

export function EnquiryDialog({
  product,
  open,
  onClose,
  source = "card",
  whatsappNumber,
}: {
  product: EnquiryProduct;
  open: boolean;
  onClose: () => void;
  source?: Source;
  whatsappNumber: string;
}) {
  /**
   * A page renders one dialog per enquiry button — the sticky bar, the booking
   * panel and every related card. A hardcoded form id would collide across all
   * of them, and a submit button using form="..." binds to the FIRST match in
   * the document, so the footer button would submit a different, closed
   * dialog's form and nothing would happen.
   */
  const formId = React.useId();
  const [busy, setBusy] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState<{ refCode: string } | null>(null);
  const [values, setValues] = React.useState({
    name: "",
    phone: "",
    email: "",
    travelDate: "",
    groupSize: "2",
    message: "",
  });

  /* A dialog reopened for a different trip must not show the last one's
     result. Adjusting state during render is React's documented answer for
     "reset when a prop changes" — an effect would paint the stale success
     screen for one frame first. */
  const [session, setSession] = React.useState(`${open}:${product.slug}`);
  const currentSession = `${open}:${product.slug}`;
  if (session !== currentSession) {
    setSession(currentSession);
    if (done) setDone(null);
    if (Object.keys(errors).length) setErrors({});
    if (formError) setFormError(null);
  }

  const set = (k: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setValues((v) => ({ ...v, [k]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    setFormError(null);
    const res = await submitEnquiry({
      ...values,
      productKind: product.kind,
      productSlug: product.slug,
      source,
      website: "",
    });
    setBusy(false);
    if (res.ok) setDone({ refCode: res.refCode });
    else {
      setErrors(res.fieldErrors);
      setFormError(res.formError ?? null);
    }
  }

  const waMessage = done
    ? `Hi Ganga Vedha — I've sent an enquiry for ${product.name}. My reference is ${done.refCode}.`
    : "";
  const waLink = whatsappHref(whatsappNumber, waMessage);

  return (
    <Modal
      open={open}
      onClose={onClose}
      size={done ? "sm" : "lg"}
      title={done ? "Enquiry sent" : `Enquire about ${product.name}`}
      description={
        done
          ? undefined
          : "We'll confirm availability on WhatsApp, usually within a couple of hours."
      }
      footer={
        done ? (
          <>
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
            {waLink && (
              <LinkButton href={waLink} target="_blank" rel="noopener" variant="secondary">
                <MessageCircle className="size-4" aria-hidden />
                Continue on WhatsApp
              </LinkButton>
            )}
          </>
        ) : (
          <>
            <Button variant="ghost" onClick={onClose} disabled={busy}>
              Cancel
            </Button>
            <Button type="submit" form={formId} loading={busy} loadingLabel="Sending">
              Send enquiry <ArrowRight className="size-4" aria-hidden />
            </Button>
          </>
        )
      }
    >
      {done ? (
        <div className="text-center">
          <CircleCheck className="mx-auto size-10 text-open" aria-hidden />
          <p className="mt-4 text-ink">
            Your reference is{" "}
            <strong className="tabular font-semibold">{done.refCode}</strong>.
          </p>
          <p className="mt-2 text-small text-ink-muted">
            We have your details, so nothing is lost even if you close this. The
            fastest way to lock the date in is WhatsApp.
          </p>
        </div>
      ) : (
        <form id={formId} onSubmit={onSubmit} className="grid gap-5 sm:grid-cols-2" noValidate>
          {/* Honeypot: off-screen, not display:none, and never focusable. */}
          <div aria-hidden className="absolute left-[-9999px] h-px w-px overflow-hidden">
            <label htmlFor={`${formId}-website`}>Leave this empty</label>
            <input
              id={`${formId}-website`}
              name="website"
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          <Field label="Your name" required error={errors.name}>
            <Input
              value={values.name}
              onChange={set("name")}
              placeholder="Aarav Sharma"
              autoComplete="name"
              autoFocus
            />
          </Field>

          <Field
            label="Phone"
            required
            error={errors.phone}
            hint={errors.phone ? undefined : "We message here — we don't cold-call."}
          >
            <Input
              value={values.phone}
              onChange={set("phone")}
              placeholder="98765 43210"
              inputMode="tel"
              autoComplete="tel"
            />
          </Field>

          <Field label="Date" error={errors.travelDate} hint="Leave blank if you're flexible.">
            <Input
              type="date"
              min={todayIST()}
              value={values.travelDate}
              onChange={set("travelDate")}
            />
          </Field>

          <Field label="How many of you?" error={errors.groupSize}>
            <Select value={values.groupSize} onChange={set("groupSize")}>
              {[1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 30].map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? "person" : "people"}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="Anything we should know?"
            className="sm:col-span-2"
            error={errors.message}
          >
            <Textarea
              rows={3}
              value={values.message}
              onChange={set("message")}
              placeholder="Two of us have never rafted before."
            />
          </Field>

          {formError && (
            <p role="alert" className="sm:col-span-2 rounded-md bg-danger-soft p-3 text-small text-danger">
              {formError}
            </p>
          )}

          <p className="sm:col-span-2 rounded-md bg-canvas-sunk p-3 text-small text-ink-muted">
            {product.name} ·{" "}
            <strong className="tabular font-semibold text-ink">
              {product.priceInr === null ? "Custom quote" : formatINR(product.priceInr)}
            </strong>{" "}
            {product.priceInr === null ? "" : product.priceUnit}. Nothing is charged now — this is an
            enquiry, and we confirm before you pay anything.
          </p>
        </form>
      )}
    </Modal>
  );
}

/** The button every path on the site ends in. */
export function EnquireButton({
  product,
  whatsappNumber,
  source = "card",
  children,
  ...buttonProps
}: {
  product: EnquiryProduct;
  whatsappNumber: string;
  source?: Source;
  children?: React.ReactNode;
} & React.ComponentProps<typeof Button>) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)} {...buttonProps}>
        {children ?? (
          <>
            Book now <ArrowRight className="size-4" aria-hidden />
          </>
        )}
      </Button>
      <EnquiryDialog
        product={product}
        open={open}
        onClose={() => setOpen(false)}
        source={source}
        whatsappNumber={whatsappNumber}
      />
    </>
  );
}
