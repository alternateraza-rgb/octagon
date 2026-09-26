import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getSession } from "@/lib/auth/server";
import { generateSiteHtml } from "@/lib/sites/generate";
import { DAILY_GENERATION_LIMIT, countRecentSites, createSite, finishSite } from "@/lib/sites/store";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Log in to build a website." }, { status: 401 });

  const { prompt } = (await request.json().catch(() => ({}))) as { prompt?: unknown };
  const text = typeof prompt === "string" ? prompt.trim() : "";
  if (text.length < 10) return Response.json({ error: "Describe your website in a little more detail." }, { status: 400 });
  if (text.length > 2000) return Response.json({ error: "Keep your description under 2,000 characters." }, { status: 400 });

  const { env } = await getCloudflareContext({ async: true });
  if ((await countRecentSites(env.DB, session.user.id)) >= DAILY_GENERATION_LIMIT) {
    return Response.json({ error: `You've built ${DAILY_GENERATION_LIMIT} sites today. Try again tomorrow.` }, { status: 429 });
  }

  const id = await createSite(env.DB, session.user.id, text);
  try {
    await finishSite(env.DB, id, await generateSiteHtml(env, text));
  } catch (error) {
    console.error("Site generation failed", error);
    await finishSite(env.DB, id, { error: error instanceof Error ? error.message : String(error) });
    return Response.json({ id, error: "We couldn't build that one. Try again in a moment." }, { status: 502 });
  }
  return Response.json({ id });
}
