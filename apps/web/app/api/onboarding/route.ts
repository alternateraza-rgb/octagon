import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getSession } from "@/lib/auth/server";
import { dismissChecklist, getOnboarding, markTourDone } from "@/lib/onboarding/store";

// The checklist refreshes from here as people move around the dashboard.
export async function GET() {
  const session = await getSession();
  if (!session) return Response.json({ error: "Log in first." }, { status: 401 });
  const { env } = await getCloudflareContext({ async: true });
  return Response.json(await getOnboarding(env.DB, session.user.id));
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Log in first." }, { status: 401 });
  const { action } = (await request.json().catch(() => ({}))) as { action?: unknown };
  const { env } = await getCloudflareContext({ async: true });
  if (action === "tourDone") await markTourDone(env.DB, session.user.id);
  else if (action === "dismissChecklist") await dismissChecklist(env.DB, session.user.id);
  else return Response.json({ error: "Unknown action." }, { status: 400 });
  return Response.json(await getOnboarding(env.DB, session.user.id));
}
