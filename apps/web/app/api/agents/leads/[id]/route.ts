import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getSession } from "@/lib/auth/server";
import { PlacesError, getPlaceDetails } from "@/lib/agents/places";
import { getLead, refreshLead, setLeadStatus } from "@/lib/agents/store";

// A lead with fresh details from Google: reviews, opening hours and summary. These aren't stored
// (Google's terms), so each open is a Place Details call.
export async function GET(_request: Request, { params }: RouteContext<"/api/agents/leads/[id]">) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Log in first." }, { status: 401 });
  const { id } = await params;
  const { env } = await getCloudflareContext({ async: true });
  const lead = await getLead(env.DB, id, session.user.id);
  if (!lead) return Response.json({ error: "Lead not found." }, { status: 404 });
  try {
    const details = await getPlaceDetails(env, lead.placeId);
    const stillQualifies = await refreshLead(env.DB, session.user.id, details);
    return Response.json({
      lead: (await getLead(env.DB, id, session.user.id))!,
      stillQualifies,
      website: stillQualifies ? null : (details.websiteUri ?? null),
      summary: details.editorialSummary?.text ?? null,
      hours: details.regularOpeningHours?.weekdayDescriptions ?? [],
      reviews: (details.reviews ?? []).map((r) => ({
        author: r.authorAttribution?.displayName ?? "Google user",
        authorUrl: r.authorAttribution?.uri ?? null,
        photo: r.authorAttribution?.photoUri ?? null,
        rating: r.rating ?? null,
        text: r.text?.text ?? r.originalText?.text ?? "",
        when: r.relativePublishTimeDescription ?? null,
        url: r.googleMapsUri ?? null,
      })),
    });
  } catch (error) {
    if (error instanceof PlacesError) return Response.json({ error: error.message }, { status: error.status });
    throw error;
  }
}

export async function PATCH(request: Request, { params }: RouteContext<"/api/agents/leads/[id]">) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Log in first." }, { status: 401 });
  const { id } = await params;
  const { status } = (await request.json().catch(() => ({}))) as { status?: unknown };
  if (status !== "new" && status !== "saved" && status !== "dismissed") {
    return Response.json({ error: "Unknown status." }, { status: 400 });
  }
  const { env } = await getCloudflareContext({ async: true });
  const lead = await getLead(env.DB, id, session.user.id);
  if (!lead) return Response.json({ error: "Lead not found." }, { status: 404 });
  // A lead with a site stays "built" unless it's dismissed.
  await setLeadStatus(env.DB, id, session.user.id, lead.siteId && status !== "dismissed" ? "built" : status);
  return Response.json({ ok: true });
}
