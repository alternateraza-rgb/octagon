import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getSession } from "@/lib/auth/server";
import { unpublish } from "@/lib/deploy/sites";
import { deleteSite, getSite } from "@/lib/sites/store";

export async function DELETE(_request: Request, { params }: RouteContext<"/api/sites/[id]">) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Log in first." }, { status: 401 });
  const { id } = await params;
  const { env } = await getCloudflareContext({ async: true });
  const site = await getSite(env.DB, id, session.user.id);
  if (!site) return Response.json({ error: "Site not found." }, { status: 404 });
  if (site.slug) await unpublish(env, site.slug);
  await deleteSite(env.DB, id);
  return new Response(null, { status: 204 });
}
