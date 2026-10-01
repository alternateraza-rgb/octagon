import { getCloudflareContext } from "@opennextjs/cloudflare";
import { AgentsView, type Tab } from "@/components/agents/agents-view";
import { getSession } from "@/lib/auth/server";
import { listLeads, listSearches } from "@/lib/agents/store";
import { outreachState } from "@/lib/outreach/state";

export const metadata = { title: "Agents" };

const TABS: Tab[] = ["find", "businesses", "outreach"];

export default async function AgentsPage({ searchParams }: PageProps<"/dashboard/agents">) {
  const session = (await getSession())!;
  const { env } = await getCloudflareContext({ async: true });
  const [params, leads, searches, outreach] = await Promise.all([
    searchParams,
    listLeads(env.DB, session.user.id),
    listSearches(env.DB, session.user.id, 20),
    outreachState(env, session.user.id),
  ]);
  // The same niche and city searched again shows once.
  const seen = new Set<string>();
  const recent = searches.filter((s) => {
    const key = `${s.niche}|${s.location}|${s.country}`.toLowerCase();
    return !seen.has(key) && !!seen.add(key);
  });
  const tab = TABS.find((t) => t === params.tab) ?? null;
  const notice = typeof params.mailbox === "string" ? params.mailbox : null;
  return <AgentsView initialLeads={leads} recent={recent.slice(0, 8)} outreach={outreach} initialTab={tab} notice={notice} />;
}
