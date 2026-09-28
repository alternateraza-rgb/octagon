import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getSession } from "@/lib/auth/server";
import { publish, siteUrl, slugProblem, slugify, unpublish } from "@/lib/deploy/sites";
import { remapDomains } from "@/lib/domains/store";
import { getSite, getVersionHtml } from "@/lib/sites/store";

// Changes a site's public address. A live site moves to the new address straight away.
export async function POST(request: Request, { params }: RouteContext<"/api/sites/[id]/address">) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Log in first." }, { status: 401 });
  const { id } = await params;
  const { slug: requested } = (await request.json().catch(() => ({}))) as { slug?: unknown };
  const slug = typeof requested === "string" ? slugify(requested) : "";
  const problem = slugProblem(slug);
  if (problem) return Response.json({ error: problem }, { status: 400 });

  const { env } = await getCloudflareContext({ async: true });
  const site = await getSite(env.DB, id, session.user.id);
  if (!site) return Response.json({ error: "Site not found." }, { status: 404 });
  if (slug === site.slug) return Response.json({ slug, url: siteUrl(env, slug) });

  try {
    await env.DB.prepare(`update site set slug = ?, updatedAt = ? where id = ?`).bind(slug, Date.now(), id).run();
  } catch {
    return Response.json({ error: `${slug}.${env.SITES_DOMAIN} is taken. Try another.` }, { status: 409 });
  }
  if (site.deployedVersionId) {
    const html = await getVersionHtml(env.DB, site.deployedVersionId, session.user.id);
    if (html) await publish(env, slug, html);
    if (site.slug) await unpublish(env, site.slug);
  }
  await remapDomains(env, id, slug);
  return Response.json({ slug, url: siteUrl(env, slug) });
}
