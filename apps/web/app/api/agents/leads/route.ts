import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getSession } from "@/lib/auth/server";
import { LEAD_STATUSES, listLeads, type LeadStatus } from "@/lib/agents/store";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Log in first." }, { status: 401 });
  const params = new URL(request.url).searchParams;
  const status = params.get("status");
  const { env } = await getCloudflareContext({ async: true });
  const leads = await listLeads(env.DB, session.user.id, {
    status: LEAD_STATUSES.includes(status as LeadStatus) ? (status as LeadStatus) : "active",
    searchId: params.get("search") ?? undefined,
  });
  return Response.json({ leads });
}
