import { sendEmail } from "@/lib/email/send";
import { saleInviteEmail } from "@/lib/email/templates";
import type { SaleView } from "./store";

export const inviteUrl = (token: string) => `https://octacore.app/buy/${token}`;

export function sendInvite(env: CloudflareEnv, sale: SaleView) {
  return sendEmail(
    env,
    saleInviteEmail({
      to: sale.buyerEmail,
      buyerName: sale.buyerName,
      sellerName: sale.sellerName,
      siteTitle: sale.siteTitle ?? "your business",
      message: sale.message,
      priceCents: sale.priceCents,
      monthlyCents: sale.monthlyCents,
      url: inviteUrl(sale.token),
    }),
  );
}

// What the seller's dashboard gets about a sale (never the checkout internals).
export function publicSale(sale: SaleView) {
  return {
    id: sale.id,
    siteId: sale.siteId,
    siteTitle: sale.siteTitle,
    buyerEmail: sale.buyerEmail,
    buyerName: sale.buyerName,
    message: sale.message,
    priceCents: sale.priceCents,
    monthlyCents: sale.monthlyCents,
    status: sale.status !== "paid" && sale.expiresAt < Date.now() ? ("expired" as const) : sale.status,
    hostingStatus: sale.hostingStatus,
    url: inviteUrl(sale.token),
    viewedAt: sale.viewedAt,
    paidAt: sale.paidAt,
    createdAt: sale.createdAt,
  };
}
export type PublicSale = ReturnType<typeof publicSale>;
