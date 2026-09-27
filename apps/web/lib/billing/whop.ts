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

// ——— Selling sites: connected accounts ———
// Each seller gets a Whop account under Octacore's platform account. Their clients pay on it
// directly and Octacore takes an application fee, so refunds and disputes stay with the seller.

export type WhopAccount = {
  id: string;
  verification?: { individual?: { status?: string } | null; business?: { status?: string } | null } | null;
};

export const createSellerAccount = (
  env: CloudflareEnv,
  { email, title, userId }: { email: string; title: string; userId: string },
) =>
  whop<WhopAccount>(env, "/accounts", {
    method: "POST",
    body: { email, title, metadata: { octacore_user_id: userId } },
  });

export const getAccount = (env: CloudflareEnv, id: string) => whop<WhopAccount>(env, `/accounts/${encodeURIComponent(id)}`);

// A short-lived link to Whop's hosted identity verification, or to the seller's payouts portal.
export const accountLink = (
  env: CloudflareEnv,
  { accountId, returnUrl, useCase }: { accountId: string; returnUrl: string; useCase: "account_onboarding" | "payouts_portal" },
) =>
  whop<{ url: string; expires_at: string }>(env, "/account_links", {
    method: "POST",
    body: { company_id: accountId, refresh_url: returnUrl, return_url: returnUrl, use_case: useCase },
  });

// A checkout on the seller's account: the site itself (one payment) or its hosting (monthly).
// Octacore's application fee is a fixed amount charged on every payment of the plan, which is why
// the two are separate checkouts: each fee is exactly its share of that price.
export function createSaleCheckout(
  env: CloudflareEnv,
  {
    accountId,
    kind,
    cents,
    feeCents,
    currency,
    title,
    metadata,
    redirectUrl,
  }: {
    accountId: string;
    kind: "site" | "hosting";
    cents: number;
    feeCents: number;
    currency: string;
    title: string;
    metadata: Record<string, string>;
    redirectUrl: string;
  },
) {
  const price = cents / 100;
  const plan =
    kind === "site"
      ? { plan_type: "one_time", initial_price: price }
      : { plan_type: "renewal", billing_period: 30, renewal_price: price, initial_price: 0 };
  return whop<{ id: string; purchase_url: string; plan?: { id: string } | null }>(env, "/checkout_configurations", {
    method: "POST",
    body: {
      mode: "payment",
      plan: {
        company_id: accountId,
        currency,
        ...plan,
        application_fee_amount: feeCents / 100,
        title,
        visibility: "hidden",
        force_create_new_plan: true,
        product: { external_identifier: `octacore-sale-${metadata.saleId}`, title, visibility: "hidden" },
      },
      metadata,
      redirect_url: redirectUrl,
    },
  });
}

export type WhopPayment = {
  id: string;
  status?: string | null;
  substatus?: string | null;
  paid_at?: string | null;
  metadata?: Record<string, unknown> | null;
  membership?: { id: string; status: string } | null;
  user?: { id?: string; email?: string | null } | null;
};

// The payments made through one checkout on a seller's account, for confirming a sale without
// waiting for the webhook.
export async function listCheckoutPayments(env: CloudflareEnv, accountId: string, checkoutId: string) {
  const query = new URLSearchParams({ account_id: accountId, first: "10" });
  query.append("checkout_configuration_ids", checkoutId);
  return (await whop<{ data?: WhopPayment[] }>(env, `/payments?${query}`)).data ?? [];
}
