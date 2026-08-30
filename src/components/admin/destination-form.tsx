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
  Switch,
  Textarea,
  useToast,
} from "@/components/ui";
import { ImageUploader } from "@/components/admin/uploader";
import { FaqEditor, type FaqPair } from "@/components/admin/faq-editor";
import type { MediaItem } from "@/lib/media-types";
import { slugify } from "@/lib/format";
import { parseLines } from "@/lib/schemas/adventure";
import { createDestination, updateDestination } from "@/app/actions/destinations";
import type { Destination } from "@/db/schema";

const join = (l: string[]) => l.join("\n");

export function DestinationForm({
  destination,
  coverMedia,
}: {
  destination?: Destination;
  coverMedia: MediaItem | null;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, setPending] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [slugTouched, setSlugTouched] = React.useState(Boolean(destination));

  const [name, setName] = React.useState(destination?.name ?? "");
  const [slug, setSlug] = React.useState(destination?.slug ?? "");
  const [region, setRegion] = React.useState(destination?.region ?? "");
  const [tagline, setTagline] = React.useState(destination?.tagline ?? "");
  const [intro, setIntro] = React.useState(destination?.intro ?? "");
  const [highlights, setHighlights] = React.useState(join(destination?.highlights ?? []));
  const [bestTime, setBestTime] = React.useState(destination?.bestTime ?? "");
  const [howToReach, setHowToReach] = React.useState(destination?.howToReach ?? "");
  const [faqs, setFaqs] = React.useState<FaqPair[]>(destination?.faqs ?? []);
  const [isPublished, setIsPublished] = React.useState(destination?.isPublished ?? false);
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
      region: region || null,
      tagline: tagline || null,
      intro,
      highlights: parseLines(highlights),
      bestTime: bestTime || null,
      howToReach: howToReach || null,
      faqs: faqs.filter((f) => f.q.trim() && f.a.trim()),
      coverMediaId: cover[0]?.id ?? null,
      isPublished,
    };

    const result = destination
      ? await updateDestination(destination.id, payload)
      : await createDestination(payload);
    setPending(false);
    if (!result?.ok) {
      setErrors(result?.fieldErrors ?? {});
      toast({ tone: "error", title: result?.error ?? "Something went wrong." });
      return;
    }
    toast({ tone: "success", title: destination ? "Saved" : "Created" });
    router.push("/admin/destinations");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-3xl pb-24" noValidate>
      <Link
        href="/admin/destinations"
        className="inline-flex items-center gap-1.5 text-small font-semibold text-ink-muted no-underline hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden /> Back to destinations
      </Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-display-md text-ink">
          {destination ? "Edit destination" : "Add a destination"}
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
          <ImageUploader folder="destinations" items={cover} onChange={setCover} max={1} />
        </CardBody>
      </Card>

      <Card elevation="flat" className="mt-6">
        <CardBody className="space-y-5 p-6">
          <h2 className="text-subtitle text-ink">Basics</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Name" required error={errors.name}>
              <Input value={name} onChange={(e) => onNameChange(e.target.value)} required />
            </Field>
            <Field label="URL slug" required error={errors.slug} hint={`/stays/${slug || "…"}`}>
              <Input
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(e.target.value);
                }}
                required
              />
            </Field>
            <Field label="Region" hint='e.g. "Uttarakhand", "Himachal Pradesh"'>
              <Input value={region} onChange={(e) => setRegion(e.target.value)} />
            </Field>
            <Field label="Tagline" hint="One short line under the name.">
              <Input value={tagline} onChange={(e) => setTagline(e.target.value)} />
            </Field>
          </div>
        </CardBody>
      </Card>

      <Card elevation="flat" className="mt-6">
        <CardBody className="space-y-5 p-6">
          <h2 className="text-subtitle text-ink">Copy</h2>
          <Field label="Introduction" required error={errors.intro}>
            <Textarea rows={5} value={intro} onChange={(e) => setIntro(e.target.value)} required />
          </Field>
          <Field label="Best experiences" hint="One item per line.">
            <Textarea rows={5} value={highlights} onChange={(e) => setHighlights(e.target.value)} />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Best time to visit">
              <Textarea rows={3} value={bestTime} onChange={(e) => setBestTime(e.target.value)} />
            </Field>
            <Field label="How to reach">
              <Textarea rows={3} value={howToReach} onChange={(e) => setHowToReach(e.target.value)} />
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
        <Link href="/admin/destinations" className="no-underline">
          <Button type="button" variant="ghost">
            Cancel
          </Button>
        </Link>
        <Button type="submit" loading={pending} loadingLabel="Saving">
          <Save className="size-4" aria-hidden /> {destination ? "Save changes" : "Create destination"}
        </Button>
      </div>
    </form>
  );
}
