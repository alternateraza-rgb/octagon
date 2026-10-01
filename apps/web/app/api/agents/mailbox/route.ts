import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getSession } from "@/lib/auth/server";
import { removeMailbox } from "@/lib/outreach/store";

// Disconnects the mailbox. Scheduled emails wait until one is connected again.
export async function DELETE() {
  const session = await getSession();
  if (!session) return Response.json({ error: "Log in first." }, { status: 401 });
  const { env } = await getCloudflareContext({ async: true });
  await removeMailbox(env.DB, session.user.id);
  return Response.json({ ok: true });
}
