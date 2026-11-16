import { useEffect } from "react";
import { isRouteErrorResponse, Outlet, ScrollRestoration, useLocation, useNavigate, useRouteError } from "react-router-dom";
import { RouteMeta } from "@/components/seo";

/** The app's outermost route: head tags, scroll restoration and same-page #hash scrolling. */
export default function Root() {
  const { hash, pathname } = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    if (!hash) return;
    document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView();
  }, [hash, pathname]);

  // Many components (LinkButton, cards, footer lists) render plain <a href="/…">, as they did under
  // Next.js. Route those through the router so moving around the site never reloads the whole app.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname.startsWith("/api/")) return;
      if (/\.(xml|txt|png|jpe?g|webp|pdf|ico)$/i.test(url.pathname)) return;
      e.preventDefault();
      navigate(url.pathname + url.search + url.hash);
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [navigate]);

  return (
    <>
      <RouteMeta />
      <ScrollRestoration />
      <Outlet />
    </>
  );
}

/** A loader or render threw a 404 (`notFound()`), or the error came from a Response with that status. */
export function isNotFound(error: unknown): boolean {
  return (
    (isRouteErrorResponse(error) && error.status === 404) || (error instanceof Response && error.status === 404)
  );
}

/**
 * Adapts React Router's error element to the original Next.js `error.tsx` / `not-found.tsx` pair:
 * a 404 shows the not-found screen, anything else the error screen with a working "try again".
 */
export function routeError(
  NotFound: () => React.ReactNode,
  ErrorScreen: (props: { error: Error; reset: () => void }) => React.ReactNode,
) {
  return function RouteErrorBoundary() {
    const error = useRouteError();
    const navigate = useNavigate();
    if (isNotFound(error)) return <NotFound />;
    const err = error instanceof Error ? error : new Error(isRouteErrorResponse(error) ? error.statusText : String(error));
    return <ErrorScreen error={err} reset={() => navigate(0)} />;
  };
}
