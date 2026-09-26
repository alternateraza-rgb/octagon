import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getSession } from "@/lib/auth/server";
import { addMessage, getConversation } from "@/lib/chat/store";

// Saves the assistant reply the browser streamed from /api/chat.
export async function POST(request: Request, { params }: RouteContext<"/api/chat/[id]/reply">) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Log in first." }, { status: 401 });
  const { id } = await params;
  const { content } = (await request.json().catch(() => ({}))) as { content?: unknown };
  if (typeof content !== "string" || !content.trim()) return Response.json({ error: "Nothing to save." }, { status: 400 });
  if (content.length > 200_000) return Response.json({ error: "That reply is too long." }, { status: 413 });
  const { env } = await getCloudflareContext({ async: true });
  if (!(await getConversation(env.DB, id, session.user.id))) return Response.json({ error: "Chat not found." }, { status: 404 });
  await addMessage(env.DB, id, "assistant", content);
  return Response.json({ ok: true });
}
