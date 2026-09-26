import Link from "next/link";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NewSiteForm } from "@/components/builder/new-site-form";
import { getSession } from "@/lib/auth/server";
import { listSites } from "@/lib/sites/store";

export const metadata = { title: "Websites" };

const date = new Intl.DateTimeFormat("en", { month: "short", day: "numeric" });

export default async function SitesPage({ searchParams }: PageProps<"/dashboard/sites">) {
  const session = (await getSession())!;
  const { prompt } = await searchParams;
  const { env } = await getCloudflareContext({ async: true });
  const sites = await listSites(env.DB, session.user.id);

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-[1120px] px-5 py-12 sm:py-16">
        <h1 className="font-[family-name:var(--font-display)] text-[40px] font-semibold leading-[1.02] tracking-[-0.04em] sm:text-[48px]">
          Websites
        </h1>
        <p className="mt-3 text-[17px] text-fg-2">Describe a business. Octacore designs, builds and hosts the site.</p>
        <div className="mt-8 max-w-[760px]">
          <NewSiteForm initialPrompt={typeof prompt === "string" ? prompt : undefined} />
        </div>

        {sites.length > 0 && (
          <ul className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {sites.map((site) => (
              <li key={site.id}>
                <Link href={`/dashboard/sites/${site.id}`} className="group block">
                  <div className="relative aspect-[16/10] overflow-hidden rounded-[18px] bg-canvas-2 shadow-soft ring-1 ring-hairline transition-transform duration-500 ease-[var(--ease-spring)] group-hover:-translate-y-0.5">
                    {site.latestVersionId ? (
                      <iframe
                        src={`/preview/${site.latestVersionId}`}
                        title=""
                        aria-hidden
                        tabIndex={-1}
                        loading="lazy"
                        sandbox=""
                        className="pointer-events-none absolute left-0 top-0 h-[400%] w-[400%] origin-top-left scale-25 bg-white"
                      />
                    ) : (
                      <p className="grid h-full place-items-center text-[14px] text-fg-3">
                        {site.status === "failed" ? "Build didn’t finish" : "Building…"}
                      </p>
                    )}
                  </div>
                  <div className="mt-3 flex items-center gap-2 px-1">
                    <p className="min-w-0 flex-1 truncate text-[15px] font-medium">{site.title ?? "New website"}</p>
                    {site.deployedVersionId && (
                      <span className="flex items-center gap-1.5 text-[12px] text-fg-2">
                        <span className="size-1.5 rounded-full bg-emerald-500" /> Live
                      </span>
                    )}
                    <span className="text-[12px] text-fg-3">{date.format(site.updatedAt)}</span>
                  </div>
                  <p className="truncate px-1 text-[13px] text-fg-3">
                    {site.slug ? `${site.slug}.${env.SITES_DOMAIN}` : site.prompt}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
