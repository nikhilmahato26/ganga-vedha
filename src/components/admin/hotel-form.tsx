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
import { RoomEditor, type RoomEditorValue } from "@/components/admin/room-editor";
import type { MediaItem } from "@/lib/media-types";
import { slugify } from "@/lib/format";
import { createHotel, updateHotel } from "@/app/actions/hotels";
import { setEntityGallery } from "@/app/actions/media";
import type { Hotel, HotelRoom } from "@/db/schema";
import type { RoomFormValues } from "@/lib/schemas/hotel";

function joinLines(list: string[]): string {
  return list.join("\n");
}
function parseLines(raw: string): string[] {
  return raw.split("\n").map((l) => l.trim()).filter(Boolean);
}

export function HotelForm({
  hotel,
  rooms: initialRooms,
  coverMedia,
  gallery,
}: {
  hotel?: Hotel;
  rooms: (HotelRoom & { media: MediaItem | null })[];
  coverMedia: MediaItem | null;
  gallery: MediaItem[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, setPending] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [slugTouched, setSlugTouched] = React.useState(Boolean(hotel));

  const [name, setName] = React.useState(hotel?.name ?? "");
  const [slug, setSlug] = React.useState(hotel?.slug ?? "");
  const [tagline, setTagline] = React.useState(hotel?.tagline ?? "");
  const [description, setDescription] = React.useState(hotel?.description ?? "");
  const [address, setAddress] = React.useState(hotel?.address ?? "");
  const [locality, setLocality] = React.useState(hotel?.locality ?? "");
  const [mapUrl, setMapUrl] = React.useState(hotel?.mapUrl ?? "");
  const [starRating, setStarRating] = React.useState(
    hotel?.starRating ? String(hotel.starRating) : "3",
  );
  const [pricePerNightInr, setPricePerNightInr] = React.useState(
    String(hotel?.pricePerNightInr ?? ""),
  );
  const [compareAtPriceInr, setCompareAtPriceInr] = React.useState(
    hotel?.compareAtPriceInr ? String(hotel.compareAtPriceInr) : "",
  );
  const [rating, setRating] = React.useState(
    hotel?.rating ? String(Number(hotel.rating)) : "",
  );
  const [reviewCount, setReviewCount] = React.useState(
    hotel?.reviewCount ? String(hotel.reviewCount) : "",
  );
  const [badge, setBadge] = React.useState(hotel?.badge ?? "");
  const [checkInTime, setCheckInTime] = React.useState(hotel?.checkInTime ?? "12:00 pm");
  const [checkOutTime, setCheckOutTime] = React.useState(hotel?.checkOutTime ?? "10:00 am");
  const [amenities, setAmenities] = React.useState(joinLines(hotel?.amenities ?? []));
  const [houseRules, setHouseRules] = React.useState(joinLines(hotel?.houseRules ?? []));
  const [faqs, setFaqs] = React.useState<FaqPair[]>(hotel?.faqs ?? []);
  const [isPublished, setIsPublished] = React.useState(hotel?.isPublished ?? false);
  const [cover, setCover] = React.useState<MediaItem[]>(coverMedia ? [coverMedia] : []);
  const [galleryItems, setGalleryItems] = React.useState<MediaItem[]>(gallery);
  const [rooms, setRooms] = React.useState<RoomFormValues[]>(
    initialRooms.map((r) => ({
      id: r.id,
      name: r.name,
      occupancy: r.occupancy,
      bedType: r.bedType,
      pricePerNightInr: r.pricePerNightInr,
      inclusions: r.inclusions,
      mediaId: r.mediaId,
    })),
  );
  const initialRoomEditorValue: RoomEditorValue[] = initialRooms.map((r) => ({
    id: r.id,
    name: r.name,
    occupancy: r.occupancy,
    bedType: r.bedType,
    pricePerNightInr: r.pricePerNightInr,
    inclusions: r.inclusions,
    mediaId: r.mediaId,
    media: r.media,
  }));

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
      tagline: tagline || null,
      description,
      address,
      locality: locality || null,
      mapUrl: mapUrl || null,
      starRating: starRating ? Number(starRating) : null,
      pricePerNightInr: Number(pricePerNightInr),
      compareAtPriceInr: compareAtPriceInr ? Number(compareAtPriceInr) : null,
      rating: rating ? Number(rating) : null,
      reviewCount: reviewCount ? Number(reviewCount) : null,
      badge: badge || null,
      checkInTime: checkInTime || null,
      checkOutTime: checkOutTime || null,
      amenities: parseLines(amenities),
      houseRules: parseLines(houseRules),
      faqs: faqs.filter((f) => f.q.trim() && f.a.trim()),
      coverMediaId: cover[0]?.id ?? null,
      rooms,
      isPublished,
    };

    const result = hotel ? await updateHotel(hotel.id, payload) : await createHotel(payload);

    if (!result?.ok) {
      setPending(false);
      setErrors(result?.fieldErrors ?? {});
      toast({ tone: "error", title: result?.error ?? "Something went wrong." });
      return;
    }

    await setEntityGallery(
      "hotel",
      result.id,
      galleryItems.map((g) => g.id),
    );

    setPending(false);
    toast({ tone: "success", title: hotel ? "Saved" : "Created" });
    router.push("/admin/hotels");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-3xl pb-24" noValidate>
      <Link
        href="/admin/hotels"
        className="inline-flex items-center gap-1.5 text-small font-semibold text-ink-muted no-underline hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden /> Back to hotels
      </Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-display-md text-ink">{hotel ? "Edit hotel" : "Add a hotel"}</h1>
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
          <ImageUploader folder="hotels" items={cover} onChange={setCover} max={1} />
        </CardBody>
      </Card>

      {hotel ? (
        <Card elevation="flat" className="mt-6">
          <CardBody className="space-y-5 p-6">
            <h2 className="text-subtitle text-ink">Gallery</h2>
            <ImageUploader folder="hotels" items={galleryItems} onChange={setGalleryItems} max={12} />
          </CardBody>
        </Card>
      ) : (
        <p className="mt-3 text-caption text-ink-faint">
          Gallery photos can be added once the hotel is created.
        </p>
      )}

      <Card elevation="flat" className="mt-6">
        <CardBody className="space-y-5 p-6">
          <h2 className="text-subtitle text-ink">Basics</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Name" required error={errors.name}>
              <Input value={name} onChange={(e) => onNameChange(e.target.value)} required />
            </Field>
            <Field label="URL slug" required error={errors.slug} hint={`/hotels/${slug || "…"}`}>
              <Input
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(e.target.value);
                }}
                required
              />
            </Field>
            <Field label="Tagline" className="sm:col-span-2">
              <Input value={tagline} onChange={(e) => setTagline(e.target.value)} />
            </Field>
            <Field label="Address" required error={errors.address} className="sm:col-span-2">
              <Input value={address} onChange={(e) => setAddress(e.target.value)} required />
            </Field>
            <Field label="Locality" hint='e.g. "Tapovan"'>
              <Input value={locality} onChange={(e) => setLocality(e.target.value)} />
            </Field>
            <Field label="Map link" hint="Google Maps URL" error={errors.mapUrl}>
              <Input value={mapUrl} onChange={(e) => setMapUrl(e.target.value)} />
            </Field>
            <Field label="Star rating">
              <Select value={starRating} onChange={(e) => setStarRating(e.target.value)}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n} star{n > 1 ? "s" : ""}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Badge" hint='e.g. "Closest to the river"'>
              <Input value={badge} onChange={(e) => setBadge(e.target.value)} />
            </Field>
            <Field label="Check-in">
              <Input value={checkInTime} onChange={(e) => setCheckInTime(e.target.value)} />
            </Field>
            <Field label="Check-out">
              <Input value={checkOutTime} onChange={(e) => setCheckOutTime(e.target.value)} />
            </Field>
          </div>
        </CardBody>
      </Card>

      <Card elevation="flat" className="mt-6">
        <CardBody className="space-y-5 p-6">
          <h2 className="text-subtitle text-ink">Pricing</h2>
          <p className="text-small text-ink-muted">
            The &ldquo;from&rdquo; price shown on the card and hero panel — usually your cheapest room.
          </p>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Price per night (₹)" required error={errors.pricePerNightInr}>
              <Input
                type="number"
                min="0"
                value={pricePerNightInr}
                onChange={(e) => setPricePerNightInr(e.target.value)}
                required
              />
            </Field>
            <Field
              label="Compare-at price (₹)"
              hint="Optional — shown struck through."
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
          <Field label="Description" required error={errors.description}>
            <Textarea rows={5} value={description} onChange={(e) => setDescription(e.target.value)} required />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Amenities" hint="One item per line.">
              <Textarea rows={6} value={amenities} onChange={(e) => setAmenities(e.target.value)} />
            </Field>
            <Field label="House rules" hint="One item per line.">
              <Textarea rows={6} value={houseRules} onChange={(e) => setHouseRules(e.target.value)} />
            </Field>
          </div>
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
              <Input type="number" min="0" max="5" step="0.1" value={rating} onChange={(e) => setRating(e.target.value)} />
            </Field>
            <Field label="Review count">
              <Input type="number" min="0" value={reviewCount} onChange={(e) => setReviewCount(e.target.value)} />
            </Field>
          </div>
        </CardBody>
      </Card>

      <Card elevation="flat" className="mt-6">
        <CardBody className="space-y-5 p-6">
          <h2 className="text-subtitle text-ink">Rooms</h2>
          <RoomEditor value={initialRoomEditorValue} onChange={setRooms} />
        </CardBody>
      </Card>

      <Card elevation="flat" className="mt-6">
        <CardBody className="space-y-5 p-6">
          <h2 className="text-subtitle text-ink">Questions people ask</h2>
          <FaqEditor value={faqs} onChange={setFaqs} />
        </CardBody>
      </Card>

      <div className="sticky bottom-0 mt-8 flex justify-end gap-3 border-t border-hairline bg-canvas py-4">
        <Link href="/admin/hotels" className="no-underline">
          <Button type="button" variant="ghost">
            Cancel
          </Button>
        </Link>
        <Button type="submit" loading={pending} loadingLabel="Saving">
          <Save className="size-4" aria-hidden /> {hotel ? "Save changes" : "Create hotel"}
        </Button>
      </div>
    </form>
  );
}
