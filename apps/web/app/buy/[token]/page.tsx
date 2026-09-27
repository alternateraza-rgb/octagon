import type { Metadata } from "next";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { BuyView, InviteStatus } from "@/components/sales/buy-view";
import { getSession } from "@/lib/auth/server";
import { sendEmail } from "@/lib/email/send";
import { saleViewedEmail } from "@/lib/email/templates";
import { getSaleByToken, isExpired, markViewed } from "@/lib/sales/store";

export const metadata: Metadata = { title: "Your new website", robots: { index: false, follow: false } };

// Public: where an invite link lands. The client sees their site full-screen and can buy it.
export default async function BuyPage({ params, searchParams }: PageProps<"/buy/[token]">) {
  const [{ token }, { paid }] = await Promise.all([params, searchParams]);
  const { env, ctx } = await getCloudflareContext({ async: true });
  const sale = await getSaleByToken(env.DB, token);
  if (!sale || sale.status === "canceled") return <InviteStatus kind="gone" />;
  if (isExpired(sale)) return <InviteStatus kind="expired" sellerName={sale.sellerName} sellerEmail={sale.sellerEmail} />;

  // The first time the client (not the seller checking their own link) opens it, tell the seller.
  const session = await getSession();
  if (session?.user.id !== sale.sellerId && (await markViewed(env.DB, sale.id))) {
    ctx.waitUntil(
      sendEmail(
        env,
        saleViewedEmail({ to: sale.sellerEmail, name: sale.sellerName, buyerName: sale.buyerName, siteTitle: sale.siteTitle ?? "your site" }),
      ),
    );
  }

  return (
    <BuyView
      token={token}
      returning={typeof paid === "string"}
      sale={{
        siteTitle: sale.siteTitle ?? "Your website",
        sellerName: sale.sellerName,
        buyerName: sale.buyerName,
        buyerEmail: sale.buyerEmail,
        message: sale.message,
        priceCents: sale.priceCents,
        monthlyCents: sale.monthlyCents,
        currency: sale.currency,
        status: sale.status,
        hostingStatus: sale.hostingStatus,
      }}
    />
  );
}
