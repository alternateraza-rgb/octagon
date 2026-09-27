import type { Blocks } from "./inject";
import type { Country, PlaceDetails } from "./places";
import { qualify, score, type ScoredPlace, type WebPresence } from "./score";

export type LeadStatus = "new" | "saved" | "dismissed" | "built";
export const LEAD_STATUSES: LeadStatus[] = ["new", "saved", "dismissed", "built"];

export type Lead = {
  id: string;
  placeId: string;
  name: string;
  category: string | null;
  phone: string | null;
  address: string | null;
  country: Country;
  rating: number | null;
  reviewCount: number;
  webPresence: WebPresence;
  socialUrl: string | null;
  mapsUrl: string | null;
  score: number;
  reasons: string[];
  status: LeadStatus;
  siteId: string | null;
  snapshotAt: number;
  createdAt: number;
};

type LeadRow = Omit<Lead, "reasons"> & { reasons: string };

// Places content other than the place ID may only be kept briefly; older snapshots are refreshed
// before they're shown again.
export const SNAPSHOT_TTL = 30 * 24 * 60 * 60 * 1000;

const COLUMNS = `id, placeId, name, category, phone, address, country, rating, reviewCount, webPresence, socialUrl,
  mapsUrl, score, reasons, status, siteId, snapshotAt, createdAt`;

const parse = (row: LeadRow): Lead => ({ ...row, reasons: JSON.parse(row.reasons) as string[] });

function snapshot(s: ScoredPlace) {
  const p = s.place;
  return [
    p.displayName?.text ?? "",
    p.primaryTypeDisplayName?.text ?? null,
    p.nationalPhoneNumber ?? null,
    p.formattedAddress ?? null,
    s.country,
    p.rating ?? null,
    p.userRatingCount ?? 0,
    s.webPresence,
    s.socialUrl,
    p.googleMapsUri ?? null,
    s.score,
    JSON.stringify(s.reasons),
  ] as const;
}

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

// Place IDs this user already has, so a repeat search neither duplicates nor bills them again.
export async function knownPlaceIds(db: D1Database, userId: string, placeIds: string[]) {
  if (!placeIds.length) return new Set<string>();
  const { results } = await db
    .prepare(`select placeId from lead where userId = ? and placeId in (${placeIds.map(() => "?").join(",")})`)
    .bind(userId, ...placeIds)
    .all<{ placeId: string }>();
  return new Set(results.map((r) => r.placeId));
}

// Adds new leads and refreshes the snapshot of ones the user already had. Returns how many were new.
export async function saveLeads(db: D1Database, userId: string, searchId: string, fresh: ScoredPlace[], known: ScoredPlace[]) {
  const now = Date.now();
  const inserts = fresh.map((s) =>
    db
      .prepare(
        `insert into lead (id, userId, searchId, placeId, name, category, phone, address, country, rating, reviewCount,
          webPresence, socialUrl, mapsUrl, score, reasons, snapshotAt, createdAt)
         values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) on conflict (userId, placeId) do nothing`,
      )
      .bind(crypto.randomUUID(), userId, searchId, s.place.id, ...snapshot(s), now, now),
  );
  const updates = known.map((s) => refreshStatement(db, userId, s, now));
  const statements = [...inserts, ...updates];
  if (statements.length) await db.batch(statements);
  await db.prepare(`update agent_search set added = ? where id = ?`).bind(fresh.length, searchId).run();
  return fresh.length;
}

function refreshStatement(db: D1Database, userId: string, s: ScoredPlace, now: number) {
  return db
    .prepare(
      `update lead set name = ?, category = ?, phone = ?, address = ?, country = ?, rating = ?, reviewCount = ?,
        webPresence = ?, socialUrl = ?, mapsUrl = ?, score = ?, reasons = ?, snapshotAt = ?
       where userId = ? and placeId = ?`,
    )
    .bind(...snapshot(s), now, userId, s.place.id);
}

// Updates a lead from fresh Place Details. Returns false when the business no longer qualifies
// (it closed, or now has a website), but the snapshot is still refreshed where possible.
export async function refreshLead(db: D1Database, userId: string, details: PlaceDetails) {
  const q = qualify(details);
  if (!q) {
    await db
      .prepare(`update lead set name = ?, phone = ?, address = ?, snapshotAt = ? where userId = ? and placeId = ?`)
      .bind(
        details.displayName?.text ?? "",
        details.nationalPhoneNumber ?? null,
        details.formattedAddress ?? null,
        Date.now(),
        userId,
        details.id,
      )
      .run();
    return false;
  }
  await refreshStatement(db, userId, score(q), Date.now()).run();
  return true;
}

export async function listLeads(
  db: D1Database,
  userId: string,
  filter: { status?: LeadStatus | "active"; searchId?: string; limit?: number } = {},
) {
  const where = ["userId = ?"];
  const binds: unknown[] = [userId];
  if (filter.status === "active") where.push(`status != 'dismissed'`);
  else if (filter.status) {
    where.push("status = ?");
    binds.push(filter.status);
  }
  if (filter.searchId) {
    where.push("searchId = ?");
    binds.push(filter.searchId);
  }
  const { results } = await db
    .prepare(`select ${COLUMNS} from lead where ${where.join(" and ")} order by score desc, createdAt desc limit ?`)
    .bind(...binds, Math.min(500, filter.limit ?? 200))
    .all<LeadRow>();
  return results.map(parse);
}

export async function getLead(db: D1Database, id: string, userId: string) {
  const row = await db.prepare(`select ${COLUMNS} from lead where id = ? and userId = ?`).bind(id, userId).first<LeadRow>();
  return row ? parse(row) : null;
}

export async function getLeadForSite(db: D1Database, siteId: string) {
  const row = await db.prepare(`select ${COLUMNS} from lead where siteId = ?`).bind(siteId).first<LeadRow>();
  return row ? parse(row) : null;
}

export async function setLeadStatus(db: D1Database, id: string, userId: string, status: LeadStatus) {
  await db.prepare(`update lead set status = ? where id = ? and userId = ?`).bind(status, id, userId).run();
}

export async function linkSite(db: D1Database, id: string, userId: string, siteId: string) {
  await db.prepare(`update lead set siteId = ?, status = 'built' where id = ? and userId = ?`).bind(siteId, id, userId).run();
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
