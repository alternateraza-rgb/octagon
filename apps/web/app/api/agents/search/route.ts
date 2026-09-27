import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getSession } from "@/lib/auth/server";
import { checkLimit, remaining } from "@/lib/billing/entitlements";
import { PlacesError, searchPlaces, type Country } from "@/lib/agents/places";
import { rank } from "@/lib/agents/score";
import { createSearch, knownPlaceIds, listLeads, saveLeads } from "@/lib/agents/store";

const AGENTS_ENABLED = false;

const clean = (value: unknown, max: number) => (typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "");

// Lead Finder: one niche in one place. Finds businesses on Google without a website of their own,
// ranks them, and keeps the new ones as leads. Only new leads count against the plan.
export async function POST(request: Request) {
  // Octa Agents is "Coming soon": the search stays off until Lead Finder ships.
  if (!AGENTS_ENABLED) return Response.json({ error: "Not found." }, { status: 404 });
  const session = await getSession();
  if (!session) return Response.json({ error: "Log in to find leads." }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as { niche?: unknown; location?: unknown; country?: unknown };
  const niche = clean(body.niche, 60);
  const location = clean(body.location, 80);
  const country: Country = body.country === "CA" ? "CA" : "US";
  if (niche.length < 2) return Response.json({ error: "What kind of business are you looking for?" }, { status: 400 });
  if (location.length < 2) return Response.json({ error: "Which city or area should we search?" }, { status: 400 });

  const { env } = await getCloudflareContext({ async: true });
  const refused = await checkLimit(env, session.user, "leads");
  if (refused) return refused;
  const room = await remaining(env, session.user, "leads");

  let places;
  try {
    places = await searchPlaces(env, `${niche} in ${location}, ${country === "CA" ? "Canada" : "USA"}`, country);
  } catch (error) {
    if (error instanceof PlacesError) return Response.json({ error: error.message }, { status: error.status });
    throw error;
  }
  const ranked = rank(places, niche);
  const known = await knownPlaceIds(env.DB, session.user.id, ranked.map((r) => r.place.id));
  const fresh = ranked.filter((r) => !known.has(r.place.id));
  const kept = fresh.slice(0, room);

  const searchId = await createSearch(env.DB, session.user.id, {
    niche,
    location,
    country,
    found: places.length,
    qualified: ranked.length,
  });
  await saveLeads(env.DB, session.user.id, searchId, kept, ranked.filter((r) => known.has(r.place.id)));

  const ids = new Set(ranked.map((r) => r.place.id));
  const leads = (await listLeads(env.DB, session.user.id, { limit: 500 })).filter((l) => ids.has(l.placeId));
  return Response.json({
    searchId,
    found: places.length,
    qualified: ranked.length,
    added: kept.length,
    alreadyHad: known.size,
    // New leads left out because the plan's monthly allowance ran out.
    overLimit: fresh.length - kept.length,
    leads,
  });
}
