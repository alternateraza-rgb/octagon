// A live snapshot of the signed-in account for Octa's instructions: plan and usage, every site with
// its status and address, sales, leads and recent chats. Rebuilt on every chat message, so Octa's
// answers match what the dashboard shows right now. Every query is scoped to this one user.
import { getAccess, getUsage } from "@/lib/billing/entitlements";
import { METER_LABEL, formatBytes, planById, type Meter } from "@/lib/billing/plans";
import { siteUrl } from "@/lib/deploy/sites";
import { CAN_SELL } from "@/lib/sales/store";
import { money, sellerShare } from "@/lib/sales/money";
import { getOnboarding } from "@/lib/onboarding/store";
import { STEPS } from "@/lib/onboarding/steps";

type User = { id: string; email: string; name: string };

type SiteRow = {
  id: string;
  title: string | null;
  prompt: string;
  status: string;
  slug: string | null;
  deployedVersionId: string | null;
  latestVersionId: string | null;
  pausedAt: number | null;
  sold: number;
  versions: number;
  latestSummary: string | null;
  lastDeployedAt: number | null;
  domains: string | null;
  createdAt: number;
  updatedAt: number;
};

type SaleRow = {
  siteTitle: string | null;
  buyerName: string;
  buyerEmail: string;
  priceCents: number;
  monthlyCents: number | null;
  currency: string;
  status: string;
  hostingStatus: string;
  viewedAt: number | null;
  paidAt: number | null;
  expiresAt: number;
  createdAt: number;
};

type LeadRow = { name: string; category: string | null; address: string | null; rating: number | null; reviewCount: number; webPresence: string; score: number; status: string; siteTitle: string | null };

// Keeps the snapshot to a few thousand tokens even for agency-sized accounts.
const MAX_SITES = 60;
const MAX_SALES = 40;
const MAX_LEADS = 10;
const EXCERPT_CHARS = 4000;

const date = (ms: number | null | undefined) =>
  ms ? new Date(ms).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }) : "—";
const clip = (text: string, n: number) => {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > n ? `${flat.slice(0, n - 1)}…` : flat;
};
const name = (title: string | null) => title ?? "Untitled site";

function siteState(s: SiteRow) {
  if (s.status === "generating") return Date.now() - s.updatedAt > 3 * 60 * 1000 ? "build interrupted" : "building now";
  if (s.status === "failed" && !s.latestVersionId) return "build failed";
  if (!s.deployedVersionId) return "draft (never published)";
  if (s.pausedAt) return `paused since ${date(s.pausedAt)} (plan ended)`;
  return s.latestVersionId !== s.deployedVersionId ? "live, with unpublished edits" : "live";
}

function saleState(s: SaleRow) {
  if (s.status === "paid") {
    const hosting = s.monthlyCents ? `; hosting ${s.hostingStatus === "active" ? "active" : s.hostingStatus === "ended" ? "ended" : "not started"}` : "";
    return `paid ${date(s.paidAt)}${hosting}`;
  }
  if (s.status === "canceled") return "canceled";
  if (s.expiresAt < Date.now()) return `link expired ${date(s.expiresAt)}`;
  return s.status === "viewed" ? `opened by buyer ${date(s.viewedAt)}, not paid yet` : "sent, not opened yet";
}

export async function accountSnapshot(env: CloudflareEnv, user: User) {
  const db = env.DB;
  const access = await getAccess(env, user);
  const [usage, onboarding, batch] = await Promise.all([
    getUsage(db, user.id, access.periodStart),
    getOnboarding(db, user.id),
    db.batch([
      db
        .prepare(
          `select s.id, s.title, s.prompt, s.status, s.slug, s.deployedVersionId, s.pausedAt, s.ownerId is not null as sold, s.createdAt, s.updatedAt,
             (select count(*) from site_version v where v.siteId = s.id) as versions,
             (select v.id from site_version v where v.siteId = s.id order by v.createdAt desc limit 1) as latestVersionId,
             (select v.summary from site_version v where v.siteId = s.id order by v.createdAt desc limit 1) as latestSummary,
             (select max(d.createdAt) from deployment d where d.siteId = s.id) as lastDeployedAt,
             (select group_concat(c.hostname || ' (' || c.status || ')', ', ') from custom_domain c where c.siteId = s.id) as domains
           from site s where s.userId = ? order by s.updatedAt desc limit ?`,
        )
        .bind(user.id, MAX_SITES),
      db.prepare(`select count(*) as n from site where userId = ?`).bind(user.id),
      db
        .prepare(
          `select site.title as siteTitle, sale.buyerName, sale.buyerEmail, sale.priceCents, sale.monthlyCents, sale.currency, sale.status,
             sale.hostingStatus, sale.viewedAt, sale.paidAt, sale.expiresAt, sale.createdAt
           from sale join site on site.id = sale.siteId where sale.sellerId = ? order by sale.createdAt desc limit ?`,
        )
        .bind(user.id, MAX_SALES),
      db.prepare(`select verification from seller_account where userId = ?`).bind(user.id),
      db.prepare(`select status, count(*) as n from lead where userId = ? group by status`).bind(user.id),
      db
        .prepare(
          `select l.name, l.category, l.address, l.rating, l.reviewCount, l.webPresence, l.score, l.status, s.title as siteTitle
           from lead l left join site s on s.id = l.siteId where l.userId = ? and l.status != 'dismissed'
           order by l.score desc, l.createdAt desc limit ?`,
        )
        .bind(user.id, MAX_LEADS),
      db
        .prepare(`select niche, location, found, qualified, added, createdAt from agent_search where userId = ? order by createdAt desc limit 5`)
        .bind(user.id),
      db.prepare(`select title, updatedAt from conversation where userId = ? order by updatedAt desc limit 8`).bind(user.id),
      db.prepare(`select createdAt from user where id = ?`).bind(user.id),
    ]),
  ]);

  const [sitesRes, siteCountRes, salesRes, sellerRes, leadCountRes, leadsRes, searchesRes, chatsRes, userRes] = batch;
  const sites = sitesRes.results as SiteRow[];
  const siteCount = (siteCountRes.results[0] as { n: number }).n;
  const sales = salesRes.results as SaleRow[];
  const seller = sellerRes.results[0] as { verification: string } | undefined;
  const leadCounts = leadCountRes.results as { status: string; n: number }[];
  const leads = leadsRes.results as LeadRow[];
  const searches = searchesRes.results as { niche: string; location: string; found: number; qualified: number; added: number; createdAt: number }[];
  const chats = chatsRes.results as { title: string; updatedAt: number }[];
  const joined = (userRes.results[0] as { createdAt: string | number } | undefined)?.createdAt;

  const lines: string[] = [];
  const now = new Date();
  lines.push(`# This account (live as of ${now.toUTCString()})`);
  lines.push(`- Name: ${user.name || "—"} · Email: ${user.email} · Joined ${date(joined ? new Date(joined).getTime() : null)}`);

  // Plan and usage.
  const plan = planById(access.plan);
  if (access.comped) lines.push("- Plan: complimentary team account with every Agency feature.");
  else if (access.active && plan) {
    const renew = access.cancelAtPeriodEnd ? `cancels ${date(access.periodEnd)}` : access.periodEnd && access.periodEnd > Date.now() ? `renews ${date(access.periodEnd)}` : "";
    lines.push(`- Plan: ${plan.name}, billed ${access.interval === "year" ? "yearly" : "monthly"} (status ${access.status}${renew ? `, ${renew}` : ""}).`);
  } else if (access.pausesAt) {
    lines.push(`- Plan: none — the previous plan ended. Live sites ${access.pausesAt > Date.now() ? `pause on ${date(access.pausesAt)}` : "are paused"} unless they renew.`);
  } else lines.push("- Plan: none yet. They need to choose a plan in Settings › Billing to build and chat.");
  if (access.limits) {
    const meters: Meter[] = ["builds", "chat", "sites", "storage", "leads"];
    const used = meters.map((m) => {
      const fmt = (n: number) => (m === "storage" ? formatBytes(n) : n.toLocaleString("en-US"));
      return `${METER_LABEL[m].many}: ${fmt(usage[m])} of ${fmt(access.limits![m])}`;
    });
    lines.push(`- Usage this month${access.usageResetsAt ? ` (resets ${date(access.usageResetsAt)})` : ""}: ${used.join("; ")}.`);
  }

  // Getting started.
  const todo = STEPS.filter((s) => !onboarding.steps[s.id]);
  lines.push(
    todo.length
      ? `- Getting started: ${STEPS.length - todo.length} of ${STEPS.length} done. Next: ${todo.map((s) => s.title).join(" → ")}.`
      : "- Getting started: all steps done.",
  );

  // Websites.
  const live = sites.filter((s) => s.deployedVersionId && !s.pausedAt).length;
  lines.push("", `## Websites (${siteCount} total, ${live} live${siteCount > sites.length ? `; the ${sites.length} most recently edited are listed` : ""})`);
  if (!sites.length) lines.push("No websites yet.");
  for (const s of sites) {
    const parts = [
      `**${name(s.title)}** — ${siteState(s)}`,
      s.slug ? `address ${siteUrl(env, s.slug)}` : "",
      s.domains ? `custom domains: ${s.domains}` : "",
      s.sold ? "sold (the client owns it)" : "",
      `${s.versions} version${s.versions === 1 ? "" : "s"}`,
      s.lastDeployedAt ? `last published ${date(s.lastDeployedAt)}` : "",
      `created ${date(s.createdAt)}, last edited ${date(s.updatedAt)}`,
      `editor: /dashboard/sites/${s.id}`,
    ].filter(Boolean);
    lines.push(`- ${parts.join(" · ")}`);
    lines.push(`  - Brief: ${clip(s.prompt, 220)}`);
    if (s.latestSummary) lines.push(`  - Latest change: ${clip(s.latestSummary, 260)}`);
  }

  // Sales.
  const payouts = seller ? (CAN_SELL.has(seller.verification) ? `connected (verification ${seller.verification})` : `started, verification ${seller.verification}`) : "not set up";
  const paid = sales.filter((s) => s.status === "paid");
  const earned = paid.reduce((sum, s) => sum + sellerShare(s.priceCents), 0);
  const hosting = paid.filter((s) => s.hostingStatus === "active" && s.monthlyCents).reduce((sum, s) => sum + sellerShare(s.monthlyCents!), 0);
  lines.push("", "## Sales", `- Payouts: ${payouts}.`);
  if (paid.length) lines.push(`- ${paid.length} paid sale${paid.length === 1 ? "" : "s"}; ${money(earned)} earned from site prices after Octacore's fee; ${money(hosting)}/month from active client hosting after the fee.`);
  if (!sales.length) lines.push("- No checkout links sent yet.");
  for (const s of sales) {
    const monthly = s.monthlyCents ? ` + ${money(s.monthlyCents, s.currency)}/month hosting` : "";
    lines.push(`- ${name(s.siteTitle)} → ${s.buyerName} <${s.buyerEmail}>: ${money(s.priceCents, s.currency)}${monthly} · ${saleState(s)} · sent ${date(s.createdAt)}`);
  }

  // Leads, only when the account has used Lead Finder.
  if (leadCounts.length || searches.length) {
    const counts = leadCounts.map((c) => `${c.n} ${c.status}`).join(", ");
    lines.push("", `## Leads (${counts || "none"})`);
    for (const q of searches) lines.push(`- Search "${q.niche}" in ${q.location} on ${date(q.createdAt)}: ${q.found} found, ${q.qualified} qualified, ${q.added} new.`);
    for (const l of leads) {
      const rating = l.rating ? `${l.rating}★ (${l.reviewCount})` : "no rating";
      const web = l.webPresence === "social" ? "social page only" : "no website";
      lines.push(`- ${l.name}${l.category ? ` (${l.category})` : ""}, ${l.address ?? "no address"} · ${rating} · ${web} · score ${l.score} · ${l.status}${l.siteTitle ? ` · site: ${l.siteTitle}` : ""}`);
    }
  }

  if (chats.length) lines.push("", "## Recent chats with Octa", ...chats.map((c) => `- ${clip(c.title, 70)} (${date(c.updatedAt)})`));

  return { text: lines.join("\n"), sites };
}

// The text of the sites the user is asking about, so Octa can answer about their content: any site
// named in the message, or their only site when they say "my site".
export async function siteExcerpts(db: D1Database, sites: SiteRow[], message: string) {
  const text = message.toLowerCase();
  const named = sites.filter((s) => {
    const title = s.title?.toLowerCase().trim();
    return (title && title.length >= 3 && text.includes(title)) || (s.slug && text.includes(s.slug));
  });
  const picked = named.length ? named.slice(0, 2) : sites.length === 1 && /\b(my|the|our)\s+(web)?site\b/.test(text) ? sites : [];
  const excerpts: string[] = [];
  for (const s of picked) {
    if (!s.latestVersionId) continue;
    const row = await db.prepare(`select html from site_version where id = ?`).bind(s.latestVersionId).first<{ html: string }>();
    if (!row) continue;
    excerpts.push(`## Text of "${name(s.title)}" (latest version)\n${htmlToText(row.html).slice(0, EXCERPT_CHARS)}`);
  }
  return excerpts.length ? `# Site content\n${excerpts.join("\n\n")}` : "";
}

// Readable text of a generated page: its title, description, then visible copy.
function htmlToText(html: string) {
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "";
  const description = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)?.[1] ?? "";
  const body = html
    .replace(/<head[\s\S]*?<\/head>/gi, " ")
    .replace(/<(script|style|svg|noscript)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(h[1-6]|p|li|section|header|footer|nav|div|br|tr|a|button)\b[^>]*>/gi, " | ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/(\s*\|\s*)+/g, " | ")
    .replace(/\s+/g, " ")
    .trim();
  return [title && `Title: ${title}`, description && `Description: ${description}`, body].filter(Boolean).join("\n");
}
