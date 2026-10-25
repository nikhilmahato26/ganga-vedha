import type { Metadata } from "next";
import { getHeroRoomsAdmin, listHotelsAdmin } from "@/lib/admin-data";
import { Card, CardBody } from "@/components/ui";
import { HotelList } from "@/components/admin/hotel-list";
import { HeroRoomsEditor } from "@/components/admin/hero-rooms-editor";

export const metadata: Metadata = { title: "Hotels", robots: { index: false, follow: false } };

export default async function HotelsAdminPage() {
  const [items, heroRooms] = await Promise.all([listHotelsAdmin(), getHeroRoomsAdmin()]);
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-display-md text-ink">Hotels</h1>
      <p className="mt-2 text-ink-muted">
        The room rates on the homepage, then the camps and guesthouses listed under Stays.
      </p>

      <Card elevation="flat" className="mt-8">
        <CardBody className="p-6">
          <h2 className="text-subtitle text-ink">Rooms on the homepage</h2>
          <div className="mt-4">
            <HeroRoomsEditor items={heroRooms} />
          </div>
        </CardBody>
      </Card>

      <h2 className="mt-10 text-subtitle text-ink">Hotel listings</h2>
      <p className="mt-1.5 text-small text-ink-muted">Each one can have several room types.</p>
      <div className="mt-4">
        <HotelList items={items} />
      </div>
    </div>
  );
}
