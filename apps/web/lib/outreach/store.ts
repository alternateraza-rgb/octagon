// Outreach data: the user's mailbox and settings, email sequences and their steps, and the addresses
// that unsubscribed.
import { seal, token, unseal } from "./crypto";
import { MailboxError, refreshTokens, type Tokens } from "./microsoft";

const DAY = 24 * 60 * 60 * 1000;
// When each email in a sequence goes out, in days after the first.
export const STEP_DAYS = [0, 3, 7];

export type Mailbox = { id: string; provider: "microsoft"; email: string; name: string | null; status: "connected" | "error"; error: string | null };

export type OutreachSettings = {
  senderName: string;
  mailingAddress: string;
  offer: string;
  dailyCap: number;
  followUps: boolean;
  autopilot: boolean;
  paused: boolean;
  timezone: string;
};

export type SequenceStatus = "active" | "replied" | "bounced" | "unsubscribed" | "stopped" | "finished" | "failed";
export type Step = { step: number; subject: string; body: string; status: "scheduled" | "sent" | "failed" | "canceled"; scheduledAt: number; sentAt: number | null; error: string | null };
export type Sequence = { id: string; leadId: string; toEmail: string; status: SequenceStatus; createdAt: number; endedAt: number | null; steps: Step[] };

// ── Mailbox ────────────────────────────────────────────────────────────────────────────────────

export async function getMailbox(db: D1Database, userId: string) {
  return db
    .prepare(`select id, provider, email, name, status, error from mailbox where userId = ?`)
    .bind(userId)
    .first<Mailbox>();
}

export async function saveMailbox(env: CloudflareEnv, userId: string, account: { email: string; name: string | null }, tokens: Tokens) {
  await env.DB.prepare(
    `insert into mailbox (id, userId, provider, email, name, refreshToken, accessToken, accessExpiresAt, status, connectedAt)
     values (?, ?, 'microsoft', ?, ?, ?, ?, ?, 'connected', ?)
     on conflict (userId) do update set provider = excluded.provider, email = excluded.email, name = excluded.name,
       refreshToken = excluded.refreshToken, accessToken = excluded.accessToken, accessExpiresAt = excluded.accessExpiresAt,
       status = 'connected', error = null, connectedAt = excluded.connectedAt`,
  )
    .bind(
      crypto.randomUUID(),
      userId,
      account.email,
      account.name,
      await seal(env, tokens.refreshToken),
      await seal(env, tokens.accessToken),
      tokens.expiresAt,
      Date.now(),
    )
    .run();
}

export function removeMailbox(db: D1Database, userId: string) {
  return db.prepare(`delete from mailbox where userId = ?`).bind(userId).run();
}

// A working access token for the user's mailbox, refreshed (and the new tokens saved) when it's close
// to expiring. A refresh Microsoft refuses marks the mailbox as needing to be connected again.
export async function accessToken(env: CloudflareEnv, userId: string) {
  const row = await env.DB.prepare(`select refreshToken, accessToken, accessExpiresAt, status from mailbox where userId = ?`)
    .bind(userId)
    .first<{ refreshToken: string; accessToken: string | null; accessExpiresAt: number | null; status: string }>();
  if (!row || row.status !== "connected") throw new MailboxError("Connect Outlook first.", true);
  if (row.accessToken && (row.accessExpiresAt ?? 0) > Date.now() + 5 * 60 * 1000) return unseal(env, row.accessToken);
  try {
    const tokens = await refreshTokens(env, await unseal(env, row.refreshToken));
    await env.DB.prepare(`update mailbox set refreshToken = ?, accessToken = ?, accessExpiresAt = ? where userId = ?`)
      .bind(await seal(env, tokens.refreshToken), await seal(env, tokens.accessToken), tokens.expiresAt, userId)
      .run();
    return tokens.accessToken;
  } catch (error) {
    if (error instanceof MailboxError && error.reconnect) await markMailboxError(env.DB, userId, error.message);
    throw error;
  }
}

export function markMailboxError(db: D1Database, userId: string, message: string) {
  return db.prepare(`update mailbox set status = 'error', error = ? where userId = ?`).bind(message, userId).run();
}

// ── Settings ───────────────────────────────────────────────────────────────────────────────────

type SettingsRow = Omit<OutreachSettings, "followUps" | "autopilot" | "paused"> & { followUps: number; autopilot: number; paused: number };

export async function getSettings(db: D1Database, userId: string): Promise<OutreachSettings | null> {
  const row = await db
    .prepare(`select senderName, mailingAddress, offer, dailyCap, followUps, autopilot, paused, timezone from outreach_settings where userId = ?`)
    .bind(userId)
    .first<SettingsRow>();
  return row ? { ...row, followUps: !!row.followUps, autopilot: !!row.autopilot, paused: !!row.paused } : null;
}

export function saveSettings(db: D1Database, userId: string, s: OutreachSettings) {
  return db
    .prepare(
      `insert into outreach_settings (userId, senderName, mailingAddress, offer, dailyCap, followUps, autopilot, paused, timezone, updatedAt)
       values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       on conflict (userId) do update set senderName = excluded.senderName, mailingAddress = excluded.mailingAddress,
         offer = excluded.offer, dailyCap = excluded.dailyCap, followUps = excluded.followUps, autopilot = excluded.autopilot,
         paused = excluded.paused, timezone = excluded.timezone, updatedAt = excluded.updatedAt`,
    )
    .bind(
      userId,
      s.senderName,
      s.mailingAddress,
      s.offer,
      s.dailyCap,
      s.followUps ? 1 : 0,
      s.autopilot ? 1 : 0,
      s.paused ? 1 : 0,
      s.timezone,
      Date.now(),
    )
    .run();
}

export async function sentSince(db: D1Database, userId: string, since: number) {
  const row = await db
    .prepare(`select count(*) as n from sequence_step where userId = ? and status = 'sent' and sentAt >= ?`)
    .bind(userId, since)
    .first<{ n: number }>();
  return row?.n ?? 0;
}

export const sentToday = (db: D1Database, userId: string) => sentSince(db, userId, Date.now() - DAY);

// ── Sequences ──────────────────────────────────────────────────────────────────────────────────

export async function isSuppressed(db: D1Database, email: string) {
  return !!(await db.prepare(`select 1 from suppression where email = ?`).bind(email.toLowerCase()).first());
}

export async function createSequence(
  db: D1Database,
  userId: string,
  leadId: string,
  toEmail: string,
  emails: { subject: string; body: string }[],
) {
  const id = crypto.randomUUID();
  const now = Date.now();
  await db.batch([
    // A business emailed before (and stopped) can be emailed again; its old sequence goes.
    db.prepare(`delete from sequence where leadId = ? and userId = ? and status != 'active'`).bind(leadId, userId),
    db
      .prepare(`insert into sequence (id, userId, leadId, toEmail, unsubToken, createdAt) values (?, ?, ?, ?, ?, ?)`)
      .bind(id, userId, leadId, toEmail.toLowerCase(), token(), now),
    ...emails.map((e, i) =>
      db
        .prepare(
          `insert into sequence_step (id, sequenceId, userId, step, subject, body, scheduledAt) values (?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(crypto.randomUUID(), id, userId, i, e.subject, e.body, now + STEP_DAYS[i] * DAY),
    ),
  ]);
  return id;
}

export async function endSequence(db: D1Database, id: string, status: Exclude<SequenceStatus, "active">) {
  await db.batch([
    db.prepare(`update sequence set status = ?, endedAt = ? where id = ? and status = 'active'`).bind(status, Date.now(), id),
    db.prepare(`update sequence_step set status = 'canceled' where sequenceId = ? and status = 'scheduled'`).bind(id),
  ]);
}

export async function getSequenceForLead(db: D1Database, userId: string, leadId: string): Promise<Sequence | null> {
  const seq = await db
    .prepare(`select id, leadId, toEmail, status, createdAt, endedAt from sequence where leadId = ? and userId = ?`)
    .bind(leadId, userId)
    .first<Omit<Sequence, "steps">>();
  if (!seq) return null;
  const { results } = await db
    .prepare(`select step, subject, body, status, scheduledAt, sentAt, error from sequence_step where sequenceId = ? order by step`)
    .bind(seq.id)
    .all<Step>();
  return { ...seq, steps: results };
}

export type SequenceSummary = {
  id: string;
  leadId: string;
  name: string;
  photoUrl: string | null;
  toEmail: string;
  status: SequenceStatus;
  sent: number;
  total: number;
  nextAt: number | null;
  lastSentAt: number | null;
  createdAt: number;
};

// Every sequence the user has, newest first, for the Outreach tab.
export async function listSequences(db: D1Database, userId: string, limit = 100) {
  const { results } = await db
    .prepare(
      `select s.id, s.leadId, l.name, coalesce(l.photoUrl, b.photoUrl) as photoUrl, s.toEmail, s.status, s.createdAt,
         (select count(*) from sequence_step t where t.sequenceId = s.id and t.status = 'sent') as sent,
         (select count(*) from sequence_step t where t.sequenceId = s.id and t.status != 'canceled') as total,
         (select min(scheduledAt) from sequence_step t where t.sequenceId = s.id and t.status = 'scheduled') as nextAt,
         (select max(sentAt) from sequence_step t where t.sequenceId = s.id) as lastSentAt
       from sequence s join lead l on l.id = s.leadId left join business b on b.placeId = l.placeId
       where s.userId = ? order by s.createdAt desc limit ?`,
    )
    .bind(userId, limit)
    .all<SequenceSummary>();
  return results;
}

export async function getSequenceByToken(db: D1Database, unsubToken: string) {
  return db
    .prepare(
      `select s.id, s.toEmail, s.status, coalesce(o.senderName, u.name) as sender
       from sequence s join user u on u.id = s.userId left join outreach_settings o on o.userId = s.userId
       where s.unsubToken = ?`,
    )
    .bind(unsubToken)
    .first<{ id: string; toEmail: string; status: SequenceStatus; sender: string }>();
}

export async function unsubscribe(db: D1Database, unsubToken: string) {
  const seq = await getSequenceByToken(db, unsubToken);
  if (!seq) return null;
  await db
    .prepare(`insert into suppression (email, reason, createdAt) values (?, 'unsubscribed', ?) on conflict (email) do nothing`)
    .bind(seq.toEmail, Date.now())
    .run();
  // Every sequence to this address stops, whoever sent it.
  const { results } = await db.prepare(`select id from sequence where toEmail = ? and status = 'active'`).bind(seq.toEmail).all<{ id: string }>();
  for (const r of results) await endSequence(db, r.id, "unsubscribed");
  return seq;
}
