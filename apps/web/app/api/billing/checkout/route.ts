import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getSession } from "@/lib/auth/server";
import { getAccess } from "@/lib/billing/entitlements";
import { planById, rememberWhopPlan } from "@/lib/billing/plans";
import { createCheckout } from "@/lib/billing/whop";

// Starts a Whop checkout for one plan (creating the plan in Whop the first time). The browser embeds it, or opens `purchaseUrl` if the embed
// can't load; either way Whop's webhook activates the plan.
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Log in first." }, { status: 401 });
  const { plan: planId } = (await request.json().catch(() => ({}))) as { plan?: unknown };
  const plan = planById(typeof planId === "string" ? planId : null);
  if (!plan) return Response.json({ error: "Choose a plan." }, { status: 400 });

  const { env } = await getCloudflareContext({ async: true });
  if (!env.WHOP_API_KEY) return Response.json({ error: "Billing isn't configured yet. Try again soon." }, { status: 503 });
  const access = await getAccess(env, session.user);
  if (access.comped) return Response.json({ error: "Your account already includes every feature." }, { status: 409 });
  if (access.active && access.plan === plan.id)
    return Response.json({ error: `You're already on ${plan.name}.` }, { status: 409 });

  try {
    const checkout = await createCheckout(env, {
      plan,
      metadata: { userId: session.user.id, plan: plan.id },
      redirectUrl: `https://${env.SITES_DOMAIN}/dashboard/settings?checkout=done#billing`,
    });
    if (checkout.plan?.id) await rememberWhopPlan(env.DB, checkout.plan.id, plan.id);
    return Response.json({ id: checkout.id, purchaseUrl: checkout.purchase_url });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Couldn't start checkout. Try again in a moment." }, { status: 502 });
  }
}
