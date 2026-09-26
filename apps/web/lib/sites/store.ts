export type SiteSummary = {
  id: string;
  title: string | null;
  prompt: string;
  status: "generating" | "ready" | "failed";
  slug: string | null;
  deployedVersionId: string | null;
  latestVersionId: string | null;
  createdAt: number;
  updatedAt: number;
};
export type Site = SiteSummary & { userId: string };
export type VersionSummary = { id: string; instruction: string; createdAt: number };
export type Deployment = { id: string; versionId: string; createdAt: number };

// Caps OpenAI spend per account until billing is wired. Edits count too.
export const DAILY_GENERATION_LIMIT = 40;

const SITE_COLUMNS = `s.id, s.userId, s.title, s.prompt, s.status, s.slug, s.deployedVersionId, s.createdAt, s.updatedAt,
  (select v.id from site_version v where v.siteId = s.id order by v.createdAt desc limit 1) as latestVersionId`;

export async function listSites(db: D1Database, userId: string) {
  const { results } = await db
    .prepare(`select ${SITE_COLUMNS} from site s where s.userId = ? order by s.updatedAt desc`)
    .bind(userId)
    .all<SiteSummary>();
  return results;
}

export function getSite(db: D1Database, id: string, userId: string) {
  return db.prepare(`select ${SITE_COLUMNS} from site s where s.id = ? and s.userId = ?`).bind(id, userId).first<Site>();
}

export async function listVersions(db: D1Database, siteId: string) {
  const { results } = await db
    .prepare(`select id, instruction, createdAt from site_version where siteId = ? order by createdAt asc`)
    .bind(siteId)
    .all<VersionSummary>();
  return results;
}

export async function getVersionHtml(db: D1Database, versionId: string, userId: string) {
  const row = await db
    .prepare(`select v.html from site_version v join site s on s.id = v.siteId where v.id = ? and s.userId = ?`)
    .bind(versionId, userId)
    .first<{ html: string }>();
  return row?.html ?? null;
}

export async function getLatestVersion(db: D1Database, siteId: string) {
  return db
    .prepare(`select id, html from site_version where siteId = ? order by createdAt desc limit 1`)
    .bind(siteId)
    .first<{ id: string; html: string }>();
}

export async function listDeployments(db: D1Database, siteId: string) {
  const { results } = await db
    .prepare(`select id, versionId, createdAt from deployment where siteId = ? order by createdAt desc limit 50`)
    .bind(siteId)
    .all<Deployment>();
  return results;
}

export async function countRecentGenerations(db: D1Database, userId: string) {
  const since = Date.now() - 24 * 60 * 60 * 1000;
  const row = await db
    .prepare(`select count(*) as n from generation where userId = ? and createdAt > ?`)
    .bind(userId, since)
    .first<{ n: number }>();
  return row?.n ?? 0;
}

export async function logGeneration(db: D1Database, userId: string) {
  await db.prepare(`insert into generation (id, userId, createdAt) values (?, ?, ?)`).bind(crypto.randomUUID(), userId, Date.now()).run();
}

export async function createSite(db: D1Database, userId: string, prompt: string) {
  const id = crypto.randomUUID();
  const now = Date.now();
  await db
    .prepare(`insert into site (id, userId, prompt, status, createdAt, updatedAt) values (?, ?, ?, 'generating', ?, ?)`)
    .bind(id, userId, prompt, now, now)
    .run();
  return id;
}

export async function setSiteStatus(db: D1Database, id: string, status: SiteSummary["status"]) {
  await db.prepare(`update site set status = ?, updatedAt = ? where id = ?`).bind(status, Date.now(), id).run();
}

export async function addVersion(db: D1Database, siteId: string, instruction: string, html: string, title: string | null) {
  const id = crypto.randomUUID();
  const now = Date.now();
  await db.batch([
    db.prepare(`insert into site_version (id, siteId, instruction, html, createdAt) values (?, ?, ?, ?, ?)`).bind(id, siteId, instruction, html, now),
    db
      .prepare(`update site set status = 'ready', title = coalesce(?, title), updatedAt = ? where id = ?`)
      .bind(title, now, siteId),
  ]);
  return id;
}

export async function deleteSite(db: D1Database, id: string) {
  await db.prepare(`delete from site where id = ?`).bind(id).run();
}

// A first build that hasn't finished after a few minutes was interrupted.
export function isStalled(site: Site) {
  return site.status === "generating" && Date.now() - site.updatedAt > 3 * 60 * 1000;
}
