// What an account may do right now: its plan, the limits that come with it, and how much of each it
// has used this billing period. Usage is counted from tables that already exist, so it can't drift.
import { DAILY_BURST, METER_LABEL, formatBytes, isInterval, planById, type Interval, type Limits, type Meter, type PlanId } from "./plans";

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
  interval: string;
};

export type Access = {
  plan: PlanId | null;
  active: boolean;
  comped: boolean;
  status: string;
  limits: Limits | null;
  interval: Interval;
  // Start of the current usage month (limits are monthly, yearly plans included) and when it resets.
  periodStart: number;
  usageResetsAt: number | null;
  periodEnd: number | null;
  cancelAtPeriodEnd: boolean;
  manageUrl: string | null;
  // When live sites pause, for an account whose plan ended.
  pausesAt: number | null;
};

export type Usage = Record<Meter, number>;

// `anchor` plus `months` calendar months, keeping its day of the month where the month allows
// (a Jan 31 anchor gives Feb 28/29, then Mar 31).
export function addMonths(anchor: number, months: number) {
  const d = new Date(anchor);
  const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + months, 1, d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds(), d.getUTCMilliseconds()));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(d.getUTCDate(), lastDay));
  return target.getTime();
}

// The usage month that contains `now`, counted in monthly anniversaries of `anchor`.
export function usageMonth(anchor: number, now: number) {
  let months = 0;
  while (addMonths(anchor, months + 1) <= now) months++;
  return { start: addMonths(anchor, months), end: addMonths(anchor, months + 1) };
}

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
      interval: "month",
      periodStart: monthStart.getTime(),
      usageResetsAt: addMonths(monthStart.getTime(), 1),
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
  const interval: Interval = isInterval(sub?.interval) ? sub.interval : "month";
  const current = !!sub?.periodStart && (!sub.periodEnd || sub.periodEnd > now);
  // Limits are monthly. A yearly plan's usage resets on each monthly anniversary of its start.
  const month = current && interval === "year" ? usageMonth(sub!.periodStart!, now) : null;
  const periodStart = month?.start ?? (current ? sub!.periodStart! : now - 30 * DAY);
  const usageResetsAt = month?.end ?? (current ? (sub!.periodEnd ?? addMonths(periodStart, 1)) : null);
  return {
    plan: plan?.id ?? null,
    active,
    comped: false,
    status: sub?.status ?? "none",
    limits: active ? plan!.limits : null,
    interval,
    periodStart,
    usageResetsAt,
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
          // Sold sites whose client pays for hosting don't take one of the seller's live sites.
          .prepare(
            `select count(*) as n from site s where s.userId = ? and s.deployedVersionId is not null and s.pausedAt is null
               and not exists (select 1 from sale where sale.id = s.saleId and sale.hostingStatus = 'active')`,
          )
          .bind(userId),
      );
    case "storage":
      return count(db.prepare(`select sum(size) as n from upload where userId = ?`).bind(userId));
    case "leads":
      return count(db.prepare(`select count(*) as n from lead where userId = ? and createdAt >= ?`).bind(userId, since));
  }
}

export async function getUsage(db: D1Database, userId: string, since: number): Promise<Usage> {
  const [builds, chat, sites, storage, leads] = await Promise.all(
    (["builds", "chat", "sites", "storage", "leads"] as const).map((m) => countUsage(db, userId, m, since)),
  );
  return { builds, chat, sites, storage, leads };
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
  if (meter === "leads") {
    const today = await count(
      env.DB.prepare(`select count(*) as n from agent_search where userId = ? and createdAt >= ?`).bind(user.id, Date.now() - DAY),
    );
    if (today >= DAILY_BURST.search) {
      return Response.json({ error: "That's a lot of searches for one day. Try again tomorrow." }, { status: 429 });
    }
  }
  return null;
}

// How many more of a meter the account can use this period (0 without a plan).
export async function remaining(env: CloudflareEnv, user: { id: string; email: string }, meter: Meter) {
  const access = await getAccess(env, user);
  if (!access.active || !access.limits) return 0;
  return Math.max(0, access.limits[meter] - (await countUsage(env.DB, user.id, meter, access.periodStart)));
}
