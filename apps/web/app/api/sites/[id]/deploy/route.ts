import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getSession } from "@/lib/auth/server";
import { pickSlug, publish, siteUrl } from "@/lib/deploy/sites";
import { getSite, getVersionHtml } from "@/lib/sites/store";

// Publishes a version (the latest by default) to the site's public address. Redeploying an older
// version is how you roll back. The first deploy picks the address, e.g. pakeeza.octacore.app.
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

  // Claim the address in D1 first (its unique index settles races), then publish to it.
  let slug = site.slug;
  for (let attempt = 0; !slug && attempt < 3; attempt++) {
    const candidate = await pickSlug(env.DB, site.title);
    try {
      await env.DB.prepare(`update site set slug = ? where id = ? and slug is null`).bind(candidate, id).run();
      slug = candidate;
    } catch {
      // Someone else took it between the check and the update; pick again.
    }
  }
  if (!slug) return Response.json({ error: "Couldn't reserve an address. Try again." }, { status: 409 });

  await publish(env, slug, html);
  const now = Date.now();
  await env.DB.batch([
    env.DB.prepare(`update site set deployedVersionId = ?, updatedAt = ? where id = ?`).bind(target, now, id),
    env.DB.prepare(`insert into deployment (id, siteId, versionId, createdAt) values (?, ?, ?, ?)`).bind(crypto.randomUUID(), id, target, now),
  ]);
  return Response.json({ url: siteUrl(env, slug), slug, versionId: target });
}
