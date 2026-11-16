import type { Metadata } from "@/components/seo";
import { redirect } from "@/lib/navigation";
import { getSessionAdmin } from "@/lib/actions/auth";
import { BrandLogo } from "@/components/brand-logo";
import { LoginForm } from "./login-form";
import { useLoaderData, type LoaderFunctionArgs } from "react-router-dom";

const metadata: Metadata = {
  title: "Admin login",
  robots: { index: false, follow: false },
};

export async function loader({ request }: LoaderFunctionArgs) {
  const searchParams = Promise.resolve(Object.fromEntries(new URL(request.url).searchParams) as Record<string, string | undefined>);
  // Must agree with the dashboard layout's check, or a session that is
  // signature-valid but stale (password changed, account gone) bounces
  // forever: login sees it as "logged in" and sends it to /admin, the
  // layout sees it as invalid and sends it right back.
  const session = await getSessionAdmin();
  if (session) redirect("/admin");
  const { from } = await searchParams;
  return { from, metadata };
}

export default function LoginPage() {
  const { from } = useLoaderData<typeof loader>();
  return (
    <main className="grid min-h-dvh place-items-center bg-canvas-sunk px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <BrandLogo size="xl" alt="Ganga Veda" priority className="mx-auto mb-4" />
          <p
            className="text-title text-ink"
            style={{ fontVariationSettings: '"wdth" 112' }}
          >
            Ganga Veda
          </p>
          <p className="mt-1 text-small text-ink-muted">Admin panel</p>
        </div>
        <LoginForm from={from} />
      </div>
    </main>
  );
}
