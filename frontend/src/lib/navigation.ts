import { useMemo } from "react";
import { redirect as routerRedirect, useLocation, useNavigate, useRevalidator } from "react-router-dom";

/**
 * The few next/navigation APIs the app used, on React Router. `refresh()` re-runs the current
 * route's loaders, which is what router.refresh() did for server components.
 */
export function useRouter() {
  const navigate = useNavigate();
  const { revalidate } = useRevalidator();
  return useMemo(
    () => ({
      push: (href: string) => navigate(href),
      replace: (href: string) => navigate(href, { replace: true }),
      back: () => navigate(-1),
      refresh: () => void revalidate(),
    }),
    [navigate, revalidate],
  );
}

export function usePathname(): string {
  return useLocation().pathname;
}

/** Throw from a loader (or a render) to show the not-found page with a 404. */
export function notFound(): never {
  throw new Response("Not found", { status: 404, statusText: "Not Found" });
}

/** Throw from a loader to send the visitor elsewhere. */
export function redirect(to: string): never {
  throw routerRedirect(to);
}
