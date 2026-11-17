/**
 * One address for the site: gangaveda.in → https://www.gangaveda.in, same path and query. www is
 * the address on the Google Business listing, so links, cookies and search results all agree.
 */
const CANONICAL_HOST = "www.gangaveda.in";

export const onRequest = async ({ request, next }: { request: Request; next: () => Promise<Response> }) => {
  const url = new URL(request.url);
  if (url.hostname === "gangaveda.in") {
    url.hostname = CANONICAL_HOST;
    url.protocol = "https:";
    return Response.redirect(url.toString(), 301);
  }
  return next();
};
