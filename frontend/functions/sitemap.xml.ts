import { forward, type Env } from "./_api";

/** /sitemap.xml, built by the API from what is published now, with this site's own address. */
export const onRequestGet = ({ request, env }: { request: Request; env: Env }) => {
  const origin = new URL(request.url).origin;
  return forward(request, env, `/api/sitemap.xml?base=${encodeURIComponent(origin)}`);
};
