import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getSession } from "@/lib/auth/server";
import { getBusiness } from "@/lib/agents/business";
import { huntContacts } from "@/lib/agents/contacts";
import { getLead } from "@/lib/agents/store";

// Looks for the email again, when an earlier hunt was interrupted or came up empty.
export async function POST(_request: Request, { params }: RouteContext<"/api/agents/leads/[id]/hunt">) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Log in first." }, { status: 401 });
  const { id } = await params;
  const { env } = await getCloudflareContext({ async: true });
  const lead = await getLead(env.DB, id, session.user.id);
  const business = lead && (await getBusiness(env.DB, lead.placeId));
  if (!lead || !business) return Response.json({ error: "Business not found." }, { status: 404 });
  // Someone hunted it recently and found nothing: searching again won't turn anything up yet.
  if (business.contactStatus === "none" && Date.now() - (business.huntedAt ?? 0) < 24 * 60 * 60 * 1000) {
    return Response.json({ lead });
  }
  await huntContacts(env, session.user.id, business);
  return Response.json({ lead: await getLead(env.DB, id, session.user.id) });
}
