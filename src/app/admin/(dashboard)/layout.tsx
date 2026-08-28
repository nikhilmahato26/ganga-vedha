import { redirect } from "next/navigation";
import { getVerifiedSession } from "@/lib/auth";
import { AdminShell } from "@/components/admin/shell";

/**
 * Middleware already redirects an unauthenticated request before it reaches
 * here, but only on signature and expiry — it cannot see the database, so it
 * cannot catch an account that was deleted, or a token issued before the
 * password last changed. `getVerifiedSession()` checks both, and this layout
 * is where that check actually runs on every admin page.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getVerifiedSession();
  if (!session) redirect("/admin/login");

  return <AdminShell session={session}>{children}</AdminShell>;
}
