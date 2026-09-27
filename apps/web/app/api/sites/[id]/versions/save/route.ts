import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getSession } from "@/lib/auth/server";
import { cleanHtml } from "@/lib/sites/prompts";
import { addVersion, getLatestVersion, getSite, setSiteStatus } from "@/lib/sites/store";
import { parseAttachments } from "@/lib/attachments";
import { resolveAttachments } from "@/lib/uploads";

// Saves a build the browser received from /api/sites/:id/versions, or records that it failed.
export async function POST(request: Request, { params }: RouteContext<"/api/sites/[id]/versions/save">) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Log in first." }, { status: 401 });
  const { id } = await params;
  const { env } = await getCloudflareContext({ async: true });
  const site = await getSite(env.DB, id, session.user.id);
  if (!site) return Response.json({ error: "Site not found." }, { status: 404 });

  const body = (await request.json().catch(() => ({}))) as { instruction?: unknown; text?: unknown; failed?: unknown; attachments?: unknown };
  if (body.failed === true || typeof body.text !== "string") {
    await setSiteStatus(env.DB, id, (await getLatestVersion(env.DB, id)) ? "ready" : "failed");
    return Response.json({ ok: true });
  }
  if (body.text.length > 1_000_000) return Response.json({ error: "That page is too large." }, { status: 413 });
  const firstBuild = !(await getLatestVersion(env.DB, id));
  const instruction = typeof body.instruction === "string" && body.instruction.trim() ? body.instruction.trim().slice(0, 2000) : site.prompt;
  const attachments = firstBuild ? parseAttachments(site.attachments) : await resolveAttachments(env.DB, session.user.id, body.attachments);
  try {
    const { html, title } = cleanHtml(body.text);
    return Response.json({ versionId: await addVersion(env.DB, id, instruction, html, title, attachments) });
  } catch (error) {
    await setSiteStatus(env.DB, id, (await getLatestVersion(env.DB, id)) ? "ready" : "failed");
    return Response.json({ error: error instanceof Error ? error.message : "Couldn't save that build." }, { status: 422 });
  }
}
