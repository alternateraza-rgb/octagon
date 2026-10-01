import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getSession } from "@/lib/auth/server";
import { MailboxError, exchangeCode, me } from "@/lib/outreach/microsoft";
import { saveMailbox } from "@/lib/outreach/store";

const back = (origin: string, query: string) => Response.redirect(`${origin}/dashboard/agents?tab=outreach&${query}`, 302);

// Microsoft sends the user back here with a code, exchanged for the tokens that send their email.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const session = await getSession();
  if (!session) return Response.redirect(`${origin}/login?next=/dashboard/agents`, 302);
  const { env } = await getCloudflareContext({ async: true });

  const state = url.searchParams.get("state") ?? "";
  const owner = state ? await env.SITES.get(`mailbox:state:${state}`) : null;
  if (state) await env.SITES.delete(`mailbox:state:${state}`);
  if (!owner || owner !== session.user.id) return back(origin, "mailbox=expired");
  // The user said no on Microsoft's screen.
  if (url.searchParams.get("error")) return back(origin, "mailbox=declined");
  const code = url.searchParams.get("code");
  if (!code) return back(origin, "mailbox=error");

  try {
    const tokens = await exchangeCode(env, origin, code);
    const account = await me(tokens.accessToken);
    if (!account.email) return back(origin, "mailbox=error");
    await saveMailbox(env, session.user.id, account, tokens);
    return back(origin, "mailbox=connected");
  } catch (error) {
    console.error("Outlook connect failed", error instanceof MailboxError ? error.message : error);
    return back(origin, "mailbox=error");
  }
}
