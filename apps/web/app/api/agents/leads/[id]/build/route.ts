import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getSession } from "@/lib/auth/server";
import { checkLimit } from "@/lib/billing/entitlements";
import { renderBlocks } from "@/lib/agents/inject";
import { PlacesError, getPlaceDetails } from "@/lib/agents/places";
import { leadPrompt } from "@/lib/agents/prompt";
import { getLead, holdBlocks, linkSite, refreshLead } from "@/lib/agents/store";
import { createSite, getSite } from "@/lib/sites/store";

// Starts a normal site from a lead: the builder then streams it like any other first build, and the
// lead's real reviews and contact details are dropped in when it's saved.
export async function POST(_request: Request, { params }: RouteContext<"/api/agents/leads/[id]/build">) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Log in to build a website." }, { status: 401 });
  const { id } = await params;
  const { env } = await getCloudflareContext({ async: true });
  const lead = await getLead(env.DB, id, session.user.id);
  if (!lead) return Response.json({ error: "Lead not found." }, { status: 404 });
  if (lead.siteId && (await getSite(env.DB, lead.siteId, session.user.id))) {
    return Response.json({ id: lead.siteId, existing: true });
  }

  const refused = await checkLimit(env, session.user, "builds");
  if (refused) return refused;
  let details;
  try {
    details = await getPlaceDetails(env, lead.placeId);
  } catch (error) {
    if (error instanceof PlacesError) return Response.json({ error: error.message }, { status: error.status });
    throw error;
  }
  await refreshLead(env.DB, session.user.id, details);

  const siteId = await createSite(env.DB, session.user.id, leadPrompt(details, lead));
  await Promise.all([holdBlocks(env, siteId, renderBlocks(details, lead.socialUrl)), linkSite(env.DB, id, session.user.id, siteId)]);
  return Response.json({ id: siteId });
}
