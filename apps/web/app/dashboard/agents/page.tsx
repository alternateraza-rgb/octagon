import { getCloudflareContext } from "@opennextjs/cloudflare";
import { LeadFinder } from "@/components/agents/lead-finder";
import { getSession } from "@/lib/auth/server";
import { countUsage, getAccess } from "@/lib/billing/entitlements";
import { listLeads } from "@/lib/agents/store";

export const metadata = { title: "Lead Finder" };

export default async function AgentsPage() {
  const session = (await getSession())!;
  const { env } = await getCloudflareContext({ async: true });
  const access = await getAccess(env, session.user);
  const [leads, used] = await Promise.all([
    listLeads(env.DB, session.user.id, { limit: 500 }),
    countUsage(env.DB, session.user.id, "leads", access.periodStart),
  ]);
  return <LeadFinder initialLeads={leads} usage={access.limits ? { used, limit: access.limits.leads } : null} />;
}
