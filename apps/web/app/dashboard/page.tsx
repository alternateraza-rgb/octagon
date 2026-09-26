import Link from "next/link";
import { redirect } from "next/navigation";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { ArrowUpRight } from "lucide-react";
import { OctacoreLogo } from "@octacore/ui/logo";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { NewSiteForm } from "@/components/builder/new-site-form";
import { getSession } from "@/lib/auth/server";
import { listSites } from "@/lib/sites/store";

export const metadata = { title: "Dashboard" };

const dateFormat = new Intl.DateTimeFormat("en", { month: "short", day: "numeric" });

export default async function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  const session = await getSession();
  if (!session) redirect("/login?next=/dashboard");
  const { prompt } = await searchParams;
  const { env } = await getCloudflareContext({ async: true });
  const sites = await listSites(env.DB, session.user.id);

  return (
    <div data-theme="light" className="flex min-h-dvh flex-col bg-canvas px-5 py-6 text-fg sm:px-10">
      <header className="flex items-center justify-between gap-4">
        <Link href="/" aria-label="Octacore home">
          <OctacoreLogo size={24} />
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden text-[14px] text-fg-2 sm:inline">{session.user.email}</span>
          <SignOutButton />
        </div>
      </header>
      <main className="mx-auto w-full max-w-[880px] flex-1 py-16">
        <h1 className="font-[family-name:var(--font-display)] text-[40px] font-semibold leading-[1] tracking-[-0.04em]">
          What are we building?
        </h1>
        <p className="mt-3 text-[16px] text-fg-2">Describe the business. Octacore designs the site.</p>
        <div className="mt-8">
          <NewSiteForm initialPrompt={typeof prompt === "string" ? prompt : undefined} />
        </div>

        <h2 className="mt-16 text-[21px] font-semibold tracking-[-0.02em]">Your sites</h2>
        {sites.length === 0 ? (
          <p className="mt-3 text-[15px] text-fg-2">Nothing yet. Your first site will show up here.</p>
        ) : (
          <ul className="mt-4 divide-y divide-black/[.08] rounded-[18px] bg-white ring-1 ring-black/5">
            {sites.map((site) => (
              <li key={site.id}>
                <Link href={`/sites/${site.id}`} className="flex min-h-[64px] items-center gap-4 px-5 py-3 hover:bg-black/[.02]">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-medium">{site.title ?? "Untitled site"}</p>
                    <p className="truncate text-[13px] text-fg-3">{site.prompt}</p>
                  </div>
                  {site.status !== "ready" && (
                    <span className="shrink-0 rounded-full bg-black/5 px-2.5 py-1 text-[12px] text-fg-2">
                      {site.status === "failed" ? "Failed" : "Building"}
                    </span>
                  )}
                  <span className="shrink-0 text-[13px] text-fg-3">{dateFormat.format(site.createdAt)}</span>
                  <ArrowUpRight size={16} className="shrink-0 text-fg-3" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
