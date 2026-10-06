import { CAN_SELL } from "@/lib/sales/store";
import type { TaskState } from "./types";

// What the user has actually done in Octacore, so lessons tick themselves off. Same idea as
// lib/onboarding/store.ts: every task is read from real data, nothing is stored.
export async function getTaskState(db: D1Database, userId: string): Promise<TaskState> {
  const canSell = [...CAN_SELL];
  const row = await db
    .prepare(
      `select
         exists (select 1 from site where userId = u.id) as built,
         exists (select 1 from site_version v join site s on s.id = v.siteId where s.userId = u.id
                 group by v.siteId having count(*) >= 2) as edited,
         exists (select 1 from site where userId = u.id and deployedVersionId is not null) as published,
         exists (select 1 from custom_domain d join site s on s.id = d.siteId where s.userId = u.id) as domain,
         exists (select 1 from agent_search where userId = u.id) as searched,
         exists (select 1 from lead where userId = u.id and status in ('saved', 'built')) as saved,
         exists (select 1 from lead where userId = u.id and siteId is not null) as demo,
         exists (select 1 from mailbox where userId = u.id) as mailbox,
         exists (select 1 from sequence_step where userId = u.id and status = 'sent') as emailed,
         exists (select 1 from academy_call where userId = u.id and score >= 60) as practiced,
         exists (select 1 from seller_account where userId = u.id and verification in (${canSell.map(() => "?").join(", ")})) as payouts,
         exists (select 1 from sale where sellerId = u.id) as sent,
         exists (select 1 from sale where sellerId = u.id and status = 'paid') as sold
       from user u where u.id = ?`,
    )
    .bind(...canSell, userId)
    .first<Record<keyof TaskState, number>>();
  const state = {} as TaskState;
  for (const key of ["built", "edited", "published", "domain", "searched", "saved", "demo", "mailbox", "emailed", "practiced", "payouts", "sent", "sold"] as const)
    state[key] = !!row?.[key];
  return state;
}
