import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getSession } from "@/lib/auth/server";
import { createSite } from "@/lib/sites/store";

// Creates the site record; the builder then streams its first version from /versions.
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Log in to build a website." }, { status: 401 });
  const { prompt } = (await request.json().catch(() => ({}))) as { prompt?: unknown };
  const text = typeof prompt === "string" ? prompt.trim() : "";
  if (text.length < 10) return Response.json({ error: "Describe your website in a little more detail." }, { status: 400 });
  if (text.length > 2000) return Response.json({ error: "Keep your description under 2,000 characters." }, { status: 400 });

  const { env } = await getCloudflareContext({ async: true });
  return Response.json({ id: await createSite(env.DB, session.user.id, text) });
}
