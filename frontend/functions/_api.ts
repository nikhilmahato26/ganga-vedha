/**
 * Shared by the Pages Functions: how the website reaches the API Worker inside Cloudflare.
 * Preferred: the `API` service binding (frontend/wrangler.jsonc), a direct Worker-to-Worker call with
 * no public URL involved. Fallback: a Pages variable API_ORIGIN with the Worker's URL.
 */
export type Env = { API?: { fetch: (request: Request) => Promise<Response> }; API_ORIGIN?: string };

export function forward(request: Request, env: Env, path: string): Promise<Response> {
  const url = new URL(request.url);
  const headers = new Headers(request.headers);
  // Through a URL fetch the Worker would see this function's address for every visitor and
  // rate-limit them all as one (backend/src/lib/http.ts clientIp).
  headers.set("x-gv-client-ip", request.headers.get("cf-connecting-ip") ?? "");
  const init: RequestInit = { method: request.method, headers, body: request.body, redirect: "manual" };
  if (env.API) return env.API.fetch(new Request(new URL(path, url.origin), init));
  if (!env.API_ORIGIN) {
    return Promise.resolve(
      Response.json({ ok: false, error: "The site isn't connected to its API yet (no API binding or API_ORIGIN)." }, { status: 503 }),
    );
  }
  return fetch(new Request(new URL(path, env.API_ORIGIN), init));
}
