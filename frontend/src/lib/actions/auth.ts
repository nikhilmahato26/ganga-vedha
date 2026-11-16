import { ApiError, apiGet, apiPost } from "../api";

/**
 * Owner login, logout and password change (backend/src/routes/admin-auth.ts). Same signatures as
 * the original server actions, so the forms keep using `useActionState`.
 */

export type LoginState = { error?: string } | undefined;
export type ChangePasswordState = { error?: string; success?: boolean } | undefined;
export type SessionAdmin = { id: number; name: string; email: string };

const message = (err: unknown) => (err instanceof Error ? err.message : "Something went wrong. Please try again.");

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email) return { error: "Enter your email." };
  if (!password) return { error: "Enter your password." };
  try {
    await apiPost("/api/admin/login", { email, password });
  } catch (err) {
    return { error: message(err) };
  }
  // Prove the cookie stuck before leaving the page; otherwise say so instead of looping (§03).
  if (!(await getSessionAdmin())) {
    return {
      error:
        "Your password was right, but this browser didn't keep the login cookie. Allow cookies for this site and try again.",
    };
  }
  const from = String(formData.get("from") ?? "");
  window.location.assign(from.startsWith("/admin") ? from : "/admin");
  return undefined;
}

export async function logoutAction(): Promise<void> {
  await apiPost("/api/admin/logout").catch(() => {});
  window.location.assign("/admin/login");
}

export async function changePasswordAction(
  _prev: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  try {
    await apiPost("/api/admin/password", {
      currentPassword: String(formData.get("currentPassword") ?? ""),
      newPassword: String(formData.get("newPassword") ?? ""),
      confirmPassword: String(formData.get("confirmPassword") ?? ""),
    });
    return { success: true };
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) window.location.assign("/admin/login");
    return { error: message(err) };
  }
}

/** The signed-in owner, or null. Used by the admin route guard (UX only; the API checks itself). */
export async function getSessionAdmin(): Promise<SessionAdmin | null> {
  try {
    const { admin } = await apiGet<{ admin: SessionAdmin }>("/api/admin/me");
    return admin;
  } catch {
    return null;
  }
}
