import { CAN_SELL } from "@/lib/sales/store";
import type { Onboarding } from "./steps";

type Row = {
  tourCompletedAt: number | null;
  checklistDismissedAt: number | null;
  built: number;
  published: number;
  payouts: number;
  sent: number;
  sold: number;
};

// Where the account is in getting started. Each step is read from what the user has actually done.
export async function getOnboarding(db: D1Database, userId: string): Promise<Onboarding> {
  const canSell = [...CAN_SELL];
  const row = await db
    .prepare(
      `select u.tourCompletedAt, u.checklistDismissedAt,
         exists (select 1 from site where userId = u.id) as built,
         exists (select 1 from site where userId = u.id and deployedVersionId is not null) as published,
         exists (select 1 from seller_account where userId = u.id and verification in (${canSell.map(() => "?").join(", ")})) as payouts,
         exists (select 1 from sale where sellerId = u.id) as sent,
         exists (select 1 from sale where sellerId = u.id and status = 'paid') as sold
       from user u where u.id = ?`,
    )
    .bind(...canSell, userId)
    .first<Row>();
  return {
    tourDone: !!row?.tourCompletedAt,
    checklistDismissed: !!row?.checklistDismissedAt,
    steps: {
      built: !!row?.built,
      published: !!row?.published,
      payouts: !!row?.payouts,
      sent: !!row?.sent,
      sold: !!row?.sold,
    },
  };
}

export function markTourDone(db: D1Database, userId: string) {
  return db.prepare(`update user set tourCompletedAt = ? where id = ? and tourCompletedAt is null`).bind(Date.now(), userId).run();
}

export function dismissChecklist(db: D1Database, userId: string) {
  return db.prepare(`update user set checklistDismissedAt = ? where id = ?`).bind(Date.now(), userId).run();
}
