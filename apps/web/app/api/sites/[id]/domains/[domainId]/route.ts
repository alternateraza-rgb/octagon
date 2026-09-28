import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getSession } from "@/lib/auth/server";
import { getDomain, removeDomain } from "@/lib/domains/store";
import { getSite } from "@/lib/sites/store";

// Disconnects a custom domain: the site stops answering on it straight away.
export async function DELETE(_request: Request, { params }: RouteContext<"/api/sites/[id]/domains/[domainId]">) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Log in first." }, { status: 401 });
  const { id, domainId } = await params;
  const { env } = await getCloudflareContext({ async: true });
  const site = await getSite(env.DB, id, session.user.id);
  if (!site) return Response.json({ error: "Site not found." }, { status: 404 });
  const domain = await getDomain(env.DB, domainId, id);
  if (!domain) return Response.json({ error: "Domain not found." }, { status: 404 });
  try {
    await removeDomain(env, domain);
  } catch (error) {
    console.error("Custom domain removal failed", error);
    return Response.json({ error: "Couldn't remove the domain. Try again." }, { status: 502 });
  }
  return new Response(null, { status: 204 });
}
