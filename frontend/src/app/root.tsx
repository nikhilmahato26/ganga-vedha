import { useEffect } from "react";
import { isRouteErrorResponse, Outlet, ScrollRestoration, useLocation, useNavigate, useRouteError } from "react-router-dom";
import { RouteMeta } from "@/components/seo";

/** The app's outermost route: head tags, scroll restoration and same-page #hash scrolling. */
export default function Root() {
  const { hash, pathname } = useLocation();
  useEffect(() => {
    if (!hash) return;
    document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView();
  }, [hash, pathname]);

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
