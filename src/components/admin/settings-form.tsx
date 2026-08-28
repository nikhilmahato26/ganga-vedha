"use client";

import * as React from "react";
import { Save } from "lucide-react";
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
import { updateSettings } from "@/app/actions/settings";
import type { SiteSettings } from "@/db/schema";

export function SettingsForm({ settings }: { settings: SiteSettings }) {
  const { toast } = useToast();
  const [pending, setPending] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const [brandName, setBrandName] = React.useState(settings.brandName);
  const [tagline, setTagline] = React.useState(settings.tagline ?? "");
  const [whatsappNumber, setWhatsappNumber] = React.useState(settings.whatsappNumber ?? "");
  const [phone, setPhone] = React.useState(settings.phone ?? "");
  const [email, setEmail] = React.useState(settings.email ?? "");
  const [address, setAddress] = React.useState(settings.address ?? "");
  const [mapUrl, setMapUrl] = React.useState(settings.mapUrl ?? "");
  const [heroHeading, setHeroHeading] = React.useState(settings.heroHeading ?? "");
  const [heroSubheading, setHeroSubheading] = React.useState(settings.heroSubheading ?? "");
  const [announcement, setAnnouncement] = React.useState(settings.announcement ?? "");
  const [announcementActive, setAnnouncementActive] = React.useState(settings.announcementActive);
  const [riverStatusLabel, setRiverStatusLabel] = React.useState(settings.riverStatusLabel);
  const [gaugeLocation, setGaugeLocation] = React.useState(settings.gaugeLocation);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setErrors({});

    const result = await updateSettings({
      brandName,
      tagline: tagline || null,
      whatsappNumber,
      phone,
      email,
      address,
      mapUrl,
      heroHeading,
      heroSubheading,
      announcement: announcement || null,
      announcementActive,
      riverStatusLabel,
      gaugeLocation,
    });

    setPending(false);
    if (!result?.ok) {
      setErrors(result?.fieldErrors ?? {});
      toast({ tone: "error", title: result?.error ?? "Something went wrong." });
      return;
    }
    toast({ tone: "success", title: "Settings saved" });
  }

  return (
    <form onSubmit={onSubmit} className="max-w-3xl space-y-6" noValidate>
      <Card elevation="flat">
        <CardBody className="space-y-5 p-6">
          <h2 className="text-subtitle text-ink">Brand</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Brand name" required error={errors.brandName}>
              <Input value={brandName} onChange={(e) => setBrandName(e.target.value)} required />
            </Field>
            <Field label="Tagline">
              <Input value={tagline} onChange={(e) => setTagline(e.target.value)} />
            </Field>
          </div>
        </CardBody>
      </Card>

      <Card elevation="flat">
        <CardBody className="space-y-5 p-6">
          <h2 className="text-subtitle text-ink">Contact</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="WhatsApp number" hint="10 digits, no country code." error={errors.whatsappNumber}>
              <Input value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} />
            </Field>
            <Field label="Phone">
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </Field>
            <Field label="Email" error={errors.email}>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Field label="Map link" error={errors.mapUrl}>
              <Input value={mapUrl} onChange={(e) => setMapUrl(e.target.value)} />
            </Field>
            <Field label="Address" className="sm:col-span-2">
              <Textarea rows={2} value={address} onChange={(e) => setAddress(e.target.value)} />
            </Field>
          </div>
        </CardBody>
      </Card>

      <Card elevation="flat">
        <CardBody className="space-y-5 p-6">
          <h2 className="text-subtitle text-ink">Homepage hero</h2>
          <Field label="Heading" hint="Use a line break for the two-line hero.">
            <Textarea rows={2} value={heroHeading} onChange={(e) => setHeroHeading(e.target.value)} />
          </Field>
          <Field label="Subheading">
            <Textarea rows={3} value={heroSubheading} onChange={(e) => setHeroSubheading(e.target.value)} />
          </Field>
        </CardBody>
      </Card>

      <Card elevation="flat">
        <CardBody className="space-y-5 p-6">
          <h2 className="text-subtitle text-ink">River status strap</h2>
          <p className="text-small text-ink-muted">
            The pinned bar at the very top of the site. This label is only shown when rafting is
            open — the monsoon closure message is a separate switch, coming with the bookings inbox.
          </p>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Status label" required>
              <Input value={riverStatusLabel} onChange={(e) => setRiverStatusLabel(e.target.value)} required />
            </Field>
            <Field label="Gauge location" required>
              <Input value={gaugeLocation} onChange={(e) => setGaugeLocation(e.target.value)} required />
            </Field>
          </div>
        </CardBody>
      </Card>

      <Card elevation="flat">
        <CardBody className="space-y-5 p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-subtitle text-ink">Announcement bar</h2>
            <Switch
              label=""
              checked={announcementActive}
              onChange={(e) => setAnnouncementActive(e.target.checked)}
            />
          </div>
          <Field label="Message">
            <Input value={announcement} onChange={(e) => setAnnouncement(e.target.value)} />
          </Field>
        </CardBody>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" loading={pending} loadingLabel="Saving">
          <Save className="size-4" aria-hidden /> Save settings
        </Button>
      </div>
    </form>
  );
}
