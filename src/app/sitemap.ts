import type { MetadataRoute } from "next";
import { publicEnv } from "@/lib/env";
import {
  getActivities,
  getAdventures,
  getDestinations,
  getHotels,
  getPackages,
  getRaftingByDistance,
  getRentals,
} from "@/lib/content";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = publicEnv.NEXT_PUBLIC_SITE_URL;
  const [rafting, bungee, activities, hotels, packages, destinations, rentals] =
    await Promise.all([
      getRaftingByDistance(),
      getAdventures("bungee"),
      getActivities(),
      getHotels(),
      getPackages(),
      getDestinations(),
      getRentals(),
    ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/adventures`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/rafting`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/packages`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/stays`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/hotels`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/rentals`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/gallery`, changeFrequency: "weekly", priority: 0.5 },
    { url: `${base}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/contact`, changeFrequency: "monthly", priority: 0.6 },
  ];

  const mk = (
    prefix: string,
    rows: { slug: string }[],
    priority: number,
  ): MetadataRoute.Sitemap =>
    rows.map((r) => ({
      url: `${base}${prefix}/${r.slug}`,
      changeFrequency: "weekly" as const,
      priority,
    }));

  return [
    ...staticRoutes,
    ...mk("/rafting", rafting, 0.7),
    ...mk("/bungee", bungee, 0.7),
    ...mk("/adventures", activities, 0.7),
    ...mk("/packages", packages, 0.7),
    ...mk("/stays", destinations, 0.7),
    ...mk("/hotels", hotels, 0.6),
    ...mk("/rentals", rentals, 0.6),
  ];
}
