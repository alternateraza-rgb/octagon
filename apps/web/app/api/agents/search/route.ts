import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getSession } from "@/lib/auth/server";
import { checkLimit } from "@/lib/billing/entitlements";
import { startDeck } from "@/lib/agents/deck";
import { clean, providerFailure } from "@/lib/agents/http";
import type { Country } from "@/lib/agents/places";
import { createSearch, listSearches, updateSearchCounts } from "@/lib/agents/store";

// Starts a search: one niche in one place. Returns the first three good fits; the rest are dealt by
// /api/agents/search/[id]/next. Nothing counts against the plan until a business is picked.
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Log in to find businesses." }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as { niche?: unknown; location?: unknown; country?: unknown };
  const niche = clean(body.niche, 60);
  const location = clean(body.location, 80);
  const country: Country = body.country === "CA" ? "CA" : "US";
  if (niche.length < 2) return Response.json({ error: "What kind of business are you looking for?" }, { status: 400 });
  if (location.length < 2) return Response.json({ error: "Which city or area should Octa search?" }, { status: 400 });

  const { env } = await getCloudflareContext({ async: true });
  // Checks the plan is active, has businesses left, and the daily search cap.
  const refused = await checkLimit(env, session.user, "leads");
  if (refused) return refused;

  const searchId = await createSearch(env.DB, session.user.id, { niche, location, country, found: 0, qualified: 0 });
  try {
    const hand = await startDeck(env, session.user.id, searchId, { niche, location, country });
    await updateSearchCounts(env.DB, searchId, hand.found, hand.qualified);
    return Response.json({ searchId, niche, location, country, ...hand });
  } catch (error) {
    return providerFailure(error);
  }
}

export async function GET() {
  const session = await getSession();
  if (!session) return Response.json({ error: "Log in first." }, { status: 401 });
  const { env } = await getCloudflareContext({ async: true });
  return Response.json({ searches: await listSearches(env.DB, session.user.id, 8) });
}
