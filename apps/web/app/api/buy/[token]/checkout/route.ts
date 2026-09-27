import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createSaleCheckout } from "@/lib/billing/whop";
import { fee } from "@/lib/sales/money";
import { getSaleByToken, getSeller, isExpired, setCheckout } from "@/lib/sales/store";

const checkoutUrl = (id: string) => `https://whop.com/checkout/${id}/`;

// Public: the client paying from an invite link. Returns Whop checkout for the site, or, once the
// site is paid for, for its monthly hosting. Each is created once per invite and then reused, so
// every payment for it can be found again.
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

  const existing = kind === "site" ? sale.siteCheckoutId : sale.hostingCheckoutId;
  if (existing) return Response.json({ id: existing, purchaseUrl: checkoutUrl(existing) });

  const seller = await getSeller(env.DB, sale.sellerId);
  if (!seller) return Response.json({ error: "The seller can't take payments right now." }, { status: 409 });
  const cents = kind === "site" ? sale.priceCents : sale.monthlyCents!;
  const name = sale.siteTitle ?? "Website";
  try {
    const checkout = await createSaleCheckout(env, {
      accountId: seller.whopAccountId,
      kind,
      cents,
      feeCents: fee(cents),
      currency: sale.currency,
      title: kind === "site" ? name : `${name} — hosting`,
      metadata: { saleId: sale.id, kind },
      redirectUrl: `https://octacore.app/buy/${token}?paid=${kind}`,
    });
    await setCheckout(env.DB, sale.id, kind, checkout.id);
    return Response.json({ id: checkout.id, purchaseUrl: checkout.purchase_url || checkoutUrl(checkout.id) });
  } catch (error) {
    console.error("Couldn't create the sale checkout", sale.id, kind, error);
    return Response.json({ error: "Couldn't start checkout. Try again in a moment." }, { status: 502 });
  }
}
