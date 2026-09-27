// Minimal Whop REST client: the three calls billing needs.
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

// A checkout session for one plan. The metadata carries over to the payment and the membership,
// which is how the webhook knows which Octacore account paid.
export function createCheckout(
  env: CloudflareEnv,
  { planId, metadata, redirectUrl }: { planId: string; metadata: Record<string, string>; redirectUrl: string },
) {
  return whop<{ id: string; purchase_url: string }>(env, "/checkout_configurations", {
    method: "POST",
    body: { mode: "payment", plan_id: planId, metadata, redirect_url: redirectUrl },
  });
}

export const getMembership = (env: CloudflareEnv, id: string) =>
  whop<WhopMembership>(env, `/memberships/${encodeURIComponent(id)}`);

export const cancelMembership = (env: CloudflareEnv, id: string, mode: "immediate" | "at_period_end") =>
  whop<WhopMembership>(env, `/memberships/${encodeURIComponent(id)}/cancel`, {
    method: "POST",
    body: { cancellation_mode: mode },
  });
