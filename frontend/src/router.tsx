import type { ComponentType } from "react";
import { createBrowserRouter, type LoaderFunction } from "react-router-dom";
import Root, { routeError } from "./app/root";
import RootNotFound from "./app/not-found";
import SiteLayout, { loader as siteLoader } from "./app/(site)/layout";
import SiteError from "./app/(site)/error";
import SiteNotFound from "./app/(site)/not-found";
import AdminLayout, { loader as adminLoader } from "./app/admin/(dashboard)/layout";
import AdminError from "./app/admin/(dashboard)/error";
import AdminNotFound from "./app/admin/(dashboard)/not-found";

/**
 * Every URL the site answers, mirroring the original Next.js app/ folder (one file per page, same
 * paths). Pages load on demand: each is its own chunk with its own loader (data) and metadata.
 */
type PageModule = { default: ComponentType; loader?: LoaderFunction };
const page = (load: () => Promise<PageModule>) => async () => {
  const m = await load();
  return { Component: m.default, loader: m.loader };
};

const notFoundMeta = () => ({ metadata: { title: "Page not found", robots: { index: false, follow: false } } });

export const router = createBrowserRouter([
  {
    Component: Root,
    errorElement: <RootNotFound />,
    children: [
      {
        path: "/",
        Component: SiteLayout,
        loader: siteLoader,
        errorElement: <RootNotFound />,
        children: [
          {
            ErrorBoundary: routeError(SiteNotFound, SiteError),
            children: [
              { index: true, lazy: page(() => import("./app/(site)/page")) },
              { path: "about", lazy: page(() => import("./app/(site)/about/page")) },
              { path: "adventures", lazy: page(() => import("./app/(site)/adventures/page")) },
              { path: "adventures/:slug", lazy: page(() => import("./app/(site)/adventures/[slug]/page")) },
              { path: "bungee/:slug", lazy: page(() => import("./app/(site)/bungee/[slug]/page")) },
              { path: "contact", lazy: page(() => import("./app/(site)/contact/page")) },
              { path: "gallery", lazy: page(() => import("./app/(site)/gallery/page")) },
              { path: "hotels", lazy: page(() => import("./app/(site)/hotels/page")) },
              { path: "hotels/:slug", lazy: page(() => import("./app/(site)/hotels/[slug]/page")) },
              { path: "packages", lazy: page(() => import("./app/(site)/packages/page")) },
              { path: "packages/:slug", lazy: page(() => import("./app/(site)/packages/[slug]/page")) },
              { path: "privacy-policy", lazy: page(() => import("./app/(site)/privacy-policy/page")) },
              { path: "rafting", lazy: page(() => import("./app/(site)/rafting/page")) },
              { path: "rafting/:slug", lazy: page(() => import("./app/(site)/rafting/[slug]/page")) },
              { path: "refund-policy", lazy: page(() => import("./app/(site)/refund-policy/page")) },
              { path: "rentals", lazy: page(() => import("./app/(site)/rentals/page")) },
              { path: "rentals/:slug", lazy: page(() => import("./app/(site)/rentals/[slug]/page")) },
              { path: "stays", lazy: page(() => import("./app/(site)/stays/page")) },
              { path: "stays/:slug", lazy: page(() => import("./app/(site)/stays/[slug]/page")) },
              { path: "*", Component: SiteNotFound, loader: notFoundMeta },
            ],
          },
        ],
      },
      { path: "/admin/login", lazy: page(() => import("./app/admin/login/page")) },
      {
        path: "/admin",
        Component: AdminLayout,
        loader: adminLoader,
        children: [
          {
            ErrorBoundary: routeError(AdminNotFound, AdminError),
            children: [
              { index: true, lazy: page(() => import("./app/admin/(dashboard)/page")) },
              { path: "activity", lazy: page(() => import("./app/admin/(dashboard)/activity/page")) },
              { path: "adventures", lazy: page(() => import("./app/admin/(dashboard)/adventures/page")) },
              { path: "adventures/:id/edit", lazy: page(() => import("./app/admin/(dashboard)/adventures/[id]/edit/page")) },
              { path: "adventures/new", lazy: page(() => import("./app/admin/(dashboard)/adventures/new/page")) },
              { path: "bookings", lazy: page(() => import("./app/admin/(dashboard)/bookings/page")) },
              { path: "bungee", lazy: page(() => import("./app/admin/(dashboard)/bungee/page")) },
              { path: "bungee/:id/edit", lazy: page(() => import("./app/admin/(dashboard)/bungee/[id]/edit/page")) },
              { path: "bungee/new", lazy: page(() => import("./app/admin/(dashboard)/bungee/new/page")) },
              { path: "closures", lazy: page(() => import("./app/admin/(dashboard)/closures/page")) },
              { path: "destinations", lazy: page(() => import("./app/admin/(dashboard)/destinations/page")) },
              { path: "destinations/:id/edit", lazy: page(() => import("./app/admin/(dashboard)/destinations/[id]/edit/page")) },
              { path: "destinations/new", lazy: page(() => import("./app/admin/(dashboard)/destinations/new/page")) },
              { path: "gallery", lazy: page(() => import("./app/admin/(dashboard)/gallery/page")) },
              { path: "hotels", lazy: page(() => import("./app/admin/(dashboard)/hotels/page")) },
              { path: "hotels/:id/edit", lazy: page(() => import("./app/admin/(dashboard)/hotels/[id]/edit/page")) },
              { path: "hotels/new", lazy: page(() => import("./app/admin/(dashboard)/hotels/new/page")) },
              { path: "media", lazy: page(() => import("./app/admin/(dashboard)/media/page")) },
              { path: "packages", lazy: page(() => import("./app/admin/(dashboard)/packages/page")) },
              { path: "packages/:id/edit", lazy: page(() => import("./app/admin/(dashboard)/packages/[id]/edit/page")) },
              { path: "packages/new", lazy: page(() => import("./app/admin/(dashboard)/packages/new/page")) },
              { path: "promotions", lazy: page(() => import("./app/admin/(dashboard)/promotions/page")) },
              { path: "promotions/:id/edit", lazy: page(() => import("./app/admin/(dashboard)/promotions/[id]/edit/page")) },
              { path: "promotions/new", lazy: page(() => import("./app/admin/(dashboard)/promotions/new/page")) },
              { path: "rafting", lazy: page(() => import("./app/admin/(dashboard)/rafting/page")) },
              { path: "rafting/:id/edit", lazy: page(() => import("./app/admin/(dashboard)/rafting/[id]/edit/page")) },
              { path: "rafting/new", lazy: page(() => import("./app/admin/(dashboard)/rafting/new/page")) },
              { path: "rentals", lazy: page(() => import("./app/admin/(dashboard)/rentals/page")) },
              { path: "rentals/:id/edit", lazy: page(() => import("./app/admin/(dashboard)/rentals/[id]/edit/page")) },
              { path: "rentals/new", lazy: page(() => import("./app/admin/(dashboard)/rentals/new/page")) },
              { path: "reviews", lazy: page(() => import("./app/admin/(dashboard)/reviews/page")) },
              { path: "settings", lazy: page(() => import("./app/admin/(dashboard)/settings/page")) },
              { path: "*", Component: AdminNotFound, loader: notFoundMeta },
            ],
          },
        ],
      },
      { path: "/styleguide", lazy: page(() => import("./app/styleguide/page")) },
    ],
  },
]);
