"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { useWorkspace } from "@/components/app/workspace";
import { PlanCards } from "./plan-cards";

const day = new Intl.DateTimeFormat("en", { month: "long", day: "numeric" });
const upcoming = (time: number) => time > Date.now();

// What an account without an active plan sees in place of the workspace.
export function Paywall() {
  const reduce = useReducedMotion();
  const { me, billing, openBilling } = useWorkspace();
  const lapsed = !!billing.pausesAt;
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-[1040px] px-5 pb-24 pt-12 sm:pt-20">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 90, damping: 18 }}
          className="max-w-[640px]"
        >
          <p className="text-[15px] font-medium text-octa-600">
            {lapsed ? "Your plan has ended" : `Welcome, ${me.name.split(" ")[0]}`}
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-[40px] font-semibold leading-[1] tracking-[-0.045em] sm:text-[56px]">
            {lapsed ? "Pick up where you left off." : "Choose a plan to start building."}
          </h1>
          <p className="mt-4 text-[17px] text-fg-2">
            {lapsed
              ? upcoming(billing.pausesAt!)
                ? `Your live websites stay up until ${day.format(billing.pausesAt!)}. Renew before then and nothing changes for your clients.`
                : "Your live websites are paused. Renew and they're back online within seconds, at the same addresses."
              : "Every plan includes the AI website builder, Octa chat and hosting on octacore.app. One sale pays for it."}
          </p>
        </motion.div>
        <div className="mt-10">
          <PlanCards onChoose={(plan, interval) => openBilling({ plan, interval })} />
        </div>
        <p className="mt-6 text-[14px] text-fg-3">
          Secure payments by Whop · Cancel anytime ·{" "}
          <Link href="/dashboard/settings" className="text-fg-2 underline underline-offset-4 hover:text-fg">
            Account settings
          </Link>
        </p>
      </div>
    </div>
  );
}
