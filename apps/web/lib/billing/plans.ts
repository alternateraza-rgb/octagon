// The three paid plans and what each includes. The single source of truth for limits: the API
// checks, the plan picker and Settings › Billing all read from here.
export type PlanId = "starter" | "pro" | "agency";
export type Meter = "builds" | "chat" | "sites" | "storage" | "leads";
export type Limits = Record<Meter, number>;
export type Interval = "month" | "year";

export type Plan = {
  id: PlanId;
  name: string;
  // Monthly price, and the per-month price when billed yearly (charged as 12× that once a year).
  price: number;
  yearly: number;
  tagline: string;
  limits: Limits;
  features: string[];
  featured?: boolean;
};

const GB = 1024 * 1024 * 1024;

export const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    price: 49,
    yearly: 40,
    tagline: "For freelancers selling their first sites.",
    limits: { builds: 150, chat: 500, sites: 5, storage: 1 * GB, leads: 100 },
    features: ["150 AI builds and edits a month", "500 Octa chat messages", "5 live websites", "1 GB of uploads"],
  },
  {
    id: "pro",
    name: "Pro",
    price: 99,
    yearly: 80,
    tagline: "For a steady stream of client work.",
    limits: { builds: 350, chat: 1500, sites: 25, storage: 5 * GB, leads: 500 },
    features: [
      "350 AI builds and edits a month",
      "1,500 Octa chat messages",
      "25 live websites",
      "5 GB of uploads",
      "Custom client domains (soon)",
    ],
    featured: true,
  },
  {
    id: "agency",
    name: "Agency",
    price: 349,
    yearly: 280,
    tagline: "For teams running a web agency.",
    limits: { builds: 1500, chat: 6000, sites: 150, storage: 25 * GB, leads: 2000 },
    features: [
      "1,500 AI builds and edits a month",
      "6,000 Octa chat messages",
      "150 live websites",
      "25 GB of uploads",
      "Custom client domains (soon)",
    ],
  },
];

// What a plan costs on an interval: the per-month figure shown on cards, and what each charge is.
export function priceFor(plan: Plan, interval: Interval) {
  return interval === "year"
    ? { perMonth: plan.yearly, charged: plan.yearly * 12, period: "year" as const, saved: (plan.price - plan.yearly) * 12 }
    : { perMonth: plan.price, charged: plan.price, period: "month" as const, saved: 0 };
}


// The best yearly saving across plans, as a whole percentage ("save up to 20%").
export const YEARLY_SAVING = Math.max(...PLANS.map((p) => Math.round((1 - p.yearly / p.price) * 100)));

export const isInterval = (value: unknown): value is Interval => value === "month" || value === "year";

export const planById = (id: string | null | undefined) => PLANS.find((p) => p.id === id) ?? null;

// Whop plans are created on the fly by checkout (see lib/billing/whop.ts); each one's id is
// recorded against the Octacore plan it sells, so webhooks can map memberships back.
export async function planForWhopPlan(
  db: D1Database,
  whopPlan: string | undefined,
): Promise<{ plan: PlanId; interval: Interval } | null> {
  if (!whopPlan) return null;
  const row = await db
    .prepare(`select plan, interval from whop_plan where whopPlanId = ?`)
    .bind(whopPlan)
    .first<{ plan: string; interval: string }>();
  const plan = planById(row?.plan)?.id;
  return plan ? { plan, interval: isInterval(row?.interval) ? row.interval : "month" } : null;
}

export function rememberWhopPlan(db: D1Database, whopPlan: string, plan: PlanId, interval: Interval) {
  return db
    .prepare(
      `insert into whop_plan (whopPlanId, plan, interval) values (?, ?, ?)
       on conflict (whopPlanId) do update set plan = excluded.plan, interval = excluded.interval`,
    )
    .bind(whopPlan, plan, interval)
    .run();
}

// Abuse brake on top of the monthly caps: no account needs more than this in a day.
export const DAILY_BURST: Record<"build" | "chat" | "search", number> = { build: 150, chat: 600, search: 40 };

export const METER_LABEL: Record<Meter, { one: string; many: string }> = {
  builds: { one: "AI build", many: "AI builds and edits" },
  chat: { one: "chat message", many: "chat messages" },
  sites: { one: "live website", many: "live websites" },
  storage: { one: "upload", many: "upload storage" },
  leads: { one: "lead", many: "Lead Finder leads" },
};

export function formatBytes(n: number) {
  if (n >= GB) return `${+(n / GB).toFixed(n >= 10 * GB ? 0 : 1)} GB`;
  if (n >= 1024 * 1024) return `${Math.round(n / (1024 * 1024))} MB`;
  return n ? `${Math.max(1, Math.round(n / 1024))} KB` : "0 MB";
}
