/** robots.txt with an absolute sitemap URL for whichever address the site is served on. */
export const onRequestGet = ({ request }: { request: Request }) => {
  const origin = new URL(request.url).origin;
  const body = `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /admin/\n\nSitemap: ${origin}/sitemap.xml\n`;
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" } });
};
