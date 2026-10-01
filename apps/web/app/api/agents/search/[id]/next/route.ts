import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getSession } from "@/lib/auth/server";
import { nextHand } from "@/lib/agents/deck";
import { providerFailure } from "@/lib/agents/http";
import { updateSearchCounts } from "@/lib/agents/store";

// The next three good fits from a search.
export async function POST(_request: Request, { params }: RouteContext<"/api/agents/search/[id]/next">) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Log in first." }, { status: 401 });
  const { id } = await params;
  const { env } = await getCloudflareContext({ async: true });
  try {
    const hand = await nextHand(env, session.user.id, id);
    if (!hand) return Response.json({ error: "This search has expired. Search again." }, { status: 410 });
    await updateSearchCounts(env.DB, id, hand.found, hand.qualified);
    return Response.json(hand);
  } catch (error) {
    return providerFailure(error);
  }
}
