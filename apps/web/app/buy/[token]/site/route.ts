import { getCloudflareContext } from "@opennextjs/cloudflare";
import { SANDBOX_CSP } from "@/lib/deploy/sites";
import { getSaleByToken } from "@/lib/sales/store";
import { getLatestVersion } from "@/lib/sites/store";

// The site an invite is for, framed by the invite page. Anyone with the link may see it.
export async function GET(_request: Request, { params }: RouteContext<"/buy/[token]/site">) {
  const { token } = await params;
  const { env } = await getCloudflareContext({ async: true });
  const sale = await getSaleByToken(env.DB, token);
  if (!sale || sale.status === "canceled") return new Response("Not found", { status: 404 });
  const version = await getLatestVersion(env.DB, sale.siteId);
  if (!version) return new Response("Not found", { status: 404 });
  return new Response(version.html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "content-security-policy": `${SANDBOX_CSP}; frame-ancestors 'self'`,
      "cache-control": "private, no-store",
      "x-robots-tag": "noindex",
    },
  });
}
