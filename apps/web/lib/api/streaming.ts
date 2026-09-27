// The two AI endpoints are served straight from the Worker entry, not through Next.js, and relay
// OpenAI's event stream to the browser without touching it: both Next's per-chunk handling and
// parsing the events here cost more CPU than a Worker request is allowed for a full site build.
// The browser parses the stream and saves the finished result with a second, small request.
import { createAuth } from "@/lib/auth/auth";
import { userMessage } from "@/lib/ai/content";
import { eventStreamResponse, openaiStream } from "@/lib/ai/openai";
import { addMessage, createConversation, deleteLastReply, getConversation, listMessages } from "@/lib/chat/store";
import { CREATE_INSTRUCTIONS, EDIT_INSTRUCTIONS, createInput, editInput } from "@/lib/sites/prompts";
import { getLatestVersion, getSite, setSiteStatus } from "@/lib/sites/store";
import { checkLimit, logUsage } from "@/lib/billing/entitlements";
import { parseAttachments } from "@/lib/attachments";
import { resolveAttachments } from "@/lib/uploads";

const CHAT_INSTRUCTIONS = `You are Octa, the assistant inside Octacore — an app for building, hosting and selling websites to businesses.
Be genuinely helpful on any topic. When it fits, help with running a web business: finding clients, pricing, pitching, copywriting, SEO and design.
Answer directly and concisely, then add depth where it helps. Use Markdown: short paragraphs, lists, tables and fenced code blocks.`;

// How much chat history to send back to the model.
const HISTORY = 40;

export function routeStreamingApi(request: Request, env: CloudflareEnv) {
  if (request.method !== "POST") return null;
  const { pathname } = new URL(request.url);
  if (pathname === "/api/chat") return chat(request, env);
  const site = pathname.match(/^\/api\/sites\/([^/]+)\/versions$/);
  if (site) return startVersion(request, env, site[1]);
  return null;
}

function failure(error: unknown) {
  console.error("OpenAI request failed", error);
  return Response.json({ error: "The AI service didn't respond. Try again in a moment." }, { status: 502 });
}

async function chat(request: Request, env: CloudflareEnv) {
  const session = await createAuth(env).api.getSession({ headers: request.headers });
  if (!session) return Response.json({ error: "Log in to chat." }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as {
    conversationId?: unknown;
    message?: unknown;
    attachments?: unknown;
    regenerate?: unknown;
  };
  const { conversationId } = body;
  const refused = await checkLimit(env, session.user, "chat");
  if (refused) return refused;

  let id: string;
  if (body.regenerate === true) {
    // Answer the last message again: drop the previous reply, keep everything else.
    if (typeof conversationId !== "string" || !(await getConversation(env.DB, conversationId, session.user.id))) {
      return Response.json({ error: "Chat not found." }, { status: 404 });
    }
    id = conversationId;
    await deleteLastReply(env.DB, id);
  } else {
    const attachments = await resolveAttachments(env.DB, session.user.id, body.attachments);
    let text = typeof body.message === "string" ? body.message.trim() : "";
    if (!text && attachments.length)
      text = attachments.length === 1 ? "Take a look at this file." : "Take a look at these files.";
    if (!text) return Response.json({ error: "Write a message first." }, { status: 400 });
    if (text.length > 20_000) return Response.json({ error: "That message is too long." }, { status: 400 });

    if (typeof conversationId === "string") {
      if (!(await getConversation(env.DB, conversationId, session.user.id)))
        return Response.json({ error: "Chat not found." }, { status: 404 });
      id = conversationId;
    } else {
      id = await createConversation(env.DB, session.user.id, text);
    }
    await addMessage(env.DB, id, "user", text, attachments);
  }
  await logUsage(env.DB, session.user.id, "chat");
  const history = (await listMessages(env.DB, id))
    .slice(-HISTORY)
    .map((m) => (m.role === "user" ? userMessage(m.content, m.attachments) : { role: m.role, content: m.content }));

  try {
    const body = await openaiStream(env, { model: env.OPENAI_CHAT_MODEL, instructions: CHAT_INSTRUCTIONS, input: history });
    return eventStreamResponse(body, { "x-conversation-id": id });
  } catch (error) {
    return failure(error);
  }
}

// Streams a new version of a site: the first build from its prompt, or an edit of the latest
// version. The browser saves the result at /api/sites/:id/versions/save.
async function startVersion(request: Request, env: CloudflareEnv, id: string) {
  const session = await createAuth(env).api.getSession({ headers: request.headers });
  if (!session) return Response.json({ error: "Log in to build a website." }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as { instruction?: unknown; attachments?: unknown };

  const site = await getSite(env.DB, id, session.user.id);
  if (!site) return Response.json({ error: "Site not found." }, { status: 404 });
  const refused = await checkLimit(env, session.user, "builds");
  if (refused) return refused;

  const latest = await getLatestVersion(env.DB, id);
  let spec;
  if (latest) {
    const attachments = await resolveAttachments(env.DB, session.user.id, body.attachments);
    const change = typeof body.instruction === "string" ? body.instruction.trim() : "";
    if (!change) return Response.json({ error: "Describe the change you want." }, { status: 400 });
    if (change.length > 2000) return Response.json({ error: "Keep your request under 2,000 characters." }, { status: 400 });
    const input = [userMessage(editInput(latest.html, change, attachments), attachments)];
    spec = { model: env.OPENAI_MODEL, instructions: EDIT_INSTRUCTIONS, input };
  } else {
    const attachments = parseAttachments(site.attachments);
    const input = [userMessage(createInput(site.prompt, attachments), attachments)];
    spec = { model: env.OPENAI_MODEL, instructions: CREATE_INSTRUCTIONS, input };
  }

  await logUsage(env.DB, session.user.id, "build");
  await setSiteStatus(env.DB, id, "generating");
  try {
    return eventStreamResponse(await openaiStream(env, spec));
  } catch (error) {
    await setSiteStatus(env.DB, id, latest ? "ready" : "failed");
    return failure(error);
  }
}
