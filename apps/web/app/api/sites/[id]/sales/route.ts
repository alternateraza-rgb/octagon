import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getSession } from "@/lib/auth/server";
import { checkLimit } from "@/lib/billing/entitlements";
import { publicSale, sendInvite } from "@/lib/sales/invite";
import { MONTHLY_RANGE, PRICE_RANGE, money, parsePrice } from "@/lib/sales/money";
import { sellerStatus } from "@/lib/sales/seller";
import { createSale, currentSale, isExpired } from "@/lib/sales/store";
import { getSite } from "@/lib/sites/store";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// The site's open invite or completed sale, for the Sell sheet.
export async function GET(_request: Request, { params }: RouteContext<"/api/sites/[id]/sales">) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Log in first." }, { status: 401 });
  const { id } = await params;
  const { env } = await getCloudflareContext({ async: true });
  if (!(await getSite(env.DB, id, session.user.id))) return Response.json({ error: "Site not found." }, { status: 404 });
  const [sale, seller] = await Promise.all([currentSale(env.DB, id), sellerStatus(env, session.user.id)]);
  return Response.json({
    sale: sale && (sale.status === "paid" || !isExpired(sale)) ? publicSale(sale) : null,
    seller: seller && { verification: seller.verification, canSell: seller.canSell },
  });
}

// Invites a client to buy the site: records the sale and emails them the link.
export async function POST(request: Request, { params }: RouteContext<"/api/sites/[id]/sales">) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Log in first." }, { status: 401 });
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const buyerEmail = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const buyerName = typeof body.name === "string" ? body.name.replace(/\s+/g, " ").trim().slice(0, 80) : "";
  const message = typeof body.message === "string" ? body.message.trim().slice(0, 600) || null : null;
  const priceCents = parsePrice(body.price);
  const monthlyCents = body.monthly === null || body.monthly === undefined || body.monthly === "" ? null : parsePrice(body.monthly);

  if (!EMAIL.test(buyerEmail)) return Response.json({ error: "Enter your client's email address." }, { status: 400 });
  if (buyerEmail === session.user.email.toLowerCase()) return Response.json({ error: "Use your client's email, not your own." }, { status: 400 });
  if (!buyerName) return Response.json({ error: "Enter your client's name." }, { status: 400 });
  if (priceCents === null || priceCents < PRICE_RANGE.min || priceCents > PRICE_RANGE.max)
    return Response.json({ error: `Set a price between ${money(PRICE_RANGE.min)} and ${money(PRICE_RANGE.max)}.` }, { status: 400 });
  if (monthlyCents !== null && (monthlyCents < MONTHLY_RANGE.min || monthlyCents > MONTHLY_RANGE.max))
    return Response.json({ error: `Set monthly hosting between ${money(MONTHLY_RANGE.min)} and ${money(MONTHLY_RANGE.max)}.` }, { status: 400 });

  const { env } = await getCloudflareContext({ async: true });
  const site = await getSite(env.DB, id, session.user.id);
  if (!site) return Response.json({ error: "Site not found." }, { status: 404 });
  if (!site.latestVersionId) return Response.json({ error: "Build the site before selling it." }, { status: 400 });
  // Selling needs an active plan (it doesn't use up anything on it).
  const refused = await checkLimit(env, session.user, "sites", 0);
  if (refused) return refused;
  const seller = await sellerStatus(env, session.user.id);
  if (!seller?.canSell)
    return Response.json({ error: "Set up payouts before you sell.", needsPayouts: true }, { status: 409 });

  const existing = await currentSale(env.DB, id);
  if (existing?.status === "paid") return Response.json({ error: "This site has already been sold." }, { status: 409 });
  if (existing && !isExpired(existing))
    return Response.json({ error: "This site already has an open invite. Cancel it to send a new one." }, { status: 409 });

  const sale = await createSale(env.DB, { siteId: id, sellerId: session.user.id, buyerEmail, buyerName, message, priceCents, monthlyCents });
  if (!(await sendInvite(env, sale))) {
    return Response.json({ sale: publicSale(sale), warning: "The invite was saved, but the email didn't send. Copy the link and share it yourself." });
  }
  return Response.json({ sale: publicSale(sale) });
}
