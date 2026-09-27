import { getCloudflareContext } from "@opennextjs/cloudflare";
import { reconcile } from "@/lib/sales/fulfil";
import { getSaleByToken } from "@/lib/sales/store";

// Public: where the invite page watches for its payment to go through. Checks with Whop directly,
// so a sale completes even before (or without) the webhook.
export async function GET(_request: Request, { params }: RouteContext<"/api/buy/[token]/status">) {
  const { token } = await params;
  const { env } = await getCloudflareContext({ async: true });
  let sale = await getSaleByToken(env.DB, token);
  if (!sale || sale.status === "canceled") return Response.json({ error: "This invite is no longer available." }, { status: 404 });
  const done = sale.status === "paid" && (!sale.monthlyCents || sale.hostingStatus === "active");
  if (!done) sale = await reconcile(env, sale);
  return Response.json({ status: sale.status, hostingStatus: sale.hostingStatus });
}
