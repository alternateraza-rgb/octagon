import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { getSession } from "@/lib/auth/server";
import { getSite } from "@/lib/sites/store";

export const metadata = { title: "Site preview" };

export default async function SitePage({ params }: PageProps<"/sites/[id]">) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect(`/login?next=/sites/${id}`);
  const { env } = await getCloudflareContext({ async: true });
  const site = await getSite(env.DB, id, session.user.id);
  if (!site) notFound();

  return (
    <div data-theme="light" className="flex h-dvh flex-col bg-canvas text-fg">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-black/[.08] px-3 sm:px-5">
        <Link href="/dashboard" aria-label="Back to dashboard" className="grid size-11 place-items-center rounded-full hover:bg-black/5">
          <ArrowLeft size={18} />
        </Link>
        <p className="min-w-0 flex-1 truncate text-[15px] font-medium">{site.title ?? "Untitled site"}</p>
        {site.html && (
          <a
            href={`/sites/${site.id}/preview`}
            target="_blank"
            rel="noopener"
            className="flex h-11 items-center gap-2 rounded-full bg-black/5 px-4 text-[14px] font-medium hover:bg-black/10"
          >
            <ExternalLink size={15} /> <span className="hidden sm:inline">Open full screen</span>
          </a>
        )}
      </header>
      {site.html ? (
        <iframe
          src={`/sites/${site.id}/preview`}
          title={site.title ?? "Site preview"}
          sandbox="allow-scripts allow-popups allow-forms"
          className="w-full flex-1 bg-white"
        />
      ) : (
        <div className="mx-auto flex max-w-[480px] flex-1 flex-col justify-center px-5 text-center">
          <h1 className="text-[28px] font-semibold tracking-[-0.03em]">
            {site.status === "failed" ? "This one didn’t build" : "Still building…"}
          </h1>
          <p className="mt-3 text-[15px] text-fg-2">
            {site.status === "failed"
              ? "Something went wrong while designing it. Head back and try again."
              : "Refresh in a moment to see it."}
          </p>
          <p className="mt-6 bg-white p-4 text-left text-[14px] text-fg-2 ring-1 ring-black/10">{site.prompt}</p>
        </div>
      )}
    </div>
  );
}
