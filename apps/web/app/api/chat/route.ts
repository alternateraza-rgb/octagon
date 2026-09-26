import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getSession } from "@/lib/auth/server";
import { streamText, streamToResponse } from "@/lib/ai/openai";
import { addMessage, createConversation, getConversation, listMessages } from "@/lib/chat/store";

const INSTRUCTIONS = `You are Octa, the assistant inside Octacore — an app for building, hosting and selling websites to businesses.
Be genuinely helpful on any topic. When it fits, help with running a web business: finding clients, pricing, pitching, copywriting, SEO and design.
Answer directly and concisely, then add depth where it helps. Use Markdown: short paragraphs, lists, tables and fenced code blocks.`;

// How much history to send back to the model.
const HISTORY = 40;

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Log in to chat." }, { status: 401 });
  const { conversationId, message } = (await request.json().catch(() => ({}))) as { conversationId?: unknown; message?: unknown };
  const text = typeof message === "string" ? message.trim() : "";
  if (!text) return Response.json({ error: "Write a message first." }, { status: 400 });
  if (text.length > 20_000) return Response.json({ error: "That message is too long." }, { status: 400 });

  const { env, ctx } = await getCloudflareContext({ async: true });
  let id: string;
  if (typeof conversationId === "string") {
    if (!(await getConversation(env.DB, conversationId, session.user.id))) return Response.json({ error: "Chat not found." }, { status: 404 });
    id = conversationId;
  } else {
    id = await createConversation(env.DB, session.user.id, text);
  }
  await addMessage(env.DB, id, "user", text);
  const history = (await listMessages(env.DB, id)).slice(-HISTORY).map(({ role, content }) => ({ role, content }));

  return streamToResponse(ctx, streamText(env, { model: env.OPENAI_CHAT_MODEL, instructions: INSTRUCTIONS, input: history }), {
    headers: { "x-conversation-id": id },
    onDone: (reply) => addMessage(env.DB, id, "assistant", reply),
    onError: async () => {},
  });
}
