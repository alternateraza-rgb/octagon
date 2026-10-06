import type { Scenario } from "./types";
import type { Scorecard } from "./grade";

export async function getCompleted(db: D1Database, userId: string) {
  const { results } = await db.prepare(`select lessonId from academy_progress where userId = ?`).bind(userId).all<{ lessonId: string }>();
  return new Set(results.map((r) => r.lessonId));
}

export function completeLesson(db: D1Database, userId: string, lessonId: string) {
  return db
    .prepare(`insert into academy_progress (userId, lessonId, completedAt) values (?, ?, ?) on conflict do nothing`)
    .bind(userId, lessonId, Date.now())
    .run();
}

// Voice sessions are billed by ElevenLabs per minute, so each account gets a monthly number of them.
export const VOICE_SESSIONS_PER_MONTH = 60;
// Sessions end themselves after this long (the client hangs up).
export const VOICE_SESSION_SECONDS = 10 * 60;

export async function voiceSessionsLeft(db: D1Database, userId: string) {
  const since = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const row = await db
    .prepare(`select count(*) as n from academy_voice where userId = ? and createdAt >= ?`)
    .bind(userId, since)
    .first<{ n: number }>();
  return Math.max(0, VOICE_SESSIONS_PER_MONTH - (row?.n ?? 0));
}

export function logVoiceSession(db: D1Database, userId: string, kind: "coach" | "prospect") {
  return db
    .prepare(`insert into academy_voice (id, userId, kind, createdAt) values (?, ?, ?, ?)`)
    .bind(crypto.randomUUID(), userId, kind, Date.now())
    .run();
}

// A business from the user's Octa Agents list, as the scripts and the practice prospect use it.
export type AcademyLead = {
  id: string;
  name: string;
  category: string | null;
  city: string | null;
  phone: string | null;
  rating: number | null;
  reviewCount: number;
  snippet: string | null;
  // The demo site's live address, if one was built and published.
  link: string | null;
};

export async function listAcademyLeads(db: D1Database, userId: string, sitesDomain: string, limit = 50) {
  const { results } = await db
    .prepare(
      `select l.id, l.name, l.category, l.city, coalesce(l.phoneOverride, l.phone) as phone, l.rating, l.reviewCount, l.snippet,
              case when s.deployedVersionId is not null then s.slug end as slug
       from lead l left join site s on s.id = l.siteId
       where l.userId = ? and l.status in ('saved', 'built')
       order by l.createdAt desc limit ?`,
    )
    .bind(userId, limit)
    .all<Omit<AcademyLead, "link"> & { slug: string | null }>();
  return results.map(({ slug, ...l }) => ({ ...l, link: slug ? `https://${slug}.${sitesDomain}` : null }));
}

export async function getAcademyLead(db: D1Database, userId: string, sitesDomain: string, leadId: string) {
  return (await listAcademyLeads(db, userId, sitesDomain, 500)).find((l) => l.id === leadId) ?? null;
}

export type TranscriptLine = { role: "user" | "prospect"; text: string };

export type PracticeCall = {
  id: string;
  scenario: Scenario;
  leadId: string | null;
  prospectName: string;
  transcript: TranscriptLine[];
  durationSec: number;
  score: number;
  feedback: Scorecard;
  createdAt: number;
};

type CallRow = Omit<PracticeCall, "scenario" | "transcript" | "feedback"> & { scenario: string; transcript: string; feedback: string };

const toCall = (r: CallRow): PracticeCall => ({
  ...r,
  scenario: JSON.parse(r.scenario),
  transcript: JSON.parse(r.transcript),
  feedback: JSON.parse(r.feedback),
});

export async function saveCall(
  db: D1Database,
  userId: string,
  call: Omit<PracticeCall, "id" | "createdAt"> & { conversationId: string | null },
) {
  const id = crypto.randomUUID();
  const createdAt = Date.now();
  await db
    .prepare(
      `insert into academy_call (id, userId, scenario, leadId, prospectName, conversationId, transcript, durationSec, score, feedback, createdAt)
       values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      userId,
      JSON.stringify(call.scenario),
      call.leadId,
      call.prospectName,
      call.conversationId,
      JSON.stringify(call.transcript),
      call.durationSec,
      call.score,
      JSON.stringify(call.feedback),
      createdAt,
    )
    .run();
  return { id, createdAt };
}

export async function listCalls(db: D1Database, userId: string, limit = 20) {
  const { results } = await db
    .prepare(
      `select id, scenario, leadId, prospectName, transcript, durationSec, score, feedback, createdAt
       from academy_call where userId = ? order by createdAt desc limit ?`,
    )
    .bind(userId, limit)
    .all<CallRow>();
  return results.map(toCall);
}
