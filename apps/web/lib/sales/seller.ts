// A seller's connected Whop account and whether it can take payments yet.
import { getAccount, getAccountId, type WhopAccount } from "@/lib/billing/whop";
import { CAN_SELL, getSeller, saveSeller } from "./store";

const RANK = ["not_started", "rejected", "pending", "manual_review", "approved"];

// Stored as the verification status of a seller whose Whop account isn't a connected account of
// Octacore's platform (for example Octacore's own business): Whop won't take a fee on its sales.
export const UNLINKED = "unlinked";

// Whop verifies a person (KYC) or a business (KYB); either one counts.
export function verificationOf(account: WhopAccount) {
  const states = [account.verification?.individual?.status, account.verification?.business?.status].filter(
    (s): s is string => !!s,
  );
  return states.sort((a, b) => RANK.indexOf(b) - RANK.indexOf(a))[0] ?? "not_started";
}

// Whether Octacore can collect its fee on this account's sales: it has to be one of the platform's
// connected accounts, not a standalone business (or the platform itself).
export async function isConnected(env: CloudflareEnv, account: WhopAccount) {
  return !!account.parent_account && account.id !== (await getAccountId(env));
}

// The seller's account with its status fresh from Whop (falls back to the stored one).
export async function sellerStatus(env: CloudflareEnv, userId: string) {
  const seller = await getSeller(env.DB, userId);
  if (!seller) return null;
  let verification = seller.verification;
  try {
    const account = await getAccount(env, seller.whopAccountId);
    verification = (await isConnected(env, account)) ? verificationOf(account) : UNLINKED;
    if (verification !== seller.verification) await saveSeller(env.DB, userId, seller.whopAccountId, verification);
  } catch (error) {
    console.error("Couldn't refresh the seller's Whop account", userId, error);
  }
  return { ...seller, verification, canSell: CAN_SELL.has(verification) };
}
