// The two AI endpoints are served straight from the Worker entry, not through Next.js, and relay
// OpenAI's event stream to the browser without touching it: both Next's per-chunk handling and
// parsing the events here cost more CPU than a Worker request is allowed for a full site build.
// The browser parses the stream and saves the finished result with a second, small request.
import { createAuth } from "@/lib/auth/auth";
import { eventStreamResponse, openaiStream } from "@/lib/ai/openai";
import { addMessage, createConversation, getConversation, listMessages } from "@/lib/chat/store";
import { CREATE_INSTRUCTIONS, EDIT_INSTRUCTIONS, editInput } from "@/lib/sites/prompts";
import { DAILY_GENERATION_LIMIT, countRecentGenerations, getLatestVersion, getSite, logGeneration, setSiteStatus } from "@/lib/sites/store";

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
  const { conversationId, message } = (await request.json().catch(() => ({}))) as { conversationId?: unknown; message?: unknown };
  const text = typeof message === "string" ? message.trim() : "";
  if (!text) return Response.json({ error: "Write a message first." }, { status: 400 });
  if (text.length > 20_000) return Response.json({ error: "That message is too long." }, { status: 400 });

  let id: string;
  if (typeof conversationId === "string") {
    if (!(await getConversation(env.DB, conversationId, session.user.id))) return Response.json({ error: "Chat not found." }, { status: 404 });
    id = conversationId;
  } else {
    id = await createConversation(env.DB, session.user.id, text);
  }
  await addMessage(env.DB, id, "user", text);
  const history = (await listMessages(env.DB, id)).slice(-HISTORY).map(({ role, content }) => ({ role, content }));

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
  const { instruction } = (await request.json().catch(() => ({}))) as { instruction?: unknown };

  const site = await getSite(env.DB, id, session.user.id);
  if (!site) return Response.json({ error: "Site not found." }, { status: 404 });
  if ((await countRecentGenerations(env.DB, session.user.id)) >= DAILY_GENERATION_LIMIT) {
    return Response.json({ error: `You've hit today's limit of ${DAILY_GENERATION_LIMIT} builds. Try again tomorrow.` }, { status: 429 });
  }

  const latest = await getLatestVersion(env.DB, id);
  let spec;
  if (latest) {
    const change = typeof instruction === "string" ? instruction.trim() : "";
    if (!change) return Response.json({ error: "Describe the change you want." }, { status: 400 });
    if (change.length > 2000) return Response.json({ error: "Keep your request under 2,000 characters." }, { status: 400 });
    spec = { model: env.OPENAI_MODEL, instructions: EDIT_INSTRUCTIONS, input: editInput(latest.html, change) };
  } else {
    spec = { model: env.OPENAI_MODEL, instructions: CREATE_INSTRUCTIONS, input: site.prompt };
  }

  await logGeneration(env.DB, session.user.id);
  await setSiteStatus(env.DB, id, "generating");
  try {
    return eventStreamResponse(await openaiStream(env, spec));
  } catch (error) {
    await setSiteStatus(env.DB, id, latest ? "ready" : "failed");
    return failure(error);
  }
}
