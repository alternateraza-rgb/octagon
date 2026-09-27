"use client";

import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, Check } from "lucide-react";
import { PLANS, type PlanId } from "@/lib/billing/plans";

const display = "font-[family-name:var(--font-display)] font-semibold";

// The three plans side by side, Pro highlighted. `current` marks the plan the account is on.
export function PlanCards({
  current,
  busy,
  onChoose,
  compact,
}: {
  current?: PlanId | null;
  busy?: PlanId | null;
  onChoose: (plan: PlanId) => void;
  compact?: boolean;
}) {
  const reduce = useReducedMotion();
  return (
    <div className={`grid gap-3 ${compact ? "" : "md:grid-cols-3"}`}>
      {PLANS.map((plan, i) => {
        const featured = !!plan.featured;
        const isCurrent = current === plan.id;
        return (
          <motion.div
            key={plan.id}
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 140, damping: 20, delay: i * 0.05 }}
            className={`relative flex flex-col overflow-hidden rounded-[22px] p-5 sm:p-6 ${
              featured ? "grain bg-octa-700 text-white shadow-float" : "bg-elevated ring-1 ring-hairline shadow-soft"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-[17px] font-semibold tracking-[-0.01em]">{plan.name}</p>
              {isCurrent ? (
                <span
                  className={`rounded-full px-2.5 py-1 text-[12px] font-medium ${featured ? "bg-white/20" : "bg-octa-600/10 text-octa-700 dark:text-octa-400"}`}
                >
                  Current plan
                </span>
              ) : featured ? (
                <span className="rounded-full bg-white/20 px-2.5 py-1 text-[12px] font-medium">Most popular</span>
              ) : null}
            </div>
            <p className={`mt-2 ${display} text-[40px] leading-none tracking-[-0.045em]`}>
              ${plan.price}
              <span className={`text-[15px] font-medium tracking-normal ${featured ? "text-white/75" : "text-fg-3"}`}>/mo</span>
            </p>
            <p className={`mt-2 text-[14px] ${featured ? "text-white/85" : "text-fg-2"}`}>{plan.tagline}</p>
            <ul
              className={`mt-4 space-y-2 text-[14px] ${compact ? "sm:grid sm:grid-cols-2 sm:gap-x-4 sm:gap-y-2 sm:space-y-0" : ""}`}
            >
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check size={14} strokeWidth={2.5} className={`mt-[3px] shrink-0 ${featured ? "" : "text-octa-600"}`} /> {f}
                </li>
              ))}
            </ul>
            <div className="flex-1" />
            <button
              onClick={() => onChoose(plan.id)}
              disabled={isCurrent || !!busy}
              className={`mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-full text-[15px] font-medium transition-colors disabled:opacity-60 ${
                featured ? "bg-white text-octa-700 hover:bg-white/90" : "bg-fg text-canvas hover:bg-octa-600 hover:text-white"
              }`}
            >
              {busy === plan.id
                ? "Starting checkout…"
                : isCurrent
                  ? "Your plan"
                  : current
                    ? `Switch to ${plan.name}`
                    : `Choose ${plan.name}`}
              {!isCurrent && busy !== plan.id && <ArrowRight size={16} />}
            </button>
          </motion.div>
        );
      })}
    </div>
  );
}
