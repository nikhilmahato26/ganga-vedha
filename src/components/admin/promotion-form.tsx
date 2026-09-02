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
import type { MediaItem } from "@/lib/media-types";
import { createPromotion, updatePromotion } from "@/app/actions/promotions";
import type { Promotion } from "@/db/schema";

export function PromotionForm({
  promotion,
  media,
}: {
  promotion?: Promotion;
  media: MediaItem | null;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, setPending] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const [title, setTitle] = React.useState(promotion?.title ?? "");
  const [body, setBody] = React.useState(promotion?.body ?? "");
  const [ctaLabel, setCtaLabel] = React.useState(promotion?.ctaLabel ?? "");
  const [ctaHref, setCtaHref] = React.useState(promotion?.ctaHref ?? "");
  const [isActive, setIsActive] = React.useState(promotion?.isActive ?? true);
  const [image, setImage] = React.useState<MediaItem[]>(media ? [media] : []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setErrors({});

    const payload = {
      title,
      body: body || null,
      ctaLabel: ctaLabel || null,
      ctaHref: ctaHref || null,
      mediaId: image[0]?.id ?? null,
      isActive,
    };

    const result = promotion
      ? await updatePromotion(promotion.id, payload)
      : await createPromotion(payload);
    setPending(false);
    if (!result?.ok) {
      setErrors(result?.fieldErrors ?? {});
      toast({ tone: "error", title: result?.error ?? "Something went wrong." });
      return;
    }
    toast({ tone: "success", title: promotion ? "Saved" : "Created" });
    router.push("/admin/promotions");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-2xl pb-24" noValidate>
      <Link
        href="/admin/promotions"
        className="inline-flex items-center gap-1.5 text-small font-semibold text-ink-muted no-underline hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden /> Back to promotions
      </Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-display-md text-ink">
          {promotion ? "Edit promotion" : "Add a promotion"}
        </h1>
        <Switch
          label="Live"
          description="Shows on the homepage."
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
        />
      </div>

      <Card elevation="flat" className="mt-6">
        <CardBody className="space-y-5 p-6">
          <h2 className="text-subtitle text-ink">Image</h2>
          <p className="text-small text-ink-muted">Optional — a small photo shown beside the text.</p>
          <ImageUploader folder="promotions" items={image} onChange={setImage} max={1} />
        </CardBody>
      </Card>

      <Card elevation="flat" className="mt-6">
        <CardBody className="space-y-5 p-6">
          <h2 className="text-subtitle text-ink">Text</h2>
          <Field label="Title" required error={errors.title}>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Monsoon rates on all stays"
              required
            />
          </Field>
          <Field label="Body" hint="One or two short lines. Optional." error={errors.body}>
            <Textarea rows={2} value={body} onChange={(e) => setBody(e.target.value)} />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Button text" hint="Optional." error={errors.ctaLabel}>
              <Input
                value={ctaLabel}
                onChange={(e) => setCtaLabel(e.target.value)}
                placeholder="e.g. See stays"
              />
            </Field>
            <Field
              label="Button link"
              hint="A page on the site (/stays) or a full URL."
              error={errors.ctaHref}
            >
              <Input
                value={ctaHref}
                onChange={(e) => setCtaHref(e.target.value)}
                placeholder="/stays"
              />
            </Field>
          </div>
        </CardBody>
      </Card>

      <div className="sticky bottom-0 mt-8 flex justify-end gap-3 border-t border-hairline bg-canvas py-4">
        <Link href="/admin/promotions" className="no-underline">
          <Button type="button" variant="ghost">
            Cancel
          </Button>
        </Link>
        <Button type="submit" loading={pending} loadingLabel="Saving">
          <Save className="size-4" aria-hidden /> {promotion ? "Save changes" : "Create promotion"}
        </Button>
      </div>
    </form>
  );
}
