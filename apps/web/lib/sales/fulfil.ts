// What happens once a client pays: they become the site's owner, the site goes live, and both
// sides hear about it. Called from Whop's webhook and from the invite page (which asks Whop
// directly, so a sale completes even if the webhook is slow). Every step is safe to repeat.
import { createAuth } from "@/lib/auth/auth";
import { PAUSED_PAGE } from "@/lib/billing/site-access";
import { getMembership, listCheckoutPayments, type WhopPayment } from "@/lib/billing/whop";
import { deployVersion, publish } from "@/lib/deploy/sites";
import { sendEmail } from "@/lib/email/send";
import { saleSoldEmail } from "@/lib/email/templates";
import { getLatestVersion } from "@/lib/sites/store";
import { sellerShare } from "./money";
import { getSaleView, getSeller, type SaleView } from "./store";

const ORIGIN = "https://octacore.app";

export const isPaid = (p: WhopPayment) => p.status === "paid" || p.substatus === "succeeded" || !!p.paid_at;

// The client's Octacore account: their existing one, or a new owner account for their email.
async function ensureOwner(db: D1Database, email: string, name: string) {
  const existing = await db.prepare(`select id from user where lower(email) = lower(?)`).bind(email).first<{ id: string }>();
  if (existing) return existing.id;
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  // Straight into the table, not through sign-up: owners get the ownership email, not the builder welcome.
  await db
    .prepare(`insert into user (id, name, email, emailVerified, createdAt, updatedAt, role) values (?, ?, ?, 1, ?, ?, 'owner')`)
    .bind(id, name, email.toLowerCase(), now, now)
    .run();
  return id;
}

// Deploys the site's latest version if it isn't live, or brings it back if it was paused.
async function putLive(env: CloudflareEnv, siteId: string) {
  const site = await env.DB.prepare(`select id, slug, title, deployedVersionId, pausedAt from site where id = ?`)
    .bind(siteId)
    .first<{ id: string; slug: string | null; title: string | null; deployedVersionId: string | null; pausedAt: number | null }>();
  if (!site) return;
  if (site.deployedVersionId && site.slug) {
    if (!site.pausedAt) return;
    const version = await env.DB.prepare(`select html from site_version where id = ?`)
      .bind(site.deployedVersionId)
      .first<{ html: string }>();
    if (version) await publish(env, site.slug, version.html);
    await env.DB.prepare(`update site set pausedAt = null where id = ?`).bind(site.id).run();
    return;
  }
  const latest = await getLatestVersion(env.DB, site.id);
  if (latest) await deployVersion(env, site, latest.id, latest.html);
}

async function takeDown(env: CloudflareEnv, siteId: string) {
  const site = await env.DB.prepare(`select slug from site where id = ? and slug is not null and deployedVersionId is not null`)
    .bind(siteId)
    .first<{ slug: string }>();
  if (!site) return;
  await publish(env, site.slug, PAUSED_PAGE);
  await env.DB.prepare(`update site set pausedAt = ? where id = ?`).bind(Date.now(), siteId).run();
}

// The client paid for the site. Returns false when it had already been recorded.
export async function completeSitePayment(env: CloudflareEnv, sale: SaleView) {
  const now = Date.now();
  const res = await env.DB.prepare(`update sale set status = 'paid', paidAt = ?, updatedAt = ? where id = ? and status != 'paid'`)
    .bind(now, now, sale.id)
    .run();
  if (!res.meta.changes) return false;

  const ownerId = await ensureOwner(env.DB, sale.buyerEmail, sale.buyerName);
  await env.DB.prepare(`update site set ownerId = ?, saleId = ?, updatedAt = ? where id = ?`).bind(ownerId, sale.id, now, sale.siteId).run();
  // Without a hosting fee the site goes live straight away, on the seller's plan like their other
  // sites. With one, it goes live once the client starts hosting.
  if (!sale.monthlyCents) await putLive(env, sale.siteId);

  // The ownership email is the sign-in link itself (see the magic-link sender in lib/auth/auth.ts).
  await createAuth(env)
    .api.signInMagicLink({
      body: {
        email: sale.buyerEmail,
        callbackURL: `${ORIGIN}/owner`,
        errorCallbackURL: `${ORIGIN}/owner/sign-in?error=expired`,
        metadata: { saleId: sale.id },
      },
      // No browser request here: the link's host falls back to octacore.app (see baseURL in auth.ts).
      headers: new Headers(),
    })
    .catch((error) => console.error("Couldn't send the ownership email", sale.id, error));
  await sendEmail(
    env,
    saleSoldEmail({
      to: sale.sellerEmail,
      name: sale.sellerName,
      buyerName: sale.buyerName,
      siteTitle: sale.siteTitle ?? "your site",
      earnedCents: sellerShare(sale.priceCents),
    }),
  );
  return true;
}

// Hosting started or renewed: keep the site up.
export async function activateHosting(
  env: CloudflareEnv,
  sale: SaleView,
  membership: { id: string; manage_url?: string | null } | null,
) {
  // A payment only names its membership; the membership has the client's billing link.
  if (membership && !membership.manage_url) {
    membership = await getMembership(env, membership.id).catch(() => membership);
  }
  await env.DB.prepare(
    `update sale set hostingStatus = 'active', hostingMembershipId = coalesce(?, hostingMembershipId),
       manageUrl = coalesce(?, manageUrl), updatedAt = ? where id = ?`,
  )
    .bind(membership?.id ?? null, membership?.manage_url ?? null, Date.now(), sale.id)
    .run();
  await putLive(env, sale.siteId);
}

// Hosting ended (canceled, or payments stopped): the site shows the paused page.
export async function endHosting(env: CloudflareEnv, sale: SaleView) {
  if (sale.hostingStatus === "ended") return;
  await env.DB.prepare(`update sale set hostingStatus = 'ended', updatedAt = ? where id = ?`).bind(Date.now(), sale.id).run();
  await takeDown(env, sale.siteId);
}

// Asks Whop whether the invite's checkouts have been paid, and records any payment the webhook
// hasn't delivered yet. Returns the sale as it stands afterwards.
export async function reconcile(env: CloudflareEnv, sale: SaleView) {
  const seller = await getSeller(env.DB, sale.sellerId);
  if (!seller) return sale;
  const forThisSale = (p: WhopPayment) => !p.metadata?.saleId || p.metadata.saleId === sale.id;
  try {
    if (sale.status !== "paid" && sale.siteCheckoutId) {
      const payments = await listCheckoutPayments(env, seller.whopAccountId, sale.siteCheckoutId);
      if (payments.some((p) => isPaid(p) && forThisSale(p))) await completeSitePayment(env, sale);
    }
    if (sale.monthlyCents && sale.hostingStatus === "none" && sale.hostingCheckoutId) {
      const paid = (await listCheckoutPayments(env, seller.whopAccountId, sale.hostingCheckoutId)).find(
        (p) => isPaid(p) && forThisSale(p),
      );
      if (paid) await activateHosting(env, (await getSaleView(env.DB, sale.id))!, paid.membership ?? null);
    }
  } catch (error) {
    console.error("Couldn't check the sale's payments with Whop", sale.id, error);
  }
  return (await getSaleView(env.DB, sale.id))!;
}
