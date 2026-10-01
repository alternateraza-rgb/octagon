import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getSession } from "@/lib/auth/server";
import { checkLimit } from "@/lib/billing/entitlements";
import { businessDetails } from "@/lib/agents/find";
import { providerFailure } from "@/lib/agents/http";
import { renderBlocks } from "@/lib/agents/inject";
import { leadPrompt } from "@/lib/agents/prompt";
import { getLead, holdBlocks, linkSite, refreshLead } from "@/lib/agents/store";
import { createSite, getSite } from "@/lib/sites/store";

// Starts a normal site from a business: the builder then streams it like any other first build, and
// the business's real reviews and contact details are dropped in when it's saved.
export async function POST(_request: Request, { params }: RouteContext<"/api/agents/leads/[id]/build">) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Log in to build a website." }, { status: 401 });
  const { id } = await params;
  const { env } = await getCloudflareContext({ async: true });
  const lead = await getLead(env.DB, id, session.user.id);
  if (!lead) return Response.json({ error: "Business not found." }, { status: 404 });
  if (lead.siteId && (await getSite(env.DB, lead.siteId, session.user.id))) {
    return Response.json({ id: lead.siteId, existing: true });
  }

  const refused = await checkLimit(env, session.user, "builds");
  if (refused) return refused;
  let found;
  try {
    found = await businessDetails(env, session.user.id, lead.placeId);
  } catch (error) {
    return providerFailure(error);
  }
  if (!found) return Response.json({ error: "This business's details have expired. Find it again with a new search." }, { status: 404 });
  await refreshLead(env.DB, session.user.id, found.details);

  const siteId = await createSite(env.DB, session.user.id, leadPrompt(found.details, lead));
  await Promise.all([
    holdBlocks(env, siteId, renderBlocks(found.details, lead.socialUrl)),
    linkSite(env.DB, id, session.user.id, siteId),
  ]);
  return Response.json({ id: siteId });
}
