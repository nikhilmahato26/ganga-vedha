"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { changePassword, createSession, destroySession, getVerifiedSession, signIn } from "@/lib/auth";

const loginSchema = z.object({
  email: z.string().trim().min(1, "Enter your email."),
  password: z.string().min(1, "Enter your password."),
});

export type LoginState = { error?: string } | undefined;

export async function loginAction(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }

  const result = await signIn(parsed.data.email, parsed.data.password);
  if (!result.ok) return { error: result.error };

  const from = formData.get("from");
  redirect(typeof from === "string" && from.startsWith("/admin") ? from : "/admin");
}

export async function logoutAction() {
  await destroySession();
  redirect("/admin/login");
}

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    newPassword: z.string().min(12, "New password must be at least 12 characters."),
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: "New passwords don't match.",
    path: ["confirmPassword"],
  });

export type ChangePasswordState = { error?: string; success?: boolean } | undefined;

export async function changePasswordAction(
  _prevState: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  const session = await getVerifiedSession();
  if (!session) redirect("/admin/login");

  const parsed = passwordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }

  const result = await changePassword(
    Number(session.sub),
    parsed.data.currentPassword,
    parsed.data.newPassword,
  );
  if (!result.ok) return { error: result.error };

  // changePassword() bumps admin_users.updatedAt, which getVerifiedSession()
  // uses as a revocation watermark — that is what logs every OTHER session
  // out, but it would also log THIS device out a moment later if its cookie
  // were not refreshed, breaking the "you'll stay signed in on this device"
  // promise on the settings screen. Reissue the session now, with a fresh
  // iat, so only sessions elsewhere are affected.
  await createSession({ id: Number(session.sub), email: session.email, name: session.name });
  return { success: true };
}
