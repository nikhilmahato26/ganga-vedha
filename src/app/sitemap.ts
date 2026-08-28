import type { MetadataRoute } from "next";
import { publicEnv } from "@/lib/env";
import { getHotels, getRaftingByDistance, getAdventures } from "@/lib/content";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = publicEnv.NEXT_PUBLIC_SITE_URL;
  const [rafting, bungee, hotels] = await Promise.all([
    getRaftingByDistance(),
    getAdventures("bungee"),
    getHotels(),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/rafting`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/hotels`, changeFrequency: "weekly", priority: 0.8 },
  ];

  const raftingRoutes: MetadataRoute.Sitemap = rafting.map((a) => ({
    url: `${base}/rafting/${a.slug}`,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const bungeeRoutes: MetadataRoute.Sitemap = bungee.map((a) => ({
    url: `${base}/bungee/${a.slug}`,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const hotelRoutes: MetadataRoute.Sitemap = hotels.map((h) => ({
    url: `${base}/hotels/${h.slug}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...raftingRoutes, ...bungeeRoutes, ...hotelRoutes];
}
