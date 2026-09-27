import { redirect } from "next/navigation";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { OwnerView, type OwnedSite } from "@/components/sales/owner-view";
import { getSession } from "@/lib/auth/server";
import { siteUrl } from "@/lib/deploy/sites";

// Where clients who bought a site manage it: see it live, handle billing, ask for changes.
export default async function OwnerPage() {
  const session = await getSession();
  if (!session) redirect("/owner/sign-in");
  const { env } = await getCloudflareContext({ async: true });
  const { results } = await env.DB.prepare(
    `select s.id, s.title, s.slug, s.deployedVersionId, s.pausedAt, sale.token, sale.monthlyCents, sale.priceCents, sale.hostingStatus,
       sale.manageUrl, sale.paidAt, u.name as sellerName, u.email as sellerEmail
     from site s join sale on sale.id = s.saleId join user u on u.id = sale.sellerId
     where s.ownerId = ? order by sale.paidAt desc`,
  )
    .bind(session.user.id)
    .all<{
      id: string;
      title: string | null;
      slug: string | null;
      deployedVersionId: string | null;
      pausedAt: number | null;
      token: string;
      monthlyCents: number | null;
      priceCents: number;
      hostingStatus: "none" | "active" | "ended";
      manageUrl: string | null;
      paidAt: number | null;
      sellerName: string;
      sellerEmail: string;
    }>();
  const sites: OwnedSite[] = results.map((r) => ({
    id: r.id,
    title: r.title ?? "Your website",
    url: r.slug && r.deployedVersionId ? siteUrl(env, r.slug) : null,
    live: !!r.slug && !!r.deployedVersionId && !r.pausedAt,
    buyUrl: `/buy/${r.token}`,
    monthlyCents: r.monthlyCents,
    hostingStatus: r.hostingStatus,
    manageUrl: r.manageUrl,
    paidAt: r.paidAt,
    sellerName: r.sellerName,
    sellerEmail: r.sellerEmail,
  }));
  return (
    <OwnerView
      name={session.user.name || session.user.email.split("@")[0]}
      email={session.user.email}
      builder={(session.user as { role?: string }).role !== "owner"}
      sites={sites}
    />
  );
}
