import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getSession } from "@/lib/auth/server";
import { SANDBOX_CSP } from "@/lib/deploy/sites";
import { getVersionHtml } from "@/lib/sites/store";

// Private preview of any version, for its owner only.
export async function GET(_request: Request, { params }: RouteContext<"/preview/[versionId]">) {
  const session = await getSession();
  if (!session) return new Response("Not found", { status: 404 });
  const { versionId } = await params;
  const { env } = await getCloudflareContext({ async: true });
  const html = await getVersionHtml(env.DB, versionId, session.user.id);
  if (!html) return new Response("Not found", { status: 404 });
  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "content-security-policy": `${SANDBOX_CSP}; frame-ancestors 'self'`,
      "cache-control": "private, max-age=31536000, immutable",
    },
  });
}
