import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getSession } from "@/lib/auth/server";
import { checkLimit } from "@/lib/billing/entitlements";
import { getBusiness, needsHunt, toPlace } from "@/lib/agents/business";
import { huntContacts } from "@/lib/agents/contacts";
import { qualify, score } from "@/lib/agents/score";
import { decide, getSearch, listLeads } from "@/lib/agents/store";

// The user's businesses. ?ids=a,b,c returns just those, for polling while their contacts are found.
export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Log in first." }, { status: 401 });
  const ids = new URL(request.url).searchParams.get("ids")?.split(",").filter(Boolean);
  const { env } = await getCloudflareContext({ async: true });
  return Response.json({ leads: await listLeads(env.DB, session.user.id, { ids }) });
}

// Picks a business from a search into the list (and starts hunting its email), or skips it for good.
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Log in first." }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as { searchId?: unknown; placeId?: unknown; decision?: unknown };
  if (typeof body.placeId !== "string" || (body.decision !== "add" && body.decision !== "skip")) {
    return Response.json({ error: "Pick a business first." }, { status: 400 });
  }
  const { env, ctx } = await getCloudflareContext({ async: true });
  const search = typeof body.searchId === "string" ? await getSearch(env.DB, body.searchId, session.user.id) : null;
  const business = await getBusiness(env.DB, body.placeId);
  if (!business) return Response.json({ error: "That business couldn't be found." }, { status: 404 });
  const q = qualify(toPlace(business));
  if (!q) return Response.json({ error: "This business has a website now." }, { status: 409 });

  if (body.decision === "add") {
    const refused = await checkLimit(env, session.user, "leads");
    if (refused) return refused;
  }
  const lead = await decide(
    env.DB,
    session.user.id,
    search?.id ?? null,
    business,
    score(q, search?.niche),
    body.decision === "add" ? "saved" : "dismissed",
  );
  // The hunt runs after the response; the list polls until it's done.
  if (body.decision === "add" && needsHunt(business)) {
    ctx.waitUntil(huntContacts(env, session.user.id, business));
  }
  return Response.json({ lead: body.decision === "add" ? lead : null });
}
