import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getSession } from "@/lib/auth/server";
import { makeSlug, publish, siteUrl } from "@/lib/deploy/sites";
import { getSite, getVersionHtml } from "@/lib/sites/store";

// Publishes a version (the latest by default) to the site's public address. Redeploying an older
// version is how you roll back.
export async function POST(request: Request, { params }: RouteContext<"/api/sites/[id]/deploy">) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Log in first." }, { status: 401 });
  const { id } = await params;
  const { versionId } = (await request.json().catch(() => ({}))) as { versionId?: unknown };

  const { env } = await getCloudflareContext({ async: true });
  const site = await getSite(env.DB, id, session.user.id);
  if (!site) return Response.json({ error: "Site not found." }, { status: 404 });
  const target = typeof versionId === "string" ? versionId : site.latestVersionId;
  const html = target && (await getVersionHtml(env.DB, target, session.user.id));
  if (!target || !html) return Response.json({ error: "Build the site before deploying it." }, { status: 400 });

  const slug = site.slug ?? makeSlug(site.title);
  await publish(env, slug, html);
  const now = Date.now();
  await env.DB.batch([
    env.DB.prepare(`update site set slug = ?, deployedVersionId = ?, updatedAt = ? where id = ?`).bind(slug, target, now, id),
    env.DB.prepare(`insert into deployment (id, siteId, versionId, createdAt) values (?, ?, ?, ?)`).bind(crypto.randomUUID(), id, target, now),
  ]);
  return Response.json({ url: siteUrl(env, slug), slug, versionId: target });
}
