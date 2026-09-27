// Invites to buy a site, and the connected Whop accounts sellers are paid through.

export type SaleStatus = "sent" | "viewed" | "paid" | "canceled";
export type HostingStatus = "none" | "active" | "ended";

export type Sale = {
  id: string;
  siteId: string;
  sellerId: string;
  token: string;
  buyerEmail: string;
  buyerName: string;
  message: string | null;
  priceCents: number;
  monthlyCents: number | null;
  currency: string;
  status: SaleStatus;
  siteCheckoutId: string | null;
  hostingCheckoutId: string | null;
  hostingMembershipId: string | null;
  hostingStatus: HostingStatus;
  manageUrl: string | null;
  viewedAt: number | null;
  paidAt: number | null;
  expiresAt: number;
  createdAt: number;
  updatedAt: number;
};

// A sale with what the invite page and lists show about it.
export type SaleView = Sale & {
  siteTitle: string | null;
  siteSlug: string | null;
  sellerName: string;
  sellerEmail: string;
};

export type Seller = { userId: string; whopAccountId: string; verification: string; createdAt: number; updatedAt: number };

const DAY = 24 * 60 * 60 * 1000;
export const INVITE_DAYS = 30;

// Whop verification states in which a seller can take payments (money waits while under review).
export const CAN_SELL = new Set(["pending", "manual_review", "approved"]);

const VIEW = `select sale.*, site.title as siteTitle, site.slug as siteSlug, u.name as sellerName, u.email as sellerEmail
  from sale join site on site.id = sale.siteId join user u on u.id = sale.sellerId`;

// 32 random bytes, base64url: the invite link's only secret.
function newToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function getSeller(db: D1Database, userId: string) {
  return db.prepare(`select * from seller_account where userId = ?`).bind(userId).first<Seller>();
}

export async function saveSeller(db: D1Database, userId: string, whopAccountId: string, verification: string) {
  const now = Date.now();
  await db
    .prepare(
      `insert into seller_account (userId, whopAccountId, verification, createdAt, updatedAt) values (?, ?, ?, ?, ?)
       on conflict (userId) do update set whopAccountId = excluded.whopAccountId, verification = excluded.verification, updatedAt = excluded.updatedAt`,
    )
    .bind(userId, whopAccountId, verification, now, now)
    .run();
}

export async function createSale(
  db: D1Database,
  input: {
    siteId: string;
    sellerId: string;
    buyerEmail: string;
    buyerName: string;
    message: string | null;
    priceCents: number;
    monthlyCents: number | null;
  },
) {
  const id = crypto.randomUUID();
  const now = Date.now();
  await db
    .prepare(
      `insert into sale (id, siteId, sellerId, token, buyerEmail, buyerName, message, priceCents, monthlyCents, status, expiresAt, createdAt, updatedAt)
       values (?, ?, ?, ?, ?, ?, ?, ?, ?, 'sent', ?, ?, ?)`,
    )
    .bind(
      id,
      input.siteId,
      input.sellerId,
      newToken(),
      input.buyerEmail,
      input.buyerName,
      input.message,
      input.priceCents,
      input.monthlyCents,
      now + INVITE_DAYS * DAY,
      now,
      now,
    )
    .run();
  return (await getSaleView(db, id))!;
}

export function getSaleView(db: D1Database, id: string) {
  return db.prepare(`${VIEW} where sale.id = ?`).bind(id).first<SaleView>();
}

export function getSaleByToken(db: D1Database, token: string) {
  if (!/^[\w-]{20,64}$/.test(token)) return Promise.resolve(null);
  return db.prepare(`${VIEW} where sale.token = ?`).bind(token).first<SaleView>();
}

export function getSaleByMembership(db: D1Database, membershipId: string) {
  return db.prepare(`${VIEW} where sale.hostingMembershipId = ?`).bind(membershipId).first<SaleView>();
}

export async function listSales(db: D1Database, sellerId: string) {
  const { results } = await db.prepare(`${VIEW} where sale.sellerId = ? order by sale.createdAt desc limit 200`).bind(sellerId).all<SaleView>();
  return results;
}

// The invite a site is currently offered with, or its completed sale.
export function currentSale(db: D1Database, siteId: string) {
  return db
    .prepare(`${VIEW} where sale.siteId = ? and sale.status != 'canceled' order by sale.createdAt desc limit 1`)
    .bind(siteId)
    .first<SaleView>();
}

export const isExpired = (sale: Sale) => sale.status !== "paid" && sale.expiresAt < Date.now();

export async function cancelSale(db: D1Database, id: string, sellerId: string) {
  const res = await db
    .prepare(`update sale set status = 'canceled', updatedAt = ? where id = ? and sellerId = ? and status != 'paid'`)
    .bind(Date.now(), id, sellerId)
    .run();
  return res.meta.changes > 0;
}

// Pushes an invite's expiry out again, e.g. when it's re-sent.
export async function renewInvite(db: D1Database, id: string) {
  const now = Date.now();
  await db.prepare(`update sale set expiresAt = ?, updatedAt = ? where id = ?`).bind(now + INVITE_DAYS * DAY, now, id).run();
}

// True the first time an invite is opened.
export async function markViewed(db: D1Database, id: string) {
  const now = Date.now();
  const res = await db
    .prepare(`update sale set status = 'viewed', viewedAt = ?, updatedAt = ? where id = ? and status = 'sent'`)
    .bind(now, now, id)
    .run();
  return res.meta.changes > 0;
}

export async function setCheckout(db: D1Database, id: string, kind: "site" | "hosting", checkoutId: string) {
  const column = kind === "site" ? "siteCheckoutId" : "hostingCheckoutId";
  await db.prepare(`update sale set ${column} = ?, updatedAt = ? where id = ?`).bind(checkoutId, Date.now(), id).run();
}
