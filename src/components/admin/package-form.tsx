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
import { ItineraryEditor, type ItineraryDay } from "@/components/admin/itinerary-editor";
import type { MediaItem } from "@/lib/media-types";
import { slugify } from "@/lib/format";
import { parseLines } from "@/lib/schemas/adventure";
import { createPackage, updatePackage } from "@/app/actions/packages";
import type { Package } from "@/db/schema";

const join = (l: string[]) => l.join("\n");

export function PackageForm({
  pkg,
  coverMedia,
  destinationOptions,
}: {
  pkg?: Package;
  coverMedia: MediaItem | null;
  destinationOptions: { id: number; name: string }[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, setPending] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [slugTouched, setSlugTouched] = React.useState(Boolean(pkg));

  const [name, setName] = React.useState(pkg?.name ?? "");
  const [slug, setSlug] = React.useState(pkg?.slug ?? "");
  const [category, setCategory] = React.useState(pkg?.category ?? "");
  const [destinationId, setDestinationId] = React.useState(
    pkg?.destinationId ? String(pkg.destinationId) : "",
  );
  const [durationLabel, setDurationLabel] = React.useState(pkg?.durationLabel ?? "");
  const [nights, setNights] = React.useState(pkg?.nights != null ? String(pkg.nights) : "");
  const [routeLabel, setRouteLabel] = React.useState(pkg?.routeLabel ?? "");
  const [priceInr, setPriceInr] = React.useState(String(pkg?.priceInr ?? ""));
  const [compareAtPriceInr, setCompareAtPriceInr] = React.useState(
    pkg?.compareAtPriceInr ? String(pkg.compareAtPriceInr) : "",
  );
  const [priceNote, setPriceNote] = React.useState(pkg?.priceNote ?? "");
  const [badge, setBadge] = React.useState(pkg?.badge ?? "");
  const [summary, setSummary] = React.useState(pkg?.summary ?? "");
  const [description, setDescription] = React.useState(pkg?.description ?? "");
  const [itinerary, setItinerary] = React.useState<ItineraryDay[]>(pkg?.itinerary ?? []);
  const [inclusions, setInclusions] = React.useState(join(pkg?.inclusions ?? []));
  const [exclusions, setExclusions] = React.useState(join(pkg?.exclusions ?? []));
  const [accommodationNote, setAccommodationNote] = React.useState(pkg?.accommodationNote ?? "");
  const [transportNote, setTransportNote] = React.useState(pkg?.transportNote ?? "");
  const [mealsNote, setMealsNote] = React.useState(pkg?.mealsNote ?? "");
  const [terms, setTerms] = React.useState(join(pkg?.terms ?? []));
  const [faqs, setFaqs] = React.useState<FaqPair[]>(pkg?.faqs ?? []);
  const [rating, setRating] = React.useState(pkg?.rating ? String(Number(pkg.rating)) : "");
  const [reviewCount, setReviewCount] = React.useState(
    pkg?.reviewCount ? String(pkg.reviewCount) : "",
  );
  const [isPublished, setIsPublished] = React.useState(pkg?.isPublished ?? false);
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
      name,
      slug,
      category: category || null,
      destinationId: destinationId ? Number(destinationId) : null,
      durationLabel: durationLabel || null,
      nights: nights ? Number(nights) : null,
      routeLabel: routeLabel || null,
      priceInr: Number(priceInr),
      compareAtPriceInr: compareAtPriceInr ? Number(compareAtPriceInr) : null,
      priceNote: priceNote || null,
      rating: rating ? Number(rating) : null,
      reviewCount: reviewCount ? Number(reviewCount) : null,
      badge: badge || null,
      summary,
      description,
      itinerary: itinerary.filter((d) => d.title.trim() && d.detail.trim()),
      inclusions: parseLines(inclusions),
      exclusions: parseLines(exclusions),
      accommodationNote: accommodationNote || null,
      transportNote: transportNote || null,
      mealsNote: mealsNote || null,
      terms: parseLines(terms),
      faqs: faqs.filter((f) => f.q.trim() && f.a.trim()),
      coverMediaId: cover[0]?.id ?? null,
      isPublished,
    };

    const result = pkg
      ? await updatePackage(pkg.id, payload)
      : await createPackage(payload);
    setPending(false);
    if (!result?.ok) {
      setErrors(result?.fieldErrors ?? {});
      toast({ tone: "error", title: result?.error ?? "Something went wrong." });
      return;
    }
    toast({ tone: "success", title: pkg ? "Saved" : "Created" });
    router.push("/admin/packages");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-3xl pb-24" noValidate>
      <Link
        href="/admin/packages"
        className="inline-flex items-center gap-1.5 text-small font-semibold text-ink-muted no-underline hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden /> Back to packages
      </Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-display-md text-ink">{pkg ? "Edit package" : "Add a package"}</h1>
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
          <ImageUploader folder="packages" items={cover} onChange={setCover} max={1} />
        </CardBody>
      </Card>

      <Card elevation="flat" className="mt-6">
        <CardBody className="space-y-5 p-6">
          <h2 className="text-subtitle text-ink">Basics</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Name" required error={errors.name}>
              <Input value={name} onChange={(e) => onNameChange(e.target.value)} required />
            </Field>
            <Field label="URL slug" required error={errors.slug} hint={`/packages/${slug || "…"}`}>
              <Input
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(e.target.value);
                }}
                required
              />
            </Field>
            <Field label="Type" hint='e.g. "Pilgrimage", "Multi-day tour"'>
              <Input value={category} onChange={(e) => setCategory(e.target.value)} />
            </Field>
            <Field label="Primary destination">
              <Select value={destinationId} onChange={(e) => setDestinationId(e.target.value)}>
                <option value="">— None —</option>
                {destinationOptions.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Duration label" hint='e.g. "3 nights / 4 days"'>
              <Input value={durationLabel} onChange={(e) => setDurationLabel(e.target.value)} />
            </Field>
            <Field label="Nights" error={errors.nights}>
              <Input
                type="number"
                min="0"
                value={nights}
                onChange={(e) => setNights(e.target.value)}
              />
            </Field>
            <Field label="Route label" hint='e.g. "Rishikesh · Mussoorie"' className="sm:col-span-2">
              <Input value={routeLabel} onChange={(e) => setRouteLabel(e.target.value)} />
            </Field>
            <Field label="Badge" hint='e.g. "Fixed departures"'>
              <Input value={badge} onChange={(e) => setBadge(e.target.value)} />
            </Field>
          </div>
        </CardBody>
      </Card>

      <Card elevation="flat" className="mt-6">
        <CardBody className="space-y-5 p-6">
          <h2 className="text-subtitle text-ink">Pricing</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Starting price (₹)" required error={errors.priceInr}>
              <Input
                type="number"
                min="0"
                value={priceInr}
                onChange={(e) => setPriceInr(e.target.value)}
                required
              />
            </Field>
            <Field
              label="Compare-at price (₹)"
              hint="Optional — shown struck through. Must be higher."
              error={errors.compareAtPriceInr}
            >
              <Input
                type="number"
                min="0"
                value={compareAtPriceInr}
                onChange={(e) => setCompareAtPriceInr(e.target.value)}
              />
            </Field>
            <Field label="Price note" hint='e.g. "per person, twin sharing"' className="sm:col-span-2">
              <Input value={priceNote} onChange={(e) => setPriceNote(e.target.value)} />
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
            <Field label="Inclusions" hint="One item per line.">
              <Textarea rows={5} value={inclusions} onChange={(e) => setInclusions(e.target.value)} />
            </Field>
            <Field label="Exclusions" hint="One item per line.">
              <Textarea rows={5} value={exclusions} onChange={(e) => setExclusions(e.target.value)} />
            </Field>
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            <Field label="Accommodation note">
              <Textarea
                rows={3}
                value={accommodationNote}
                onChange={(e) => setAccommodationNote(e.target.value)}
              />
            </Field>
            <Field label="Transport note">
              <Textarea
                rows={3}
                value={transportNote}
                onChange={(e) => setTransportNote(e.target.value)}
              />
            </Field>
            <Field label="Meals note">
              <Textarea rows={3} value={mealsNote} onChange={(e) => setMealsNote(e.target.value)} />
            </Field>
          </div>
          <Field label="Terms & conditions" hint="One item per line.">
            <Textarea rows={4} value={terms} onChange={(e) => setTerms(e.target.value)} />
          </Field>
        </CardBody>
      </Card>

      <Card elevation="flat" className="mt-6">
        <CardBody className="space-y-5 p-6">
          <h2 className="text-subtitle text-ink">Itinerary</h2>
          <ItineraryEditor value={itinerary} onChange={setItinerary} />
        </CardBody>
      </Card>

      <Card elevation="flat" className="mt-6">
        <CardBody className="space-y-5 p-6">
          <h2 className="text-subtitle text-ink">Reviews</h2>
          <p className="text-small text-ink-muted">
            Placeholder until real reviews exist — leave blank to hide the rating.
          </p>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Rating (0–5)">
              <Input
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={rating}
                onChange={(e) => setRating(e.target.value)}
              />
            </Field>
            <Field label="Review count">
              <Input
                type="number"
                min="0"
                value={reviewCount}
                onChange={(e) => setReviewCount(e.target.value)}
              />
            </Field>
          </div>
        </CardBody>
      </Card>

      <Card elevation="flat" className="mt-6">
        <CardBody className="space-y-5 p-6">
          <h2 className="text-subtitle text-ink">Questions people ask</h2>
          <FaqEditor value={faqs} onChange={setFaqs} />
        </CardBody>
      </Card>

      <div className="sticky bottom-0 mt-8 flex justify-end gap-3 border-t border-hairline bg-canvas py-4">
        <Link href="/admin/packages" className="no-underline">
          <Button type="button" variant="ghost">
            Cancel
          </Button>
        </Link>
        <Button type="submit" loading={pending} loadingLabel="Saving">
          <Save className="size-4" aria-hidden /> {pkg ? "Save changes" : "Create package"}
        </Button>
      </div>
    </form>
  );
}
