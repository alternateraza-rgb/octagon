// The three paid plans and what each includes. The single source of truth for limits: the API
// checks, the plan picker and Settings › Billing all read from here.
export type PlanId = "starter" | "pro" | "agency";
export type Meter = "builds" | "chat" | "sites" | "storage";
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
    limits: { builds: 150, chat: 500, sites: 5, storage: 1 * GB },
    features: ["150 AI builds and edits a month", "500 Octa chat messages", "5 live websites", "1 GB of uploads"],
  },
  {
    id: "pro",
    name: "Pro",
    price: 99,
    tagline: "For a steady stream of client work.",
    limits: { builds: 350, chat: 1500, sites: 25, storage: 5 * GB },
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
    tagline: "For teams running a web agency.",
    limits: { builds: 1500, chat: 6000, sites: 150, storage: 25 * GB },
    features: [
      "1,500 AI builds and edits a month",
      "6,000 Octa chat messages",
      "150 live websites",
      "25 GB of uploads",
      "Custom client domains (soon)",
    ],
  },
];

export const planById = (id: string | null | undefined) => PLANS.find((p) => p.id === id) ?? null;

// Whop plan ids live in wrangler vars; they aren't secret.
export function whopPlanId(env: CloudflareEnv, plan: PlanId) {
  const ids: Record<PlanId, string | undefined> = {
    starter: env.WHOP_PLAN_STARTER,
    pro: env.WHOP_PLAN_PRO,
    agency: env.WHOP_PLAN_AGENCY,
  };
  return ids[plan] || null;
}

export function planForWhopPlan(env: CloudflareEnv, whopPlan: string | undefined): PlanId | null {
  if (!whopPlan) return null;
  return PLANS.find((p) => whopPlanId(env, p.id) === whopPlan)?.id ?? null;
}

// Abuse brake on top of the monthly caps: no account needs more than this in a day.
export const DAILY_BURST: Record<"build" | "chat", number> = { build: 150, chat: 600 };

export const METER_LABEL: Record<Meter, { one: string; many: string }> = {
  builds: { one: "AI build", many: "AI builds and edits" },
  chat: { one: "chat message", many: "chat messages" },
  sites: { one: "live website", many: "live websites" },
  storage: { one: "upload", many: "upload storage" },
};

export function formatBytes(n: number) {
  if (n >= GB) return `${+(n / GB).toFixed(n >= 10 * GB ? 0 : 1)} GB`;
  if (n >= 1024 * 1024) return `${Math.round(n / (1024 * 1024))} MB`;
  return n ? `${Math.max(1, Math.round(n / 1024))} KB` : "0 MB";
}
