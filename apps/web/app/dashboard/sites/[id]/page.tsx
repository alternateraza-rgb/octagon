import { notFound } from "next/navigation";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { Builder } from "@/components/builder/builder";
import { getSession } from "@/lib/auth/server";
import { siteUrl } from "@/lib/deploy/sites";
import { getLatestVersion, getSite, isStalled, listDeployments, listVersions } from "@/lib/sites/store";

export const metadata = { title: "Builder" };

export default async function SitePage({ params, searchParams }: PageProps<"/dashboard/sites/[id]">) {
  const { id } = await params;
  const { new: isNew } = await searchParams;
  const session = (await getSession())!;
  const { env } = await getCloudflareContext({ async: true });
  const site = await getSite(env.DB, id, session.user.id);
  if (!site) notFound();
  const [versions, deployments, latest] = await Promise.all([listVersions(env.DB, id), listDeployments(env.DB, id), getLatestVersion(env.DB, id)]);

  return (
    <Builder
      site={site}
      versions={versions}
      deployments={deployments}
      liveUrl={site.slug && site.deployedVersionId ? siteUrl(env, site.slug) : null}
      sitesDomain={env.SITES_DOMAIN}
      latestSize={latest?.html.length ?? 0}
      autoStart={isNew === "1"}
      stalled={isStalled(site)}
    />
  );
}
