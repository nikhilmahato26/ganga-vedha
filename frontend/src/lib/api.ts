/**
 * The only reader of VITE_API_URL.
 * ""        static build: no API, content from lib/content.seed.ts, enquiries go to WhatsApp only.
 * "/"       production: same site, through the /api reverse proxy (ARCHITECTURE.md §02).
 * a URL     direct, e.g. http://localhost:8787 in local development.
 */
const base = (import.meta.env.VITE_API_URL ?? "").trim();

export const apiEnabled = base !== "";

export function apiUrl(path: string): string {
  if (base === "/") return path;
  return base.replace(/\/$/, "") + path;
}

export class ApiError extends Error {
  status: number;
  fields?: Record<string, string>;
  constructor(status: number, message: string, fields?: Record<string, string>) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(apiUrl(path), {
      method,
      credentials: "include",
      headers: body === undefined ? undefined : { "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, "Can't reach the server. Check your connection and try again.");
  }
  const data = (await res.json().catch(() => ({}))) as T & {
    error?: string;
    fields?: Record<string, string>;
  };
  if (!res.ok) throw new ApiError(res.status, data.error || `Request failed (${res.status})`, data.fields);
  return data;
}

export const apiGet = <T>(path: string) => request<T>("GET", path);
export const apiPost = <T>(path: string, body: unknown = {}) => request<T>("POST", path, body);
