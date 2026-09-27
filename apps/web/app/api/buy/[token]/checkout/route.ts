import { getCloudflareContext } from "@opennextjs/cloudflare";
import { CheckoutError, ensureCheckout } from "@/lib/sales/checkout";
import { getSaleByToken, isExpired } from "@/lib/sales/store";

// Public: the client paying from an invite link. Returns Whop checkout for the site, or, once the
// site is paid for, for its monthly hosting.
export async function POST(request: Request, { params }: RouteContext<"/api/buy/[token]/checkout">) {
  const { token } = await params;
  const { kind } = (await request.json().catch(() => ({}))) as { kind?: unknown };
  if (kind !== "site" && kind !== "hosting") return Response.json({ error: "Unknown checkout." }, { status: 400 });

  const { env } = await getCloudflareContext({ async: true });
  const sale = await getSaleByToken(env.DB, token);
  if (!sale || sale.status === "canceled") return Response.json({ error: "This invite is no longer available." }, { status: 404 });
  if (kind === "site") {
    if (sale.status === "paid") return Response.json({ error: "This website has already been bought." }, { status: 409 });
    if (isExpired(sale)) return Response.json({ error: "This invite has expired. Ask for a new one." }, { status: 410 });
  } else {
    if (sale.status !== "paid" || !sale.monthlyCents) return Response.json({ error: "Buy the website first." }, { status: 409 });
    if (sale.hostingStatus === "active") return Response.json({ error: "Hosting is already active." }, { status: 409 });
  }

  try {
    return Response.json(await ensureCheckout(env, sale, kind));
  } catch (error) {
    // The client can't fix a refusal: point them at the seller (who sees Whop's reason when selling).
    const refused = error instanceof CheckoutError && error.refused;
    return Response.json(
      {
        error: refused
          ? `Checkout isn't available right now. Ask ${sale.sellerName} to check their Octacore payouts.`
          : "Couldn't start checkout. Try again in a moment.",
      },
      { status: 502 },
    );
  }
}
