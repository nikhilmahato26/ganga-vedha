"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import {
  Button,
  Card,
  CardBody,
  Field,
  Input,
  Select,
  Switch,
  Textarea,
  useToast,
} from "@/components/ui";
import { ImageUploader } from "@/components/admin/uploader";
import { FaqEditor, type FaqPair } from "@/components/admin/faq-editor";
import type { MediaItem } from "@/lib/media-types";
import { slugify } from "@/lib/format";
import { parseLines } from "@/lib/schemas/adventure";
import { createRental, updateRental } from "@/app/actions/rentals";
import type { Rental } from "@/db/schema";

const join = (l: string[]) => l.join("\n");

export function RentalForm({
  rental,
  coverMedia,
}: {
  rental?: Rental;
  coverMedia: MediaItem | null;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, setPending] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [slugTouched, setSlugTouched] = React.useState(Boolean(rental));

  const [kind, setKind] = React.useState<"car" | "bike">(rental?.kind ?? "car");
  const [name, setName] = React.useState(rental?.name ?? "");
  const [slug, setSlug] = React.useState(rental?.slug ?? "");
  const [quoteOnly, setQuoteOnly] = React.useState(rental?.quoteOnly ?? false);
  const [perDayInr, setPerDayInr] = React.useState(
    rental?.perDayInr != null ? String(rental.perDayInr) : "",
  );
  const [depositInr, setDepositInr] = React.useState(
    rental?.depositInr != null ? String(rental.depositInr) : "",
  );
  const [seats, setSeats] = React.useState(rental?.seats != null ? String(rental.seats) : "");
  const [transmission, setTransmission] = React.useState(rental?.transmission ?? "");
  const [fuelNote, setFuelNote] = React.useState(rental?.fuelNote ?? "");
  const [summary, setSummary] = React.useState(rental?.summary ?? "");
  const [description, setDescription] = React.useState(rental?.description ?? "");
  const [includes, setIncludes] = React.useState(join(rental?.includes ?? []));
  const [documentsRequired, setDocumentsRequired] = React.useState(
    join(rental?.documentsRequired ?? []),
  );
  const [terms, setTerms] = React.useState(join(rental?.terms ?? []));
  const [pickupNote, setPickupNote] = React.useState(rental?.pickupNote ?? "");
  const [faqs, setFaqs] = React.useState<FaqPair[]>(rental?.faqs ?? []);
  const [isPublished, setIsPublished] = React.useState(rental?.isPublished ?? false);
  const [cover, setCover] = React.useState<MediaItem[]>(coverMedia ? [coverMedia] : []);

  function onNameChange(v: string) {
    setName(v);
    if (!slugTouched) setSlug(slugify(v));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setErrors({});

    const payload = {
      kind,
      name,
      slug,
      quoteOnly,
      perDayInr: quoteOnly ? null : perDayInr ? Number(perDayInr) : null,
      depositInr: depositInr ? Number(depositInr) : null,
      seats: seats ? Number(seats) : null,
      transmission: transmission || null,
      fuelNote: fuelNote || null,
      summary,
      description,
      includes: parseLines(includes),
      documentsRequired: parseLines(documentsRequired),
      terms: parseLines(terms),
      pickupNote: pickupNote || null,
      faqs: faqs.filter((f) => f.q.trim() && f.a.trim()),
      coverMediaId: cover[0]?.id ?? null,
      isPublished,
    };

    const result = rental
      ? await updateRental(rental.id, payload)
      : await createRental(payload);
    setPending(false);
    if (!result?.ok) {
      setErrors(result?.fieldErrors ?? {});
      toast({ tone: "error", title: result?.error ?? "Something went wrong." });
      return;
    }
    toast({ tone: "success", title: rental ? "Saved" : "Created" });
    router.push("/admin/rentals");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-3xl pb-24" noValidate>
      <Link
        href="/admin/rentals"
        className="inline-flex items-center gap-1.5 text-small font-semibold text-ink-muted no-underline hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden /> Back to rentals
      </Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-display-md text-ink">{rental ? "Edit rental" : "Add a rental"}</h1>
        <Switch
          label="Published"
          description="Live on the site."
          checked={isPublished}
          onChange={(e) => setIsPublished(e.target.checked)}
        />
      </div>

      <Card elevation="flat" className="mt-6">
        <CardBody className="space-y-5 p-6">
          <h2 className="text-subtitle text-ink">Cover photo</h2>
          <ImageUploader folder="rentals" items={cover} onChange={setCover} max={1} />
        </CardBody>
      </Card>

      <Card elevation="flat" className="mt-6">
        <CardBody className="space-y-5 p-6">
          <h2 className="text-subtitle text-ink">Basics</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Type">
              <Select value={kind} onChange={(e) => setKind(e.target.value as "car" | "bike")}>
                <option value="car">Car</option>
                <option value="bike">Bike</option>
              </Select>
            </Field>
            <Field label="Name" required error={errors.name}>
              <Input value={name} onChange={(e) => onNameChange(e.target.value)} required />
            </Field>
            <Field label="URL slug" required error={errors.slug} hint={`/rentals/${slug || "…"}`}>
              <Input
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(e.target.value);
                }}
                required
              />
            </Field>
            <Field label="Vehicle / transmission" hint='e.g. "Sedan · SUV", "Geared scooter"'>
              <Input value={transmission} onChange={(e) => setTransmission(e.target.value)} />
            </Field>
            <Field label="Seats" hint="Cars only.">
              <Input
                type="number"
                min="1"
                value={seats}
                onChange={(e) => setSeats(e.target.value)}
              />
            </Field>
            <Field label="Fuel note" hint='e.g. "Fuel not included"'>
              <Input value={fuelNote} onChange={(e) => setFuelNote(e.target.value)} />
            </Field>
          </div>
        </CardBody>
      </Card>

      <Card elevation="flat" className="mt-6">
        <CardBody className="space-y-5 p-6">
          <h2 className="text-subtitle text-ink">Pricing</h2>
          <Switch
            label="Quote only"
            description="No fixed daily rate — the enquiry is a request for a custom quotation (typical for cars)."
            checked={quoteOnly}
            onChange={(e) => setQuoteOnly(e.target.checked)}
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="Price per day (₹)"
              hint={quoteOnly ? "Ignored while quote-only is on." : "Required unless quote-only."}
              error={errors.perDayInr}
            >
              <Input
                type="number"
                min="0"
                value={perDayInr}
                onChange={(e) => setPerDayInr(e.target.value)}
                disabled={quoteOnly}
              />
            </Field>
            <Field label="Security deposit (₹)" hint="Optional.">
              <Input
                type="number"
                min="0"
                value={depositInr}
                onChange={(e) => setDepositInr(e.target.value)}
              />
            </Field>
          </div>
        </CardBody>
      </Card>

      <Card elevation="flat" className="mt-6">
        <CardBody className="space-y-5 p-6">
          <h2 className="text-subtitle text-ink">Copy</h2>
          <Field label="Summary" required hint="One line, shown on the card." error={errors.summary}>
            <Textarea rows={2} value={summary} onChange={(e) => setSummary(e.target.value)} required />
          </Field>
          <Field label="Description" required error={errors.description}>
            <Textarea
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="What's included" hint="One item per line.">
              <Textarea rows={4} value={includes} onChange={(e) => setIncludes(e.target.value)} />
            </Field>
            <Field label="Documents required" hint="One item per line.">
              <Textarea
                rows={4}
                value={documentsRequired}
                onChange={(e) => setDocumentsRequired(e.target.value)}
              />
            </Field>
          </div>
          <Field label="Terms & conditions" hint="One item per line.">
            <Textarea rows={4} value={terms} onChange={(e) => setTerms(e.target.value)} />
          </Field>
          <Field label="Pickup note">
            <Textarea rows={2} value={pickupNote} onChange={(e) => setPickupNote(e.target.value)} />
          </Field>
        </CardBody>
      </Card>

      <Card elevation="flat" className="mt-6">
        <CardBody className="space-y-5 p-6">
          <h2 className="text-subtitle text-ink">Questions people ask</h2>
          <FaqEditor value={faqs} onChange={setFaqs} />
        </CardBody>
      </Card>

      <div className="sticky bottom-0 mt-8 flex justify-end gap-3 border-t border-hairline bg-canvas py-4">
        <Link href="/admin/rentals" className="no-underline">
          <Button type="button" variant="ghost">
            Cancel
          </Button>
        </Link>
        <Button type="submit" loading={pending} loadingLabel="Saving">
          <Save className="size-4" aria-hidden /> {rental ? "Save changes" : "Create rental"}
        </Button>
      </div>
    </form>
  );
}
