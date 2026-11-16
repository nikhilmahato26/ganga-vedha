import { forward, type Env } from "../_api";

/**
 * Reverse proxy: the website answers /api/* itself and forwards it to the API Worker unchanged
 * (method, headers incl. the login cookie, body). The browser only ever talks to the site's own
 * address, so the admin cookie is first-party in every browser, Safari included (ARCHITECTURE §02).
 */
export const onRequest = ({ request, env }: { request: Request; env: Env }) => {
  const url = new URL(request.url);
  return forward(request, env, url.pathname + url.search);
};
