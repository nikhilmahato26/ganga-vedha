"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import {
  Button,
  Card,
  CardBody,
  Field,
  Input,
  Select,
  Switch,
  Textarea,
} from "@/components/ui";
import { ImageUploader } from "@/components/admin/uploader";
import { FaqEditor, type FaqPair } from "@/components/admin/faq-editor";
import { useToast } from "@/components/ui";
import type { MediaItem } from "@/lib/media-types";
import { slugify } from "@/lib/format";
import { parseLines } from "@/lib/schemas/adventure";
import { createAdventure, updateAdventure } from "@/app/actions/adventures";
import type { Adventure } from "@/db/schema";

function joinLines(list: string[]): string {
  return list.join("\n");
}

export type AdventureAdminKind = "rafting" | "bungee" | "paragliding" | "zipline";

export function AdventureForm({
  kind,
  adventure,
  coverMedia,
}: {
  kind: AdventureAdminKind;
  /** Present when editing; absent when creating. */
  adventure?: Adventure;
  coverMedia: MediaItem | null;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, setPending] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [slugTouched, setSlugTouched] = React.useState(Boolean(adventure));

  const isActivityRoute = kind === "paragliding" || kind === "zipline";
  const [kindValue, setKindValue] = React.useState<AdventureAdminKind>(
    (adventure?.kind as AdventureAdminKind) ?? kind,
  );
  const [name, setName] = React.useState(adventure?.name ?? "");
  const [slug, setSlug] = React.useState(adventure?.slug ?? "");
  const [distanceKm, setDistanceKm] = React.useState(
    adventure?.distanceKm ? String(Number(adventure.distanceKm)) : "",
  );
  const [heightM, setHeightM] = React.useState(
    adventure?.heightM ? String(adventure.heightM) : "",
  );
  const [putInPoint, setPutInPoint] = React.useState(adventure?.putInPoint ?? "");
  const [grade, setGrade] = React.useState(adventure?.grade ?? "moderate");
  const [durationMinutes, setDurationMinutes] = React.useState(
    String(adventure?.durationMinutes ?? 120),
  );
  const [priceInr, setPriceInr] = React.useState(String(adventure?.priceInr ?? ""));
  const [compareAtPriceInr, setCompareAtPriceInr] = React.useState(
    adventure?.compareAtPriceInr ? String(adventure.compareAtPriceInr) : "",
  );
  const [rating, setRating] = React.useState(
    adventure?.rating ? String(Number(adventure.rating)) : "",
  );
  const [reviewCount, setReviewCount] = React.useState(
    adventure?.reviewCount ? String(adventure.reviewCount) : "",
  );
  const [badge, setBadge] = React.useState(adventure?.badge ?? "");
  const [bestFor, setBestFor] = React.useState(adventure?.bestFor ?? "");
  const [brand, setBrand] = React.useState(adventure?.brand ?? "");
  const [summary, setSummary] = React.useState(adventure?.summary ?? "");
  const [description, setDescription] = React.useState(adventure?.description ?? "");
  const [inclusions, setInclusions] = React.useState(joinLines(adventure?.inclusions ?? []));
  const [exclusions, setExclusions] = React.useState(joinLines(adventure?.exclusions ?? []));
  const [whatToBring, setWhatToBring] = React.useState(joinLines(adventure?.whatToBring ?? []));
  const [rapids, setRapids] = React.useState(joinLines(adventure?.rapids ?? []));
  const [faqs, setFaqs] = React.useState<FaqPair[]>(adventure?.faqs ?? []);
  const [meetingPoint, setMeetingPoint] = React.useState(adventure?.meetingPoint ?? "");
  const [minAge, setMinAge] = React.useState(adventure?.minAge ? String(adventure.minAge) : "");
  const [minWeightKg, setMinWeightKg] = React.useState(
    adventure?.minWeightKg ? String(adventure.minWeightKg) : "",
  );
  const [maxWeightKg, setMaxWeightKg] = React.useState(
    adventure?.maxWeightKg ? String(adventure.maxWeightKg) : "",
  );
  const [isPublished, setIsPublished] = React.useState(adventure?.isPublished ?? false);
  const [cover, setCover] = React.useState<MediaItem[]>(coverMedia ? [coverMedia] : []);

  const basePath =
    kind === "rafting" || kind === "bungee" ? `/admin/${kind}` : "/admin/adventures";
  const label =
    kind === "rafting" ? "stretch" : kind === "bungee" ? "package" : "activity";
  const backLabel =
    kind === "rafting" ? "rafting" : kind === "bungee" ? "bungee" : "adventures";

  function onNameChange(v: string) {
    setName(v);
    if (!slugTouched) setSlug(slugify(v));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setErrors({});

    const payload = {
      kind: isActivityRoute ? kindValue : kind,
      name,
      slug,
      distanceKm: kind === "rafting" ? (distanceKm ? Number(distanceKm) : null) : null,
      heightM: kind === "bungee" ? (heightM ? Number(heightM) : null) : null,
      putInPoint: putInPoint || null,
      grade: grade || null,
      durationMinutes: Number(durationMinutes),
      priceInr: Number(priceInr),
      compareAtPriceInr: compareAtPriceInr ? Number(compareAtPriceInr) : null,
      rating: rating ? Number(rating) : null,
      reviewCount: reviewCount ? Number(reviewCount) : null,
      badge: badge || null,
      bestFor: bestFor || null,
      brand: brand || null,
      summary,
      description,
      inclusions: parseLines(inclusions),
      exclusions: parseLines(exclusions),
      whatToBring: parseLines(whatToBring),
      rapids: kind === "rafting" ? parseLines(rapids) : [],
      faqs: faqs.filter((f) => f.q.trim() && f.a.trim()),
      meetingPoint: meetingPoint || null,
      minAge: minAge ? Number(minAge) : null,
      minWeightKg: minWeightKg ? Number(minWeightKg) : null,
      maxWeightKg: maxWeightKg ? Number(maxWeightKg) : null,
      coverMediaId: cover[0]?.id ?? null,
      isPublished,
    };

    const result = adventure
      ? await updateAdventure(adventure.id, payload)
      : await createAdventure(payload);

    setPending(false);
    if (!result?.ok) {
      setErrors(result?.fieldErrors ?? {});
      toast({ tone: "error", title: result?.error ?? "Something went wrong." });
      return;
    }

    toast({ tone: "success", title: adventure ? "Saved" : "Created" });
    router.push(basePath);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-3xl pb-24" noValidate>
      <Link
        href={basePath}
        className="inline-flex items-center gap-1.5 text-small font-semibold text-ink-muted no-underline hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden /> Back to {backLabel}
      </Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-display-md text-ink">
          {adventure ? `Edit ${label}` : `Add a ${label}`}
        </h1>
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
          <ImageUploader folder="adventures" items={cover} onChange={setCover} max={1} />
        </CardBody>
      </Card>

      <Card elevation="flat" className="mt-6">
        <CardBody className="space-y-5 p-6">
          <h2 className="text-subtitle text-ink">Basics</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            {isActivityRoute && (
              <Field label="Activity type">
                <Select
                  value={kindValue}
                  onChange={(e) => setKindValue(e.target.value as AdventureAdminKind)}
                >
                  <option value="paragliding">Paragliding</option>
                  <option value="zipline">Zip lining</option>
                </Select>
              </Field>
            )}
            <Field label="Name" required error={errors.name}>
              <Input value={name} onChange={(e) => onNameChange(e.target.value)} required />
            </Field>
            <Field
              label="URL slug"
              required
              error={errors.slug}
              hint={`/${kind}/${slug || "…"}`}
            >
              <Input
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(e.target.value);
                }}
                required
              />
            </Field>

            {kind === "rafting" && (
              <Field label="Distance (km)" required error={errors.distanceKm}>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  value={distanceKm}
                  onChange={(e) => setDistanceKm(e.target.value)}
                  required
                />
              </Field>
            )}
            {kind === "bungee" && (
              <Field label="Height (m)" required error={errors.heightM}>
                <Input
                  type="number"
                  min="0"
                  value={heightM}
                  onChange={(e) => setHeightM(e.target.value)}
                  required
                />
              </Field>
            )}

            <Field label={kind === "rafting" ? "Put-in point" : "Location"}>
              <Input value={putInPoint} onChange={(e) => setPutInPoint(e.target.value)} />
            </Field>

            <Field label="Grade">
              <Select value={grade ?? ""} onChange={(e) => setGrade(e.target.value as typeof grade)}>
                <option value="easy">Easy</option>
                <option value="moderate">Moderate</option>
                <option value="challenging">Challenging</option>
              </Select>
            </Field>

            <Field label="Duration (minutes)" required error={errors.durationMinutes}>
              <Input
                type="number"
                min="1"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                required
              />
            </Field>

            {kind === "bungee" && (
              <Field
                label="Operator / brand"
                hint="Bungee jumps are grouped by this on the site."
                className="sm:col-span-2"
              >
                <Input
                  list="bungee-brand-options"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="e.g. Jumpin Heights"
                />
                <datalist id="bungee-brand-options">
                  {[
                    "Maa Ganga Bungee",
                    "Himalayan Bungee",
                    "Splash Bungy",
                    "Jumpin Heights",
                    "Thrill Factory",
                    "Himalayan Bungy (Jim Corbett)",
                  ].map((b) => (
                    <option key={b} value={b} />
                  ))}
                </datalist>
              </Field>
            )}

            <Field label="Badge" hint='e.g. "Most popular"'>
              <Input value={badge} onChange={(e) => setBadge(e.target.value)} />
            </Field>
            <Field label="Best for" hint='e.g. "Best for beginners"'>
              <Input value={bestFor} onChange={(e) => setBestFor(e.target.value)} />
            </Field>
          </div>
        </CardBody>
      </Card>

      <Card elevation="flat" className="mt-6">
        <CardBody className="space-y-5 p-6">
          <h2 className="text-subtitle text-ink">Pricing</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Price (₹, per person)" required error={errors.priceInr}>
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
              hint="Optional — shown struck through. Must be higher than the price."
              error={errors.compareAtPriceInr}
            >
              <Input
                type="number"
                min="0"
                value={compareAtPriceInr}
                onChange={(e) => setCompareAtPriceInr(e.target.value)}
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
              <Textarea rows={5} value={inclusions} onChange={(e) => setInclusions(e.target.value)} />
            </Field>
            <Field label="Not included" hint="One item per line.">
              <Textarea rows={5} value={exclusions} onChange={(e) => setExclusions(e.target.value)} />
            </Field>
            <Field label="What to bring" hint="One item per line.">
              <Textarea rows={5} value={whatToBring} onChange={(e) => setWhatToBring(e.target.value)} />
            </Field>
            {kind === "rafting" && (
              <Field label="Named rapids" hint="One per line.">
                <Textarea rows={5} value={rapids} onChange={(e) => setRapids(e.target.value)} />
              </Field>
            )}
          </div>

          <Field label="Meeting point">
            <Textarea rows={2} value={meetingPoint} onChange={(e) => setMeetingPoint(e.target.value)} />
          </Field>
        </CardBody>
      </Card>

      <Card elevation="flat" className="mt-6">
        <CardBody className="space-y-5 p-6">
          <h2 className="text-subtitle text-ink">Limits</h2>
          <div className="grid gap-5 sm:grid-cols-3">
            <Field label="Minimum age">
              <Input type="number" min="0" value={minAge} onChange={(e) => setMinAge(e.target.value)} />
            </Field>
            <Field label="Min weight (kg)">
              <Input
                type="number"
                min="0"
                value={minWeightKg}
                onChange={(e) => setMinWeightKg(e.target.value)}
              />
            </Field>
            <Field label="Max weight (kg)" error={errors.maxWeightKg}>
              <Input
                type="number"
                min="0"
                value={maxWeightKg}
                onChange={(e) => setMaxWeightKg(e.target.value)}
              />
            </Field>
          </div>
        </CardBody>
      </Card>

      <Card elevation="flat" className="mt-6">
        <CardBody className="space-y-5 p-6">
          <h2 className="text-subtitle text-ink">Reviews</h2>
          <p className="text-small text-ink-muted">
            Placeholder until real reviews exist for this listing — leave blank to hide the rating.
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
        <Link href={basePath} className="no-underline">
          <Button type="button" variant="ghost">
            Cancel
          </Button>
        </Link>
        <Button type="submit" loading={pending} loadingLabel="Saving">
          <Save className="size-4" aria-hidden /> {adventure ? "Save changes" : `Create ${label}`}
        </Button>
      </div>
    </form>
  );
}
