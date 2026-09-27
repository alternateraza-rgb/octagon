import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getSession } from "@/lib/auth/server";
import { WhopError, accountLink, createSellerAccount } from "@/lib/billing/whop";
import { UNLINKED, sellerStatus } from "@/lib/sales/seller";
import { saveSeller } from "@/lib/sales/store";

const RETURN = "https://octacore.app/dashboard/settings?payouts=done#payouts";

export async function GET() {
  const session = await getSession();
  if (!session) return Response.json({ error: "Log in first." }, { status: 401 });
  const { env } = await getCloudflareContext({ async: true });
  const seller = await sellerStatus(env, session.user.id);
  return Response.json({ seller: seller && { verification: seller.verification, canSell: seller.canSell } });
}

// Starts or resumes payouts setup: creates the seller's Whop account the first time, then returns
// a link to Whop's hosted identity verification (or, once verified, to their payouts portal).
export async function POST() {
  const session = await getSession();
  if (!session) return Response.json({ error: "Log in first." }, { status: 401 });
  const { env } = await getCloudflareContext({ async: true });
  if (!env.WHOP_API_KEY) return Response.json({ error: "Payments aren't configured yet. Try again soon." }, { status: 503 });
  try {
    let seller = await sellerStatus(env, session.user.id);
    // No account yet, or one Octacore can't collect its fee through: create a connected account.
    if (!seller || seller.verification === UNLINKED) {
      const account = await createSellerAccount(env, {
        email: session.user.email,
        title: (session.user.name || session.user.email.split("@")[0]).slice(0, 60),
        userId: session.user.id,
      });
      await saveSeller(env.DB, session.user.id, account.id, "not_started");
      seller = (await sellerStatus(env, session.user.id))!;
      if (seller.verification === UNLINKED) {
        console.error("Whop returned an account that isn't connected to the platform", session.user.id, account.id);
        return Response.json(
          {
            error:
              "Whop linked this email to a business that isn't part of Octacore, so sales can't be paid out through it. Use a different email for your Octacore account, then set up payouts again.",
          },
          { status: 409 },
        );
      }
    }
    const link = await accountLink(env, {
      accountId: seller.whopAccountId,
      returnUrl: RETURN,
      useCase: seller.verification === "approved" ? "payouts_portal" : "account_onboarding",
    });
    return Response.json({ url: link.url });
  } catch (error) {
    console.error("Payouts setup failed", error);
    if (error instanceof WhopError && error.status >= 400 && error.status < 500 && error.whopMessage) {
      return Response.json({ error: `Whop couldn't set up payouts: ${error.whopMessage}` }, { status: 502 });
    }
    return Response.json({ error: "Couldn't reach Whop to set up payouts. Try again in a moment." }, { status: 502 });
  }
}
