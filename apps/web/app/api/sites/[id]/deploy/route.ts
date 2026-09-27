import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getSession } from "@/lib/auth/server";
import { deployVersion, siteUrl } from "@/lib/deploy/sites";
import { getSite, getVersionHtml } from "@/lib/sites/store";
import { checkLimit } from "@/lib/billing/entitlements";

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
  // Deploying needs an active plan; a site that isn't live yet also takes one of the plan's live
  // sites, unless its client pays for its hosting.
  const live = await env.DB.prepare(
    `select 1 from site s where s.id = ? and ((s.deployedVersionId is not null and s.pausedAt is null)
       or exists (select 1 from sale where sale.id = s.saleId and sale.hostingStatus = 'active'))`,
  )
    .bind(id)
    .first();
  const refused = await checkLimit(env, session.user, "sites", live ? 0 : 1);
  if (refused) return refused;

  const slug = await deployVersion(env, site, target, html);
  if (!slug) return Response.json({ error: "Couldn't reserve an address. Try again." }, { status: 409 });
  return Response.json({ url: siteUrl(env, slug), slug, versionId: target });
}
