// Everything the Outreach tab shows: the mailbox, settings, today's count and every sequence.
import { microsoftEnabled } from "./microsoft";
import { getMailbox, getSettings, listSequences, sentToday } from "./store";

// Most emails a day Octa sends from one mailbox; more than this from a personal inbox gets it flagged.
export const MAX_DAILY = 40;

export async function outreachState(env: CloudflareEnv, userId: string) {
  const [mailbox, settings, today, sequences] = await Promise.all([
    getMailbox(env.DB, userId),
    getSettings(env.DB, userId),
    sentToday(env.DB, userId),
    listSequences(env.DB, userId),
  ]);
  return { mailbox, settings, sentToday: today, sequences, outlookAvailable: microsoftEnabled(env) };
}

export type OutreachState = Awaited<ReturnType<typeof outreachState>>;

