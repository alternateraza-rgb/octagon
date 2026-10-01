// A user's businesses: the ones they picked from a search (and the ones they skipped, so those never
// come back). Facts about the business live in the shared business table (lib/agents/business.ts);
// a lead keeps a snapshot for the list, plus the user's own corrections, notes and progress.
import type { Business, Confidence, ContactStatus } from "./business";
import type { SequenceStatus } from "@/lib/outreach/store";
import type { Blocks } from "./inject";
import type { Country, PlaceDetails } from "./places";
import { qualify, score, type ScoredPlace, type WebPresence } from "./score";

export type LeadStatus = "saved" | "dismissed" | "built";
export type LeadStage = "added" | "built" | "emailed" | "replied";

export type Lead = {
  id: string;
  placeId: string;
  name: string;
  category: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: Country;
  rating: number | null;
  reviewCount: number;
  webPresence: WebPresence;
  socialUrl: string | null;
  mapsUrl: string | null;
  photoUrl: string | null;
  snippet: string | null;
  score: number;
  reasons: string[];
  status: LeadStatus;
  stage: LeadStage;
  siteId: string | null;
  email: string | null;
  emailSource: string | null;
  emailConfidence: Confidence | null;
  // 'found' also covers an email the user typed in themselves.
  contactStatus: ContactStatus;
  emailEdited: boolean;
  notes: string | null;
  // Where the email sequence to this business is, if there is one.
  outreach: SequenceStatus | null;
  createdAt: number;
};

type LeadRow = Omit<Lead, "reasons" | "emailEdited" | "contactStatus"> & {
  reasons: string;
  emailOverride: string | null;
  contactStatus: ContactStatus | null;
};

// The user's corrections win over the hunt; a lead from before the shared table has no business row.
const SELECT = `select l.id, l.placeId, l.name, l.category, coalesce(l.phoneOverride, b.phone, l.phone) as phone, l.address,
  coalesce(l.city, b.city) as city, l.country, coalesce(b.rating, l.rating) as rating,
  max(coalesce(b.reviewCount, 0), l.reviewCount) as reviewCount, l.webPresence, l.socialUrl, l.mapsUrl,
  coalesce(l.photoUrl, b.photoUrl) as photoUrl, coalesce(l.snippet, b.snippet) as snippet, l.score, l.reasons, l.status,
  l.stage, l.siteId, l.notes, l.createdAt, l.emailOverride, coalesce(l.emailOverride, b.email) as email,
  case when l.emailOverride is not null then null else b.emailSource end as emailSource,
  case when l.emailOverride is not null then null else b.emailConfidence end as emailConfidence,
  case when l.emailOverride is not null then 'found' else b.contactStatus end as contactStatus,
  (select q.status from sequence q where q.leadId = l.id) as outreach
  from lead l left join business b on b.placeId = l.placeId`;

const parse = ({ reasons, emailOverride, contactStatus, ...row }: LeadRow): Lead => ({
  ...row,
  reasons: JSON.parse(reasons) as string[],
  emailEdited: emailOverride !== null,
  contactStatus: contactStatus ?? "none",
});

export async function createSearch(
  db: D1Database,
  userId: string,
  search: { niche: string; location: string; country: Country; found: number; qualified: number },
) {
  const id = crypto.randomUUID();
  await db
    .prepare(
      `insert into agent_search (id, userId, niche, location, country, found, qualified, createdAt) values (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(id, userId, search.niche, search.location, search.country, search.found, search.qualified, Date.now())
    .run();
  return id;
}

export function updateSearchCounts(db: D1Database, id: string, found: number, qualified: number) {
  return db.prepare(`update agent_search set found = ?, qualified = ? where id = ?`).bind(found, qualified, id).run();
}

export async function getSearch(db: D1Database, id: string, userId: string) {
  return db
    .prepare(`select id, niche, location, country from agent_search where id = ? and userId = ?`)
    .bind(id, userId)
    .first<{ id: string; niche: string; location: string; country: Country }>();
}

// Records a pick ('saved') or a skip ('dismissed'). A business already in the user's list keeps its row.
export async function decide(
  db: D1Database,
  userId: string,
  searchId: string | null,
  b: Business,
  s: ScoredPlace,
  status: "saved" | "dismissed",
) {
  const now = Date.now();
  await db
    .prepare(
      `insert into lead (id, userId, searchId, placeId, name, category, phone, address, city, country, rating, reviewCount,
         webPresence, socialUrl, mapsUrl, photoUrl, snippet, score, reasons, status, stage, snapshotAt, createdAt)
       values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'added', ?, ?)
       on conflict (userId, placeId) do update set status = case when lead.status = 'built' then 'built' else excluded.status end`,
    )
    .bind(
      crypto.randomUUID(),
      userId,
      searchId,
      b.placeId,
      b.name,
      b.category,
      b.phone,
      b.address,
      b.city,
      b.country,
      b.rating,
      b.reviewCount,
      s.webPresence,
      s.socialUrl,
      b.mapsUrl,
      b.photoUrl,
      b.snippet,
      s.score,
      JSON.stringify(s.reasons),
      status,
      now,
      now,
    )
    .run();
  if (status === "saved" && searchId) {
    await db.prepare(`update agent_search set added = added + 1 where id = ?`).bind(searchId).run();
  }
  const row = await db.prepare(`${SELECT} where l.userId = ? and l.placeId = ?`).bind(userId, b.placeId).first<LeadRow>();
  return row ? parse(row) : null;
}

// Updates a lead from fresh details. Returns false when the business no longer qualifies (it closed,
// or now has a website).
export async function refreshLead(db: D1Database, userId: string, details: PlaceDetails) {
  const q = qualify(details);
  if (!q) return false;
  const s = score(q);
  await db
    .prepare(
      `update lead set name = ?, category = ?, address = ?, rating = ?, reviewCount = ?, webPresence = ?, socialUrl = ?,
         mapsUrl = ?, snapshotAt = ? where userId = ? and placeId = ?`,
    )
    .bind(
      details.displayName?.text ?? "",
      details.primaryTypeDisplayName?.text ?? null,
      details.formattedAddress ?? null,
      details.rating ?? null,
      details.userRatingCount ?? 0,
      s.webPresence,
      s.socialUrl,
      details.googleMapsUri ?? null,
      Date.now(),
      userId,
      details.id,
    )
    .run();
  return true;
}

export async function listLeads(db: D1Database, userId: string, filter: { ids?: string[]; limit?: number } = {}) {
  const where = ["l.userId = ?", "l.status != 'dismissed'"];
  const binds: unknown[] = [userId];
  if (filter.ids?.length) {
    const ids = filter.ids.slice(0, 90);
    where.push(`l.id in (${ids.map(() => "?").join(",")})`);
    binds.push(...ids);
  }
  const { results } = await db
    .prepare(`${SELECT} where ${where.join(" and ")} order by l.createdAt desc limit ?`)
    .bind(...binds, Math.min(500, filter.limit ?? 300))
    .all<LeadRow>();
  return results.map(parse);
}

export async function getLead(db: D1Database, id: string, userId: string) {
  const row = await db.prepare(`${SELECT} where l.id = ? and l.userId = ?`).bind(id, userId).first<LeadRow>();
  return row ? parse(row) : null;
}

export async function getLeadForSite(db: D1Database, siteId: string) {
  const row = await db.prepare(`${SELECT} where l.siteId = ?`).bind(siteId).first<LeadRow>();
  return row ? parse(row) : null;
}

export async function updateLead(
  db: D1Database,
  id: string,
  userId: string,
  change: { email?: string | null; phone?: string | null; notes?: string | null; status?: LeadStatus; stage?: LeadStage },
) {
  const sets: string[] = [];
  const binds: unknown[] = [];
  const set = (column: string, value: unknown) => {
    sets.push(`${column} = ?`);
    binds.push(value);
  };
  if (change.email !== undefined) set("emailOverride", change.email);
  if (change.phone !== undefined) set("phoneOverride", change.phone);
  if (change.notes !== undefined) set("notes", change.notes);
  if (change.status) set("status", change.status);
  if (change.stage) set("stage", change.stage);
  if (!sets.length) return;
  await db.prepare(`update lead set ${sets.join(", ")} where id = ? and userId = ?`).bind(...binds, id, userId).run();
}

export async function linkSite(db: D1Database, id: string, userId: string, siteId: string) {
  await db
    .prepare(
      `update lead set siteId = ?, status = 'built', stage = case when stage = 'added' then 'built' else stage end
       where id = ? and userId = ?`,
    )
    .bind(siteId, id, userId)
    .run();
}

export async function listSearches(db: D1Database, userId: string, limit = 20) {
  const { results } = await db
    .prepare(
      `select id, niche, location, country, found, qualified, added, createdAt from agent_search where userId = ? order by createdAt desc limit ?`,
    )
    .bind(userId, limit)
    .all<{ id: string; niche: string; location: string; country: Country; found: number; qualified: number; added: number; createdAt: number }>();
  return results;
}

// A lead's rendered reviews and contact blocks, held between starting its first build and saving it.
const blocksKey = (siteId: string) => `agent:blocks:${siteId}`;

export function holdBlocks(env: CloudflareEnv, siteId: string, blocks: Blocks) {
  return env.SITES.put(blocksKey(siteId), JSON.stringify(blocks), { expirationTtl: 7 * 24 * 60 * 60 });
}

export async function heldBlocks(env: CloudflareEnv, siteId: string): Promise<Blocks> {
  return (await env.SITES.get<Blocks>(blocksKey(siteId), "json")) ?? { reviews: "", contact: "" };
}
