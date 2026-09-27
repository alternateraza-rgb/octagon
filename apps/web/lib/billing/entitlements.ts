// What an account may do right now: its plan, the limits that come with it, and how much of each it
// has used this billing period. Usage is counted from tables that already exist, so it can't drift.
import { DAILY_BURST, METER_LABEL, formatBytes, planById, type Limits, type Meter, type PlanId } from "./plans";

// Whop membership statuses that keep access. `canceling` still has time left on the period, and
// `past_due` keeps working while Whop retries the card.
export const ACTIVE = new Set(["active", "trialing", "past_due", "canceling"]);
export const GRACE_DAYS = 14;
const DAY = 24 * 60 * 60 * 1000;

export type Subscription = {
  userId: string;
  plan: PlanId | null;
  status: string;
  whopMembershipId: string | null;
  whopUserId: string | null;
  periodStart: number | null;
  periodEnd: number | null;
  cancelAtPeriodEnd: number;
  manageUrl: string | null;
  endedAt: number | null;
  updatedAt: number;
};

export type Access = {
  plan: PlanId | null;
  active: boolean;
  comped: boolean;
  status: string;
  limits: Limits | null;
  periodStart: number;
  periodEnd: number | null;
  cancelAtPeriodEnd: boolean;
  manageUrl: string | null;
  // When live sites pause, for an account whose plan ended.
  pausesAt: number | null;
};

export type Usage = Record<Meter, number>;

export function isComped(env: CloudflareEnv, email: string) {
  return (env.COMPED_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
    .includes(email.toLowerCase());
}

export function getSubscription(db: D1Database, userId: string) {
  return db.prepare(`select * from subscription where userId = ?`).bind(userId).first<Subscription>();
}

export async function getAccess(env: CloudflareEnv, user: { id: string; email: string }): Promise<Access> {
  const sub = await getSubscription(env.DB, user.id);
  const now = Date.now();
  // Monthly usage resets on the plan's renewal date; without one, on the calendar month.
  const monthStart = new Date(now);
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);

  if (isComped(env, user.email)) {
    return {
      plan: "agency",
      active: true,
      comped: true,
      status: "active",
      limits: planById("agency")!.limits,
      periodStart: monthStart.getTime(),
      periodEnd: null,
      cancelAtPeriodEnd: false,
      manageUrl: null,
      pausesAt: null,
    };
  }
  const plan = planById(sub?.plan);
  const active = !!sub && !!plan && ACTIVE.has(sub.status) && !sub.endedAt;
  // A renewal that Whop hasn't reported yet shouldn't reset usage early or late: fall back to the
  // last 30 days once the stored period is over.
  const periodStart = sub?.periodStart && (!sub.periodEnd || sub.periodEnd > now) ? sub.periodStart : now - 30 * DAY;
  return {
    plan: plan?.id ?? null,
    active,
    comped: false,
    status: sub?.status ?? "none",
    limits: active ? plan!.limits : null,
    periodStart,
    periodEnd: sub?.periodEnd ?? null,
    cancelAtPeriodEnd: !!sub?.cancelAtPeriodEnd,
    manageUrl: sub?.manageUrl ?? null,
    pausesAt: !active && sub?.endedAt ? sub.endedAt + GRACE_DAYS * DAY : null,
  };
}

const count = async (stmt: D1PreparedStatement) => (await stmt.first<{ n: number | null }>())?.n ?? 0;

export function countUsage(db: D1Database, userId: string, meter: Meter, since: number) {
  switch (meter) {
    case "builds":
    case "chat":
      return count(
        db
          .prepare(`select count(*) as n from generation where userId = ? and kind = ? and createdAt >= ?`)
          .bind(userId, meter === "builds" ? "build" : "chat", since),
      );
    case "sites":
      return count(
        db
          .prepare(`select count(*) as n from site where userId = ? and deployedVersionId is not null and pausedAt is null`)
          .bind(userId),
      );
    case "storage":
      return count(db.prepare(`select sum(size) as n from upload where userId = ?`).bind(userId));
  }
}

export async function getUsage(db: D1Database, userId: string, since: number): Promise<Usage> {
  const [builds, chat, sites, storage] = await Promise.all(
    (["builds", "chat", "sites", "storage"] as const).map((m) => countUsage(db, userId, m, since)),
  );
  return { builds, chat, sites, storage };
}

export function logUsage(db: D1Database, userId: string, kind: "build" | "chat") {
  return db
    .prepare(`insert into generation (id, userId, kind, createdAt) values (?, ?, ?, ?)`)
    .bind(crypto.randomUUID(), userId, kind, Date.now())
    .run();
}

// Everything the caller needs to refuse a request: 402 with a message the UI shows in its upgrade
// sheet, or null when the request fits the plan. `adding` is how much the request would use.
export async function checkLimit(
  env: CloudflareEnv,
  user: { id: string; email: string },
  meter: Meter,
  adding = 1,
): Promise<Response | null> {
  const access = await getAccess(env, user);
  if (!access.active || !access.limits) {
    return Response.json(
      {
        error: access.pausesAt ? "Your plan has ended. Choose a plan to keep building." : "Choose a plan to start building.",
        upgrade: true,
        reason: "no-plan",
      },
      { status: 402 },
    );
  }
  const limit = access.limits[meter];
  const used = await countUsage(env.DB, user.id, meter, access.periodStart);
  if (used + adding > limit) {
    const label = METER_LABEL[meter];
    const error =
      meter === "storage"
        ? `You've used ${formatBytes(used)} of your ${formatBytes(limit)} of uploads.`
        : meter === "sites"
          ? `Your plan includes ${limit} live websites, and they're all in use.`
          : `You've used all ${limit.toLocaleString("en-US")} ${label.many} this month.`;
    return Response.json({ error, upgrade: true, reason: meter, plan: access.plan, limit, used }, { status: 402 });
  }
  if (meter === "builds" || meter === "chat") {
    const kind = meter === "builds" ? "build" : "chat";
    const today = await countUsage(env.DB, user.id, meter, Date.now() - DAY);
    if (today >= DAILY_BURST[kind]) {
      return Response.json(
        { error: `That's a lot of ${METER_LABEL[meter].many} for one day. Try again tomorrow.` },
        { status: 429 },
      );
    }
  }
  return null;
}
