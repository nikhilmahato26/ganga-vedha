"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BedDouble,
  CloudRain,
  History,
  Image as ImageIcon,
  Images,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Mountain,
  Settings,
  Star,
  Waves,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ToastProvider } from "@/components/ui";
import type { SessionPayload } from "@/lib/auth";
import { logoutAction } from "@/app/actions/auth";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/bookings", label: "Bookings", icon: MessageSquare },
  { href: "/admin/closures", label: "Closures", icon: CloudRain },
  { href: "/admin/rafting", label: "Rafting", icon: Waves },
  { href: "/admin/bungee", label: "Bungee", icon: Mountain },
  { href: "/admin/hotels", label: "Hotels", icon: BedDouble },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/gallery", label: "Gallery", icon: Images },
  { href: "/admin/media", label: "Media", icon: ImageIcon },
  { href: "/admin/activity", label: "Activity", icon: History },
  { href: "/admin/settings", label: "Settings", icon: Settings },
] as const;

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-0.5 p-3" aria-label="Admin">
      {NAV.map((item) => {
        const active = "exact" in item && item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-11 items-center gap-3 rounded-md px-3 text-small font-semibold no-underline transition-colors",
              active
                ? "bg-jade-100 text-jade-800"
                : "text-ink-muted hover:bg-granite-100 hover:text-ink",
            )}
          >
            <item.icon className="size-[1.125rem] shrink-0" aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminShell({
  session,
  children,
}: {
  session: SessionPayload;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  return (
    <ToastProvider>
    <div className="min-h-dvh bg-canvas-sunk lg:flex">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 border-r border-hairline bg-canvas lg:flex lg:flex-col">
        <div className="flex h-16 items-center border-b border-hairline px-5">
          <span
            className="text-subtitle text-ink"
            style={{ fontVariationSettings: '"wdth" 112' }}
          >
            Ganga Vedha
          </span>
        </div>
        <div className="flex-1 overflow-y-auto">
          <NavLinks pathname={pathname} />
        </div>
        <div className="border-t border-hairline p-3">
          <p className="truncate px-3 text-caption text-ink-faint">{session.email}</p>
          <form action={logoutAction}>
            <button
              type="submit"
              className="mt-1 flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-small font-semibold text-ink-muted transition-colors hover:bg-granite-100 hover:text-ink"
            >
              <LogOut className="size-[1.125rem] shrink-0" aria-hidden />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-(--z-overlay) lg:hidden">
          <div
            className="absolute inset-0 bg-granite-950/55"
            onClick={() => setDrawerOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-y-0 left-0 flex w-[min(17rem,85vw)] flex-col bg-canvas shadow-xl">
            <div className="flex h-16 items-center justify-between border-b border-hairline px-5">
              <span className="text-subtitle text-ink">Menu</span>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="grid size-11 place-items-center rounded-md text-ink-faint"
              >
                <X className="size-5" aria-hidden />
                <span className="sr-only">Close menu</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <NavLinks pathname={pathname} onNavigate={() => setDrawerOpen(false)} />
            </div>
            <div className="border-t border-hairline p-3 pb-safe">
              <p className="truncate px-3 text-caption text-ink-faint">{session.email}</p>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="mt-1 flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-small font-semibold text-ink-muted"
                >
                  <LogOut className="size-[1.125rem] shrink-0" aria-hidden />
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center gap-3 border-b border-hairline bg-canvas px-4 lg:hidden">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="grid size-11 place-items-center rounded-md text-ink"
          >
            <Menu className="size-6" aria-hidden />
            <span className="sr-only">Open menu</span>
          </button>
          <span
            className="text-subtitle text-ink"
            style={{ fontVariationSettings: '"wdth" 112' }}
          >
            Ganga Vedha
          </span>
        </header>
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
    </ToastProvider>
  );
}
