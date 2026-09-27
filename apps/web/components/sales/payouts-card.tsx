"use client";

import { useState } from "react";
import { ArrowUpRight, Check, Clock } from "lucide-react";
import { Card } from "@/components/settings/card";
import { Payouts } from "./sell-sheet";

type Seller = { verification: string; canSell: boolean } | null;

// Settings › Payouts: the seller's Whop account for getting paid when they sell sites.
export function PayoutsCard({ seller }: { seller: Seller }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const approved = seller?.verification === "approved";

  async function open() {
    setBusy(true);
    setError("");
    const res = await fetch("/api/payouts", { method: "POST" }).catch(() => null);
    const body = (await res?.json().catch(() => null)) as { url?: string; error?: string } | null;
    if (res?.ok && body?.url) {
      window.location.href = body.url;
      return;
    }
    setBusy(false);
    setError(body?.error ?? "Couldn't open Whop. Try again.");
  }

  return (
    <Card id="payouts" title="Payouts" description="Get paid when clients buy the sites you build.">
      {!seller?.canSell ? (
        <div className="max-w-[460px]">
          <Payouts seller={seller} />
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-4">
          <span
            className={`grid size-12 place-items-center rounded-full ${approved ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"}`}
          >
            {approved ? <Check size={22} strokeWidth={2.25} /> : <Clock size={22} strokeWidth={1.75} />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[17px] font-semibold">{approved ? "Ready to get paid" : "Verification in review"}</p>
            <p className="text-[14px] text-fg-2">
              {approved
                ? "Sales go to your Whop balance, after Octacore's 10%. Withdraw to your bank any time."
                : "You can already sell. Whop holds your earnings until your identity is confirmed, usually within a day."}
            </p>
          </div>
          <button
            onClick={open}
            disabled={busy}
            className="flex h-11 items-center gap-2 rounded-full bg-fg/[.06] px-5 text-[15px] font-medium hover:bg-fg/[.1] disabled:opacity-60"
          >
            {busy ? "Opening…" : approved ? "Manage payouts" : "View in Whop"} <ArrowUpRight size={15} />
          </button>
          {error && (
            <p role="alert" className="w-full rounded-[16px] bg-red-500/10 px-4 py-3 text-[14px] text-red-700 dark:text-red-300">
              {error}
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
