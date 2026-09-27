import { getCloudflareContext } from "@opennextjs/cloudflare";
import { SitesView } from "@/components/sites/sites-view";
import { getSession } from "@/lib/auth/server";
import { listSites } from "@/lib/sites/store";
import { renderTime } from "@/lib/time";

export const metadata = { title: "Websites" };

export default async function SitesPage({ searchParams }: PageProps<"/dashboard/sites">) {
  const session = (await getSession())!;
  const [{ prompt }, { env }] = await Promise.all([searchParams, getCloudflareContext({ async: true })]);
  const sites = await listSites(env.DB, session.user.id);
  return (
    <SitesView
      sites={sites}
      domain={env.SITES_DOMAIN}
      initialPrompt={typeof prompt === "string" ? prompt : undefined}
      now={renderTime()}
    />
  );
}
