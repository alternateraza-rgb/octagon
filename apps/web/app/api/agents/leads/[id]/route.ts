import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getSession } from "@/lib/auth/server";
import { businessDetails } from "@/lib/agents/find";
import { providerFailure } from "@/lib/agents/http";
import { getLead, updateLead } from "@/lib/agents/store";

// One business with its reviews and opening hours, for the detail sheet. Reviews are fetched once and
// shared for a month (lib/agents/find.ts).
export async function GET(_request: Request, { params }: RouteContext<"/api/agents/leads/[id]">) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Log in first." }, { status: 401 });
  const { id } = await params;
  const { env } = await getCloudflareContext({ async: true });
  const lead = await getLead(env.DB, id, session.user.id);
  if (!lead) return Response.json({ error: "Business not found." }, { status: 404 });
  try {
    const found = await businessDetails(env, session.user.id, lead.placeId);
    return Response.json({
      lead,
      address: found?.business.address ?? lead.address,
      hours: found?.business.hours ?? [],
      reviews: (found?.business.reviews ?? []).map((r) => ({
        author: r.authorAttribution?.displayName ?? "Google user",
        authorUrl: r.authorAttribution?.uri ?? null,
        photo: r.authorAttribution?.photoUri ?? null,
        rating: r.rating ?? null,
        text: r.text?.text ?? "",
        when: r.relativePublishTimeDescription ?? null,
        url: r.googleMapsUri ?? null,
      })),
    });
  } catch (error) {
    return providerFailure(error);
  }
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// The user's own corrections: email, phone, notes, progress, or removing it from the list.
export async function PATCH(request: Request, { params }: RouteContext<"/api/agents/leads/[id]">) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Log in first." }, { status: 401 });
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const change: Parameters<typeof updateLead>[3] = {};
  if (typeof body.email === "string") {
    const email = body.email.trim().toLowerCase();
    if (email && !EMAIL.test(email)) return Response.json({ error: "That email doesn't look right." }, { status: 400 });
    change.email = email || null;
  }
  if (typeof body.phone === "string") change.phone = body.phone.trim().slice(0, 40) || null;
  if (typeof body.notes === "string") change.notes = body.notes.slice(0, 2000) || null;
  if (body.removed === true) change.status = "dismissed";
  if (body.stage === "emailed" || body.stage === "replied") change.stage = body.stage;

  const { env } = await getCloudflareContext({ async: true });
  if (!(await getLead(env.DB, id, session.user.id))) return Response.json({ error: "Business not found." }, { status: 404 });
  await updateLead(env.DB, id, session.user.id, change);
  return Response.json({ lead: await getLead(env.DB, id, session.user.id) });
}
