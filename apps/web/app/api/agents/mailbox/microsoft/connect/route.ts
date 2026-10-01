import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getSession } from "@/lib/auth/server";
import { token } from "@/lib/outreach/crypto";
import { authUrl, microsoftEnabled } from "@/lib/outreach/microsoft";

const back = (origin: string, query: string) => Response.redirect(`${origin}/dashboard/agents?tab=outreach&${query}`, 302);

// Sends the user to Microsoft to let Octacore send email from their Outlook account.
export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const session = await getSession();
  if (!session) return Response.redirect(`${origin}/login?next=/dashboard/agents`, 302);
  const { env } = await getCloudflareContext({ async: true });
  if (!microsoftEnabled(env)) return back(origin, "mailbox=unavailable");
  const state = token();
  await env.SITES.put(`mailbox:state:${state}`, session.user.id, { expirationTtl: 600 });
  return Response.redirect(authUrl(env, origin, state), 302);
}
