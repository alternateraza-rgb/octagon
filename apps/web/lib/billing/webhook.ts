// Whop webhooks at POST /api/whop/webhook, served from the Worker entry so the raw body reaches the
// signature check untouched. Keeps each account's `subscription` row in step with its membership.
import { sendEmail } from "@/lib/email/send";
import { planActivatedEmail, planEndedEmail } from "@/lib/email/templates";
import { ACTIVE, GRACE_DAYS, getSubscription } from "./entitlements";
import { planById, planForWhopPlan, type PlanId } from "./plans";
import { resumeSites } from "./site-access";
import { cancelMembership, getMembership, type WhopMembership } from "./whop";

const TOLERANCE_SECONDS = 5 * 60;

type WhopEvent = { id?: string; type: string; data: Record<string, unknown> };

export function routeWhopWebhook(request: Request, env: CloudflareEnv, ctx: ExecutionContext) {
  const { pathname } = new URL(request.url);
  if (pathname !== "/api/whop/webhook") return null;
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
  return handle(request, env, ctx);
}

async function handle(request: Request, env: CloudflareEnv, ctx: ExecutionContext) {
  if (!env.WHOP_WEBHOOK_SECRET) {
    console.error("WHOP_WEBHOOK_SECRET is not set");
    return new Response("Not configured", { status: 503 });
  }
  const body = await request.text();
  const id = request.headers.get("webhook-id") ?? "";
  const timestamp = request.headers.get("webhook-timestamp") ?? "";
  const signature = request.headers.get("webhook-signature") ?? "";
  if (!(await verifySignature(env.WHOP_WEBHOOK_SECRET, id, timestamp, body, signature))) {
    return new Response("Invalid signature", { status: 401 });
  }

  let event: WhopEvent;
  try {
    event = JSON.parse(body);
  } catch {
    return new Response("Bad JSON", { status: 400 });
  }
  // Retries reuse the message id: handle each one once.
  const fresh = await env.DB.prepare(`insert into billing_event (id, type, receivedAt) values (?, ?, ?) on conflict do nothing`)
    .bind(id, event.type, Date.now())
    .run();
  if (!fresh.meta.changes) return new Response("Already handled");

  try {
    await dispatch(env, ctx, event);
  } catch (error) {
    // Let Whop retry: forget the message so the retry isn't skipped as a duplicate.
    console.error("Whop webhook failed", event.type, error);
    await env.DB.prepare(`delete from billing_event where id = ?`).bind(id).run();
    return new Response("Failed", { status: 500 });
  }
  return new Response("OK");
}

// Standard Webhooks: base64 HMAC-SHA256 of `${id}.${timestamp}.${body}`, sent as `v1,<sig>` (several
// may be listed, space-separated, while a secret rotates).
export async function verifySignature(secret: string, id: string, timestamp: string, body: string, header: string) {
  if (!id || !timestamp || !header) return false;
  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > TOLERANCE_SECONDS) return false;
  const expected = new Set<string>();
  for (const key of secretKeys(secret)) {
    const hmac = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const mac = await crypto.subtle.sign("HMAC", hmac, new TextEncoder().encode(`${id}.${timestamp}.${body}`));
    expected.add(btoa(String.fromCharCode(...new Uint8Array(mac))));
  }
  return header
    .split(" ")
    .map((part) => part.split(","))
    .some(([version, sig]) => version === "v1" && !!sig && [...expected].some((e) => safeEqual(e, sig)));
}

// Whop signs with the secret exactly as shown in its dashboard; `whsec_` secrets from other Standard
// Webhooks senders are base64 keys.
function secretKeys(secret: string): Uint8Array<ArrayBuffer>[] {
  const keys = [new TextEncoder().encode(secret)];
  if (secret.startsWith("whsec_")) {
    try {
      keys.push(Uint8Array.from(atob(secret.slice(6)), (c) => c.charCodeAt(0)));
    } catch {}
  }
  return keys;
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function dispatch(env: CloudflareEnv, ctx: ExecutionContext, event: WhopEvent) {
  const data = event.data ?? {};
  switch (event.type) {
    case "membership.activated":
      return syncMembership(env, ctx, data as WhopMembership, { activated: true });
    case "membership.cancel_at_period_end_changed":
      return syncMembership(env, ctx, data as WhopMembership, { activated: false });
    case "membership.deactivated":
      return deactivate(env, ctx, data as WhopMembership);
    case "payment.succeeded": {
      // A renewal: re-read the membership for its new period.
      const membershipId = (data.membership as { id?: string } | undefined)?.id;
      if (membershipId) await syncMembership(env, ctx, await getMembership(env, membershipId), { activated: false });
      return;
    }
    case "payment.failed": {
      const membershipId = (data.membership as { id?: string } | undefined)?.id;
      if (membershipId) {
        await env.DB.prepare(
          `update subscription set status = 'past_due', updatedAt = ? where whopMembershipId = ? and endedAt is null`,
        )
          .bind(Date.now(), membershipId)
          .run();
      }
      return;
    }
  }
}

const time = (iso: string | null | undefined) => (iso ? Date.parse(iso) || null : null);

// Finds the Octacore account a membership belongs to: the userId our checkout attached, then a
// membership we already know, then the buyer's email (for purchases made straight on Whop).
async function resolveUser(env: CloudflareEnv, m: WhopMembership) {
  const fromMetadata = typeof m.metadata?.userId === "string" ? m.metadata.userId : null;
  if (fromMetadata) {
    const user = await env.DB.prepare(`select id from user where id = ?`).bind(fromMetadata).first<{ id: string }>();
    if (user) return user.id;
  }
  const known = await env.DB.prepare(`select userId from subscription where whopMembershipId = ?`)
    .bind(m.id)
    .first<{ userId: string }>();
  if (known) return known.userId;
  if (m.user?.email) {
    const user = await env.DB.prepare(`select id from user where lower(email) = lower(?)`)
      .bind(m.user.email)
      .first<{ id: string }>();
    if (user) return user.id;
  }
  return null;
}

async function syncMembership(
  env: CloudflareEnv,
  ctx: ExecutionContext,
  m: WhopMembership,
  { activated }: { activated: boolean },
) {
  const userId = await resolveUser(env, m);
  if (!userId) return console.warn("Whop membership for an unknown account", m.id);
  const metaPlan = typeof m.metadata?.plan === "string" ? m.metadata.plan : null;
  const plan: PlanId | null = planForWhopPlan(env, m.plan?.id) ?? planById(metaPlan)?.id ?? null;
  if (!plan) return console.warn("Whop membership for a plan Octacore doesn't sell", m.id, m.plan?.id);

  const existing = await getSubscription(env.DB, userId);
  const isActive = ACTIVE.has(m.status);
  if (existing?.whopMembershipId && existing.whopMembershipId !== m.id) {
    // An older membership reporting in after a plan change: nothing to do.
    if (!isActive) return;
    // A new plan replaced the old one: end the old membership now so it isn't billed again.
    if (ACTIVE.has(existing.status) && !existing.endedAt) {
      await cancelMembership(env, existing.whopMembershipId, "immediate").catch((error) =>
        console.error("Couldn't cancel the replaced membership", existing.whopMembershipId, error),
      );
    }
  }

  const now = Date.now();
  const wasActive = !!existing && ACTIVE.has(existing.status) && !existing.endedAt;
  const endedAt = isActive ? null : (existing?.endedAt ?? now);
  await env.DB.prepare(
    `insert into subscription (userId, plan, status, whopMembershipId, whopUserId, periodStart, periodEnd, cancelAtPeriodEnd, manageUrl, endedAt, updatedAt)
     values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     on conflict (userId) do update set plan = excluded.plan, status = excluded.status, whopMembershipId = excluded.whopMembershipId,
       whopUserId = excluded.whopUserId, periodStart = excluded.periodStart, periodEnd = excluded.periodEnd,
       cancelAtPeriodEnd = excluded.cancelAtPeriodEnd, manageUrl = excluded.manageUrl, endedAt = excluded.endedAt, updatedAt = excluded.updatedAt`,
  )
    .bind(
      userId,
      plan,
      m.status,
      m.id,
      m.user?.id ?? existing?.whopUserId ?? null,
      time(m.renewal_period_start),
      time(m.renewal_period_end),
      m.cancel_at_period_end ? 1 : 0,
      m.manage_url ?? existing?.manageUrl ?? null,
      endedAt,
      now,
    )
    .run();

  if (isActive) {
    await resumeSites(env, userId);
    const changedPlan = existing?.plan !== plan || existing?.whopMembershipId !== m.id;
    if (activated && (!wasActive || changedPlan)) {
      const user = await env.DB.prepare(`select name, email from user where id = ?`)
        .bind(userId)
        .first<{ name: string; email: string }>();
      const details = planById(plan)!;
      if (user)
        ctx.waitUntil(
          sendEmail(env, planActivatedEmail({ to: user.email, name: user.name, plan: details.name, features: details.features })),
        );
    }
  }
}

async function deactivate(env: CloudflareEnv, ctx: ExecutionContext, m: WhopMembership) {
  const sub = await env.DB.prepare(`select userId, endedAt from subscription where whopMembershipId = ?`)
    .bind(m.id)
    .first<{ userId: string; endedAt: number | null }>();
  // Only the account's current membership matters; one replaced by a plan change ends quietly.
  if (!sub || sub.endedAt) return;
  const now = Date.now();
  const status = ACTIVE.has(m.status) ? "expired" : m.status;
  await env.DB.prepare(`update subscription set status = ?, endedAt = ?, cancelAtPeriodEnd = 0, updatedAt = ? where userId = ?`)
    .bind(status, now, now, sub.userId)
    .run();
  const user = await env.DB.prepare(`select name, email from user where id = ?`)
    .bind(sub.userId)
    .first<{ name: string; email: string }>();
  if (user) {
    ctx.waitUntil(
      sendEmail(env, planEndedEmail({ to: user.email, name: user.name, pausesAt: now + GRACE_DAYS * 24 * 60 * 60 * 1000 })),
    );
  }
}
