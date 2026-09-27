// A seller's connected Whop account and whether it can take payments yet.
import { getAccount, type WhopAccount } from "@/lib/billing/whop";
import { CAN_SELL, getSeller, saveSeller } from "./store";

const RANK = ["not_started", "rejected", "pending", "manual_review", "approved"];

// Whop verifies a person (KYC) or a business (KYB); either one counts.
export function verificationOf(account: WhopAccount) {
  const states = [account.verification?.individual?.status, account.verification?.business?.status].filter(
    (s): s is string => !!s,
  );
  return states.sort((a, b) => RANK.indexOf(b) - RANK.indexOf(a))[0] ?? "not_started";
}

// The seller's account with its verification status fresh from Whop (falls back to the stored one).
export async function sellerStatus(env: CloudflareEnv, userId: string) {
  const seller = await getSeller(env.DB, userId);
  if (!seller) return null;
  let verification = seller.verification;
  if (verification !== "approved") {
    try {
      verification = verificationOf(await getAccount(env, seller.whopAccountId));
      if (verification !== seller.verification) await saveSeller(env.DB, userId, seller.whopAccountId, verification);
    } catch (error) {
      console.error("Couldn't refresh the seller's Whop verification", userId, error);
    }
  }
  return { ...seller, verification, canSell: CAN_SELL.has(verification) };
}
