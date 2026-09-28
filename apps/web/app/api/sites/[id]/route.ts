import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getSession } from "@/lib/auth/server";
import { unpublish } from "@/lib/deploy/sites";
import { removeSiteDomains } from "@/lib/domains/store";
import { deleteSite, getSite } from "@/lib/sites/store";

export async function DELETE(_request: Request, { params }: RouteContext<"/api/sites/[id]">) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Log in first." }, { status: 401 });
  const { id } = await params;
  const { env } = await getCloudflareContext({ async: true });
  const site = await getSite(env.DB, id, session.user.id);
  if (!site) return Response.json({ error: "Site not found." }, { status: 404 });
  await removeSiteDomains(env, id);
  if (site.slug) await unpublish(env, site.slug);
  await deleteSite(env.DB, id);
  return new Response(null, { status: 204 });
}

export async function PATCH(request: Request, { params }: RouteContext<"/api/sites/[id]">) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Log in first." }, { status: 401 });
  const { id } = await params;
  const { title } = (await request.json().catch(() => ({}))) as { title?: unknown };
  const value = typeof title === "string" ? title.replace(/\s+/g, " ").trim().slice(0, 80) : "";
  if (!value) return Response.json({ error: "Give the site a name." }, { status: 400 });
  const { env } = await getCloudflareContext({ async: true });
  await env.DB.prepare(`update site set title = ?, updatedAt = ? where id = ? and userId = ?`).bind(value, Date.now(), id, session.user.id).run();
  return Response.json({ title: value });
}
