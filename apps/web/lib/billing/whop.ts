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

export class WhopError extends Error {
  constructor(
    message: string,
    // Whop's HTTP status (0 when the request never reached Whop) and its own explanation.
    readonly status = 0,
    readonly whopMessage = "",
  ) {
    super(message);
  }
}

// The human-readable part of a Whop error body: `{ error: { message } }` or `{ message }`.
function readWhopMessage(body: string) {
  try {
    const json = JSON.parse(body) as { error?: { message?: string } | string; message?: string };
    const message = typeof json.error === "string" ? json.error : (json.error?.message ?? json.message);
    return typeof message === "string" ? message.trim().slice(0, 300) : "";
  } catch {
    return body.trim().slice(0, 300);
  }
}

async function whop<T>(env: CloudflareEnv, path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  if (!env.WHOP_API_KEY) throw new WhopError("WHOP_API_KEY is not set");
  const res = await fetch(`${env.WHOP_API_BASE_URL || API}${path}`, {
    method: init.method ?? "GET",
    headers: { authorization: `Bearer ${env.WHOP_API_KEY}`, "content-type": "application/json" },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new WhopError(`Whop ${init.method ?? "GET"} ${path} failed: ${res.status} ${body}`, res.status, readWhopMessage(body));
  }
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
//
// Whop documents two ways to aim a checkout at a connected account: its platforms guide passes
// `account_id` alongside a bare plan, its API reference puts the account in `plan.company_id`.
// The guide's form goes first; if Whop rejects it, the reference form is tried once.
export async function createSaleCheckout(
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
  const plan = {
    currency,
    ...(kind === "site"
      ? { plan_type: "one_time", initial_price: price }
      : { plan_type: "renewal", billing_period: 30, renewal_price: price, initial_price: 0 }),
    application_fee_amount: feeCents / 100,
    title,
    visibility: "hidden",
  };
  type Checkout = { id: string; purchase_url: string; plan?: { id: string } | null };
  const create = (body: Record<string, unknown>) =>
    whop<Checkout>(env, "/checkout_configurations", {
      method: "POST",
      body: { mode: "payment", ...body, metadata, redirect_url: redirectUrl },
    });
  try {
    return await create({ account_id: accountId, plan });
  } catch (error) {
    if (!(error instanceof WhopError) || error.status < 400 || error.status >= 500 || error.status === 401) throw error;
    console.warn("Whop refused the account_id checkout form; retrying with plan.company_id", error.message);
    const checkout = await create({ plan: { ...plan, company_id: accountId } });
    console.warn("Whop accepted the plan.company_id checkout form");
    return checkout;
  }
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
