import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getSession } from "@/lib/auth/server";
import { addDomain, customDomainRefusal, listDomains, normalizeHostname, refreshDomain, toView } from "@/lib/domains/store";
import { getSite } from "@/lib/sites/store";

// A site's custom domains. Pending ones are re-checked with Cloudflare on every read, so the
// dashboard can poll this while DNS and the certificate come through.
export async function GET(_request: Request, { params }: RouteContext<"/api/sites/[id]/domains">) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Log in first." }, { status: 401 });
  const { id } = await params;
  const { env } = await getCloudflareContext({ async: true });
  const site = await getSite(env.DB, id, session.user.id);
  if (!site) return Response.json({ error: "Site not found." }, { status: 404 });
  const domains = await Promise.all(
    (await listDomains(env.DB, id)).map((d) => (d.status === "pending" ? refreshDomain(env, d) : d)),
  );
  return Response.json({ domains: domains.map((d) => toView(env, d)) });
}

// Connects a domain the builder owns.
export async function POST(request: Request, { params }: RouteContext<"/api/sites/[id]/domains">) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Log in first." }, { status: 401 });
  const { id } = await params;
  const { hostname: input } = (await request.json().catch(() => ({}))) as { hostname?: unknown };
  const { env } = await getCloudflareContext({ async: true });
  const normalized = normalizeHostname(typeof input === "string" ? input : "", env.SITES_DOMAIN);
  if ("error" in normalized) return Response.json({ error: normalized.error }, { status: 400 });

  const site = await getSite(env.DB, id, session.user.id);
  if (!site) return Response.json({ error: "Site not found." }, { status: 404 });
  if (!site.slug || !site.deployedVersionId) return Response.json({ error: "Deploy the site first." }, { status: 400 });
  const refused = await customDomainRefusal(env, session.user, id);
  if (refused) return refused;

  const added = await addDomain(env, id, normalized.hostname);
  if ("error" in added) return Response.json({ error: added.error }, { status: added.status });
  return Response.json({ domain: toView(env, added.domain) }, { status: 201 });
}
