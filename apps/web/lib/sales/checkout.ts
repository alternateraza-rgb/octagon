// The Whop checkouts for a sale: one for the site, one for its monthly hosting. Each is created
// once and then reused, so every payment made through it can be found again.
import { WhopError, createSaleCheckout } from "@/lib/billing/whop";
import { fee } from "./money";
import { getSeller, setCheckout, type SaleView } from "./store";

export const checkoutUrl = (id: string) => `https://whop.com/checkout/${id}/`;

export class CheckoutError extends Error {
  constructor(
    message: string,
    // Whop refused the request itself (as opposed to being unreachable).
    readonly refused: boolean,
  ) {
    super(message);
  }
}

export async function ensureCheckout(env: CloudflareEnv, sale: SaleView, kind: "site" | "hosting") {
  const existing = kind === "site" ? sale.siteCheckoutId : sale.hostingCheckoutId;
  if (existing) return { id: existing, purchaseUrl: checkoutUrl(existing) };

  const seller = await getSeller(env.DB, sale.sellerId);
  if (!seller) throw new CheckoutError("The seller hasn't set up payouts.", true);
  const cents = kind === "site" ? sale.priceCents : sale.monthlyCents;
  if (!cents) throw new CheckoutError("This sale has no hosting fee.", true);
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
      redirectUrl: `https://octacore.app/buy/${sale.token}?paid=${kind}`,
    });
    await setCheckout(env.DB, sale.id, kind, checkout.id);
    return { id: checkout.id, purchaseUrl: checkout.purchase_url || checkoutUrl(checkout.id) };
  } catch (error) {
    console.error("Couldn't create the sale checkout", sale.id, kind, error);
    if (error instanceof WhopError && error.status >= 400 && error.status < 500) {
      throw new CheckoutError(error.whopMessage || `Whop refused the checkout (error ${error.status}).`, true);
    }
    throw new CheckoutError("Couldn't reach Whop.", false);
  }
}
