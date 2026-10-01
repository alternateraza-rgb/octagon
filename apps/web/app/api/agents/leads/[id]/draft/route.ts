import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getSession } from "@/lib/auth/server";
import { checkLimit } from "@/lib/billing/entitlements";
import { getLead } from "@/lib/agents/store";
import { draftEmails } from "@/lib/outreach/draft";
import { getSettings } from "@/lib/outreach/store";

// Octa writes the emails for a business (the first one and, if on, two follow-ups). Nothing is saved
// until the user starts the sequence.
export async function POST(_request: Request, { params }: RouteContext<"/api/agents/leads/[id]/draft">) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Log in first." }, { status: 401 });
  const { id } = await params;
  const { env } = await getCloudflareContext({ async: true });
  const [lead, settings] = await Promise.all([getLead(env.DB, id, session.user.id), getSettings(env.DB, session.user.id)]);
  if (!lead) return Response.json({ error: "Business not found." }, { status: 404 });
  if (!settings) return Response.json({ error: "Set up outreach first.", setup: true }, { status: 409 });
  const refused = await checkLimit(env, session.user, "chat");
  if (refused) return refused;
  try {
    const emails = await draftEmails(env, lead, settings, settings.followUps ? 3 : 1);
    return Response.json({ emails });
  } catch (error) {
    console.error("Outreach draft failed", error instanceof Error ? error.message : error);
    return Response.json({ error: "Octa couldn't write the emails. Try again." }, { status: 502 });
  }
}
