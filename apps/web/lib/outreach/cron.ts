// Outreach, every 10 minutes:
// 1. Autopilot: businesses with an email that haven't been contacted get a sequence drafted.
// 2. Replies: active sequences are checked for a reply (or a bounce), which stops the follow-ups.
// 3. Sending: due emails go out from each user's mailbox, on weekdays 9am–5pm in their timezone and
//    within their daily cap. Anything not sent this run is picked up by the next one.
import { draftEmails, emailHtml, unsubscribeUrl } from "./draft";
import { MailboxError, conversationSince, sendNew, sendReply } from "./microsoft";
import {
  accessToken,
  createSequence,
  endSequence,
  getSettings,
  isSuppressed,
  markMailboxError,
  sentToday,
  type OutreachSettings,
} from "./store";
import { getLead, updateLead } from "@/lib/agents/store";

const BATCH = 25;
const CHECK_EVERY = 30 * 60 * 1000;
const AUTOPILOT_PER_RUN = 5;
// Leaves room between emails from one mailbox, which reads as a person and keeps providers happy.
const PER_USER_PER_RUN = 3;

const origin = (env: CloudflareEnv) => `https://${env.SITES_DOMAIN}`;

// Weekdays, 9am to 5pm, in the user's timezone.
export function inSendWindow(timezone: string, now = new Date()) {
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat("en-US", { timeZone: timezone, weekday: "short", hour: "numeric", hour12: false }).formatToParts(now);
  } catch {
    return false;
  }
  const day = parts.find((p) => p.type === "weekday")?.value;
  const hour = Number(parts.find((p) => p.type === "hour")?.value);
  return day !== "Sat" && day !== "Sun" && hour >= 9 && hour < 17;
}

type Due = {
  stepId: string;
  sequenceId: string;
  userId: string;
  leadId: string;
  step: number;
  subject: string;
  body: string;
  toEmail: string;
  unsubToken: string;
  threadMessageId: string | null;
};

async function sendStep(env: CloudflareEnv, due: Due, settings: OutreachSettings) {
  const db = env.DB;
  if (await isSuppressed(db, due.toEmail)) return endSequence(db, due.sequenceId, "unsubscribed");
  const token = await accessToken(env, due.userId);
  const html = emailHtml(due.body, { mailingAddress: settings.mailingAddress, unsubscribeUrl: unsubscribeUrl(origin(env), due.unsubToken) });
  if (due.step === 0 || !due.threadMessageId) {
    const sent = await sendNew(token, { to: due.toEmail, subject: due.subject, html });
    await db.prepare(`update sequence set threadMessageId = ?, conversationId = ? where id = ?`).bind(sent.id, sent.conversationId, due.sequenceId).run();
  } else {
    await sendReply(token, due.threadMessageId, html);
  }
  await db.prepare(`update sequence_step set status = 'sent', sentAt = ?, error = null where id = ?`).bind(Date.now(), due.stepId).run();
  const lead = await getLead(db, due.leadId, due.userId);
  if (lead && (lead.stage === "added" || lead.stage === "built")) await updateLead(db, due.leadId, due.userId, { stage: "emailed" });
  // The last email in the sequence: it's finished once that's out (unless they reply).
  const left = await db.prepare(`select count(*) as n from sequence_step where sequenceId = ? and status = 'scheduled'`).bind(due.sequenceId).first<{ n: number }>();
  if (!left?.n) await db.prepare(`update sequence set status = 'finished', endedAt = ? where id = ? and status = 'active'`).bind(Date.now(), due.sequenceId).run();
}

async function sendDue(env: CloudflareEnv) {
  const { results } = await env.DB.prepare(
    `select t.id as stepId, t.sequenceId, t.userId, s.leadId, t.step, t.subject, t.body, s.toEmail, s.unsubToken, s.threadMessageId
     from sequence_step t join sequence s on s.id = t.sequenceId join mailbox m on m.userId = t.userId
     join outreach_settings o on o.userId = t.userId
     where t.status = 'scheduled' and t.scheduledAt <= ? and s.status = 'active' and m.status = 'connected' and o.paused = 0
     order by t.scheduledAt limit ?`,
  )
    .bind(Date.now(), BATCH * 4)
    .all<Due>();
  const byUser = new Map<string, Due[]>();
  for (const d of results) byUser.set(d.userId, [...(byUser.get(d.userId) ?? []), d]);

  let sent = 0;
  for (const [userId, dues] of byUser) {
    const settings = await getSettings(env.DB, userId);
    if (!settings || !inSendWindow(settings.timezone)) continue;
    const room = Math.min(PER_USER_PER_RUN, settings.dailyCap - (await sentToday(env.DB, userId)));
    for (const due of dues.slice(0, Math.max(0, room))) {
      try {
        await sendStep(env, due, settings);
        sent++;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Couldn't send.";
        console.error("Outreach send failed", due.stepId, message);
        if (error instanceof MailboxError && error.reconnect) {
          await markMailboxError(env.DB, userId, message);
          break;
        }
        await env.DB.prepare(`update sequence_step set error = ? where id = ?`).bind(message, due.stepId).run();
      }
    }
  }
  return sent;
}

// A message in the thread from anyone but the sender: a reply, or a bounce from the mail system.
async function checkReplies(env: CloudflareEnv) {
  const { results } = await env.DB.prepare(
    `select s.id, s.userId, s.leadId, s.conversationId, s.toEmail, m.email as mailbox,
       (select min(sentAt) from sequence_step t where t.sequenceId = s.id and t.status = 'sent') as firstSentAt
     from sequence s join mailbox m on m.userId = s.userId
     where s.status in ('active', 'finished') and s.conversationId is not null and m.status = 'connected'
       and (s.lastCheckedAt is null or s.lastCheckedAt < ?) and s.createdAt > ?
     order by s.lastCheckedAt limit ?`,
  )
    .bind(Date.now() - CHECK_EVERY, Date.now() - 30 * 24 * 60 * 60 * 1000, BATCH)
    .all<{ id: string; userId: string; leadId: string; conversationId: string; toEmail: string; mailbox: string; firstSentAt: number | null }>();
  let replies = 0;
  for (const s of results) {
    try {
      const token = await accessToken(env, s.userId);
      const messages = await conversationSince(token, s.conversationId, s.firstSentAt ?? 0);
      const others = messages.filter((m) => m.from && m.from !== s.mailbox);
      const bounce = others.find((m) => /postmaster|mailer-daemon|microsoftexchange/i.test(m.from) || /undeliverable|delivery has failed/i.test(m.subject));
      if (bounce) {
        await env.DB.prepare(`insert into suppression (email, reason, createdAt) values (?, 'bounced', ?) on conflict (email) do nothing`)
          .bind(s.toEmail, Date.now())
          .run();
        await env.DB.prepare(`update sequence set status = 'active' where id = ? and status = 'finished'`).bind(s.id).run();
        await endSequence(env.DB, s.id, "bounced");
      } else if (others.length) {
        await env.DB.prepare(`update sequence set status = 'active' where id = ? and status = 'finished'`).bind(s.id).run();
        await endSequence(env.DB, s.id, "replied");
        await updateLead(env.DB, s.leadId, s.userId, { stage: "replied" });
        replies++;
      }
    } catch (error) {
      console.error("Outreach reply check failed", s.id, error instanceof Error ? error.message : error);
    }
    await env.DB.prepare(`update sequence set lastCheckedAt = ? where id = ?`).bind(Date.now(), s.id).run();
  }
  return replies;
}

// Autopilot: drafts a sequence for businesses that have an email and haven't been contacted.
async function autopilot(env: CloudflareEnv) {
  const { results: users } = await env.DB.prepare(
    `select o.userId from outreach_settings o join mailbox m on m.userId = o.userId
     where o.autopilot = 1 and o.paused = 0 and m.status = 'connected'`,
  ).all<{ userId: string }>();
  let started = 0;
  for (const { userId } of users) {
    const settings = await getSettings(env.DB, userId);
    if (!settings) continue;
    // Don't queue more first emails than the day can send.
    const queued = await env.DB.prepare(
      `select count(*) as n from sequence_step where userId = ? and step = 0 and status = 'scheduled'`,
    )
      .bind(userId)
      .first<{ n: number }>();
    const room = Math.min(AUTOPILOT_PER_RUN, settings.dailyCap - (queued?.n ?? 0) - (await sentToday(env.DB, userId)));
    if (room <= 0) continue;
    const { results: leads } = await env.DB.prepare(
      `select l.id from lead l left join business b on b.placeId = l.placeId
       where l.userId = ? and l.status != 'dismissed' and coalesce(l.emailOverride, b.email) is not null
         -- Autopilot only writes to strong matches (or emails the user typed); the rest wait for a person.
         and (l.emailOverride is not null or b.emailConfidence = 'high')
         and not exists (select 1 from sequence s where s.leadId = l.id)
         and not exists (select 1 from suppression x where x.email = lower(coalesce(l.emailOverride, b.email)))
       order by l.createdAt limit ?`,
    )
      .bind(userId, room)
      .all<{ id: string }>();
    for (const { id } of leads) {
      const lead = await getLead(env.DB, id, userId);
      if (!lead?.email) continue;
      try {
        const emails = await draftEmails(env, lead, settings, settings.followUps ? 3 : 1);
        await createSequence(env.DB, userId, lead.id, lead.email, emails);
        started++;
      } catch (error) {
        console.error("Autopilot draft failed", id, error instanceof Error ? error.message : error);
      }
    }
  }
  return started;
}

export async function runOutreachCron(env: CloudflareEnv) {
  const started = await autopilot(env);
  const replies = await checkReplies(env);
  const sent = await sendDue(env);
  console.log("Outreach cron", { started, replies, sent });
}
