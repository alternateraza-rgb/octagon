// The three paid plans and what each includes. The single source of truth for limits: the API
// checks, the plan picker and Settings › Billing all read from here.
export type PlanId = "starter" | "pro" | "agency";
export type Meter = "builds" | "chat" | "sites" | "storage" | "leads";
export type Limits = Record<Meter, number>;

export type Plan = {
  id: PlanId;
  name: string;
  price: number;
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
    tagline: "For freelancers selling their first sites.",
    limits: { builds: 150, chat: 500, sites: 5, storage: 1 * GB, leads: 100 },
    features: [
      "150 AI builds and edits a month",
      "500 Octa chat messages",
      "5 live websites",
      "1 GB of uploads",
      "100 Lead Finder leads a month",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 99,
    tagline: "For a steady stream of client work.",
    limits: { builds: 350, chat: 1500, sites: 25, storage: 5 * GB, leads: 500 },
    features: [
      "350 AI builds and edits a month",
      "1,500 Octa chat messages",
      "25 live websites",
      "5 GB of uploads",
      "500 Lead Finder leads a month",
      "Custom client domains (soon)",
    ],
    featured: true,
  },
  {
    id: "agency",
    name: "Agency",
    price: 349,
    tagline: "For teams running a web agency.",
    limits: { builds: 1500, chat: 6000, sites: 150, storage: 25 * GB, leads: 2000 },
    features: [
      "1,500 AI builds and edits a month",
      "6,000 Octa chat messages",
      "150 live websites",
      "25 GB of uploads",
      "2,000 Lead Finder leads a month",
      "Custom client domains (soon)",
    ],
  },
];

export const planById = (id: string | null | undefined) => PLANS.find((p) => p.id === id) ?? null;

// Whop plans are created on the fly by checkout (see lib/billing/whop.ts); each one's id is
// recorded against the Octacore plan it sells, so webhooks can map memberships back.
export async function planForWhopPlan(db: D1Database, whopPlan: string | undefined): Promise<PlanId | null> {
  if (!whopPlan) return null;
  const row = await db.prepare(`select plan from whop_plan where whopPlanId = ?`).bind(whopPlan).first<{ plan: string }>();
  return planById(row?.plan)?.id ?? null;
}

export function rememberWhopPlan(db: D1Database, whopPlan: string, plan: PlanId) {
  return db
    .prepare(`insert into whop_plan (whopPlanId, plan) values (?, ?) on conflict (whopPlanId) do update set plan = excluded.plan`)
    .bind(whopPlan, plan)
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
