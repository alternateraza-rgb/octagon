// Minimal Whop REST client: the calls billing needs.
import type { Plan } from "./plans";

const API = "https://api.whop.com/api/v1";

export type WhopMembership = {
  id: string;
  status: string;
  plan?: { id: string } | null;
  user?: { id: string; email?: string | null } | null;
  metadata?: Record<string, unknown> | null;
  renewal_period_start?: string | null;
  renewal_period_end?: string | null;
  cancel_at_period_end?: boolean;
  manage_url?: string | null;
};

export class WhopError extends Error {}

async function whop<T>(env: CloudflareEnv, path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  if (!env.WHOP_API_KEY) throw new WhopError("WHOP_API_KEY is not set");
  const res = await fetch(`${env.WHOP_API_BASE_URL || API}${path}`, {
    method: init.method ?? "GET",
    headers: { authorization: `Bearer ${env.WHOP_API_KEY}`, "content-type": "application/json" },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });
  if (!res.ok)
    throw new WhopError(`Whop ${init.method ?? "GET"} ${path} failed: ${res.status} ${await res.text().catch(() => "")}`);
  return res.json() as Promise<T>;
}

// The Whop business the API key belongs to (biz_…), needed to create plans. It never changes, so
// it's kept in memory and in KV after the first lookup.
let accountId: string | null = null;
export async function getAccountId(env: CloudflareEnv) {
  if (accountId) return accountId;
  accountId = await env.SITES.get("billing:account");
  if (!accountId) {
    accountId = (await whop<{ id: string }>(env, "/accounts/me")).id;
    await env.SITES.put("billing:account", accountId);
  }
  return accountId;
}

// A checkout session for one Octacore plan. The plan is described inline rather than by id: Whop
// finds the "Octacore" product by its external identifier (creating it the first time) and reuses
// the monthly plan with the same price, so nothing has to be set up by hand in Whop. The metadata
// carries over to the payment and the membership, which is how the webhook knows who paid.
export async function createCheckout(
  env: CloudflareEnv,
  { plan, metadata, redirectUrl }: { plan: Plan; metadata: Record<string, string>; redirectUrl: string },
) {
  return whop<{ id: string; purchase_url: string; plan?: { id: string } | null }>(env, "/checkout_configurations", {
    method: "POST",
    body: {
      mode: "payment",
      plan: {
        company_id: await getAccountId(env),
        currency: "usd",
        plan_type: "renewal",
        billing_period: 30,
        // Charged every month, starting at purchase; initial_price would be an extra one-off fee.
        renewal_price: plan.price,
        initial_price: 0,
        title: `Octacore ${plan.name}`,
        visibility: "hidden",
        product: { external_identifier: "octacore", title: "Octacore", visibility: "hidden" },
      },
      metadata,
      redirect_url: redirectUrl,
    },
  });
}

export const getMembership = (env: CloudflareEnv, id: string) =>
  whop<WhopMembership>(env, `/memberships/${encodeURIComponent(id)}`);

export const cancelMembership = (env: CloudflareEnv, id: string, mode: "immediate" | "at_period_end") =>
  whop<WhopMembership>(env, `/memberships/${encodeURIComponent(id)}/cancel`, {
    method: "POST",
    body: { cancellation_mode: mode },
  });
