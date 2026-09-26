export type SiteSummary = { id: string; title: string | null; prompt: string; status: string; createdAt: number };
export type Site = SiteSummary & { userId: string; html: string | null; error: string | null };

// Caps OpenAI spend per account until billing is wired.
export const DAILY_GENERATION_LIMIT = 20;

export async function listSites(db: D1Database, userId: string) {
  const { results } = await db
    .prepare(`select id, title, prompt, status, createdAt from site where userId = ? order by createdAt desc`)
    .bind(userId)
    .all<SiteSummary>();
  return results;
}

export function getSite(db: D1Database, id: string, userId: string) {
  return db.prepare(`select * from site where id = ? and userId = ?`).bind(id, userId).first<Site>();
}

export async function countRecentSites(db: D1Database, userId: string) {
  const since = Date.now() - 24 * 60 * 60 * 1000;
  const row = await db
    .prepare(`select count(*) as n from site where userId = ? and createdAt > ?`)
    .bind(userId, since)
    .first<{ n: number }>();
  return row?.n ?? 0;
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

export async function finishSite(db: D1Database, id: string, result: { html: string; title: string | null } | { error: string }) {
  const statement =
    "html" in result
      ? db.prepare(`update site set status = 'ready', html = ?, title = ?, updatedAt = ? where id = ?`).bind(result.html, result.title, Date.now(), id)
      : db.prepare(`update site set status = 'failed', error = ?, updatedAt = ? where id = ?`).bind(result.error, Date.now(), id);
  await statement.run();
}
