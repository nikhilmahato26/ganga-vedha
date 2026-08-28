import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getVerifiedSession } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Admin login",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  // Must agree with the dashboard layout's check, or a session that is
  // signature-valid but stale (password changed, account gone) bounces
  // forever: login sees it as "logged in" and sends it to /admin, the
  // layout sees it as invalid and sends it right back.
  const session = await getVerifiedSession();
  if (session) redirect("/admin");
  const { from } = await searchParams;

  return (
    <main className="grid min-h-dvh place-items-center bg-canvas-sunk px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p
            className="text-title text-ink"
            style={{ fontVariationSettings: '"wdth" 112' }}
          >
            Ganga Vedha
          </p>
          <p className="mt-1 text-small text-ink-muted">Admin panel</p>
        </div>
        <LoginForm from={from} />
      </div>
    </main>
  );
}
