import type { Metadata } from "@/components/seo";
import { ImageIcon } from "lucide-react";
import { Breadcrumb, EmptyState, SectionHeading } from "@/components/ui";
import { GalleryAlbums } from "@/components/site/gallery-albums";
import { getGalleryItems } from "@/lib/content";
import { useLoaderData } from "react-router-dom";

const metadata: Metadata = {
  title: "Photo gallery",
  description:
    "Rafting, bungee, the mountains, our resorts, Rishikesh and the Ganga, Manali and Shimla — original photographs from the trips we run.",
  alternates: { canonical: "/gallery" },
};

export async function loader() {
  const items = await getGalleryItems();
  return { items, metadata };
}

export default function GalleryPage() {
  const { items } = useLoaderData<typeof loader>();
  return (
    <div className="container-page pt-6 pb-12">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Gallery" }]} />

      <div className="pt-8">
        <SectionHeading
          as="h1"
          title="Gallery"
          description="What the river, the platforms, the mountains and the stays actually look like — grouped by album."
        />
      </div>

      <div className="mt-10">
        {items.length === 0 ? (
          <EmptyState
            icon={<ImageIcon />}
            title="No photos yet"
            description="Photos uploaded from the admin panel appear here, grouped by the album they are tagged with."
          />
        ) : (
          <GalleryAlbums items={items} />
        )}
      </div>
    </div>
  );
}
