import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getSession } from "@/lib/auth/server";
import { getAccess, getUsage } from "@/lib/billing/entitlements";

// The account's plan and this period's usage, for Settings › Billing and checkout polling.
export async function GET() {
  const session = await getSession();
  if (!session) return Response.json({ error: "Log in first." }, { status: 401 });
  const { env } = await getCloudflareContext({ async: true });
  const access = await getAccess(env, session.user);
  const usage = await getUsage(env.DB, session.user.id, access.periodStart);
  return Response.json({ access, usage }, { headers: { "cache-control": "no-store" } });
}
