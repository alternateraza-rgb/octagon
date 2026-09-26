import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getSession } from "@/lib/auth/server";
import { deleteConversation } from "@/lib/chat/store";

export async function DELETE(_request: Request, { params }: RouteContext<"/api/chat/[id]">) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Log in first." }, { status: 401 });
  const { id } = await params;
  const { env } = await getCloudflareContext({ async: true });
  await deleteConversation(env.DB, id, session.user.id);
  return new Response(null, { status: 204 });
}
