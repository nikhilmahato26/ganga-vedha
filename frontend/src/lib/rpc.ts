import { ApiError, apiPost } from "./api";

/**
 * Calls one admin function on the API (backend/src/routes/admin-rpc.ts). The session cookie rides
 * along; a 401 means it expired or the password changed elsewhere, so we go back to the login
 * screen and return here afterwards.
 */
export async function rpc<T>(name: string, args: unknown[]): Promise<T> {
  try {
    const { result } = await apiPost<{ result: T }>(`/api/admin/rpc/${name}`, { args });
    return result;
  } catch (err) {
    if (err instanceof ApiError && err.status === 401 && typeof window !== "undefined") {
      const from = window.location.pathname + window.location.search;
      window.location.assign(`/admin/login?from=${encodeURIComponent(from)}`);
    }
    throw err;
  }
}
