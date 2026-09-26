import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getSession } from "@/lib/auth/server";
import { getSite } from "@/lib/sites/store";

// Generated HTML is untrusted: serve it sandboxed so its scripts run in an opaque
// origin with no access to Octacore cookies or pages.
export async function GET(_request: Request, { params }: RouteContext<"/sites/[id]/preview">) {
  const session = await getSession();
  if (!session) return new Response("Not found", { status: 404 });
  const { id } = await params;
  const { env } = await getCloudflareContext({ async: true });
  const site = await getSite(env.DB, id, session.user.id);
  if (!site?.html) return new Response("Not found", { status: 404 });

  return new Response(site.html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "content-security-policy": "sandbox allow-scripts allow-popups allow-forms; frame-ancestors 'self'",
      "cache-control": "private, no-store",
    },
  });
}
