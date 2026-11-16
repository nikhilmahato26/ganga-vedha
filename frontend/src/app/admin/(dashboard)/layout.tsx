import { Outlet, useLoaderData, type LoaderFunctionArgs } from "react-router-dom";
import { AdminShell } from "@/components/admin/shell";
import { getSessionAdmin } from "@/lib/actions/auth";
import { redirect } from "@/lib/navigation";

/**
 * Every admin screen sits under this route. The loader asks the API who is signed in; with no valid
 * session (expired, password changed elsewhere, account gone) it sends the browser to the login
 * page and back here afterwards. This is UX only: every admin API call checks the cookie itself
 * (ARCHITECTURE.md §03).
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSessionAdmin();
  if (!session) {
    const url = new URL(request.url);
    redirect(`/admin/login?from=${encodeURIComponent(url.pathname + url.search)}`);
  }
  return { session };
}

export default function DashboardLayout() {
  const { session } = useLoaderData<typeof loader>();
  return (
    <AdminShell session={session}>
      <Outlet />
    </AdminShell>
  );
}
