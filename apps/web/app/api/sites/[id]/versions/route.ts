import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getSession } from "@/lib/auth/server";
import { streamText, streamToResponse } from "@/lib/ai/openai";
import { CREATE_INSTRUCTIONS, EDIT_INSTRUCTIONS, cleanHtml, editInput } from "@/lib/sites/prompts";
import { DAILY_GENERATION_LIMIT, addVersion, countRecentGenerations, getLatestVersion, getSite, setSiteStatus } from "@/lib/sites/store";

// Streams a new version of the site: the first build from the site's prompt, or an edit of the latest version.
export async function POST(request: Request, { params }: RouteContext<"/api/sites/[id]/versions">) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Log in to build a website." }, { status: 401 });
  const { id } = await params;
  const { instruction } = (await request.json().catch(() => ({}))) as { instruction?: unknown };

  const { env, ctx } = await getCloudflareContext({ async: true });
  const site = await getSite(env.DB, id, session.user.id);
  if (!site) return Response.json({ error: "Site not found." }, { status: 404 });
  if ((await countRecentGenerations(env.DB, session.user.id)) >= DAILY_GENERATION_LIMIT) {
    return Response.json({ error: `You've hit today's limit of ${DAILY_GENERATION_LIMIT} builds. Try again tomorrow.` }, { status: 429 });
  }

  const latest = await getLatestVersion(env.DB, id);
  let change: string;
  let generation;
  if (latest) {
    change = typeof instruction === "string" ? instruction.trim() : "";
    if (!change) return Response.json({ error: "Describe the change you want." }, { status: 400 });
    if (change.length > 2000) return Response.json({ error: "Keep your request under 2,000 characters." }, { status: 400 });
    generation = streamText(env, { model: env.OPENAI_MODEL, instructions: EDIT_INSTRUCTIONS, input: editInput(latest.html, change) });
  } else {
    change = site.prompt;
    generation = streamText(env, { model: env.OPENAI_MODEL, instructions: CREATE_INSTRUCTIONS, input: change });
  }
  await setSiteStatus(env.DB, id, "generating");

  return streamToResponse(ctx, generation, {
    onDone: async (text) => {
      const { html, title } = cleanHtml(text);
      await addVersion(env.DB, id, change, html, title);
    },
    // An edit that fails leaves the previous version in place.
    onError: () => setSiteStatus(env.DB, id, latest ? "ready" : "failed"),
  });
}
