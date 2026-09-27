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

export async function PATCH(request: Request, { params }: RouteContext<"/api/chat/[id]">) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Log in first." }, { status: 401 });
  const { id } = await params;
  const { title } = (await request.json().catch(() => ({}))) as { title?: unknown };
  const value = typeof title === "string" ? title.replace(/\s+/g, " ").trim().slice(0, 80) : "";
  if (!value) return Response.json({ error: "Give the chat a name." }, { status: 400 });
  const { env } = await getCloudflareContext({ async: true });
  await env.DB.prepare(`update conversation set title = ? where id = ? and userId = ?`).bind(value, id, session.user.id).run();
  return Response.json({ title: value });
}
