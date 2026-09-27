"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, Check } from "lucide-react";
import { PLANS, YEARLY_SAVING, priceFor, type Interval, type PlanId } from "@/lib/billing/plans";

const display = "font-[family-name:var(--font-display)] font-semibold";

// The three plans side by side, Pro highlighted, with a monthly/yearly switch (yearly by default:
// it's the better deal). `current` marks the plan the account is on.
export function PlanCards({
  current,
  busy,
  onChoose,
  compact,
  initialInterval = "year",
}: {
  current?: { plan: PlanId; interval: Interval } | null;
  busy?: PlanId | null;
  onChoose: (plan: PlanId, interval: Interval) => void;
  compact?: boolean;
  initialInterval?: Interval;
}) {
  const reduce = useReducedMotion();
  const [interval, setPeriod] = useState<Interval>(initialInterval);
  return (
    <div>
      <div className="mb-4 flex justify-center">
        <div role="radiogroup" aria-label="Billing period" className="flex rounded-full bg-fg/[.06] p-1">
          {(["month", "year"] as const).map((id) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={interval === id}
              onClick={() => setPeriod(id)}
              className={`relative flex h-9 items-center gap-2 rounded-full px-4 text-[14px] font-medium ${
                interval === id ? "text-fg" : "text-fg-2 hover:text-fg"
              }`}
            >
              {interval === id && (
                <motion.span
                  layoutId="plan-interval"
                  className="absolute inset-0 rounded-full bg-elevated shadow-soft"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
              <span className="relative">{id === "month" ? "Monthly" : "Yearly"}</span>
              {id === "year" && (
                <span className="relative rounded-full bg-octa-600/10 px-2 py-0.5 text-[12px] text-octa-700 dark:text-octa-400">
                  Save up to {YEARLY_SAVING}%
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className={`grid gap-3 ${compact ? "" : "md:grid-cols-3"}`}>
        {PLANS.map((plan, i) => {
          const featured = !!plan.featured;
          const isCurrent = current?.plan === plan.id && current.interval === interval;
          const price = priceFor(plan, interval);
          const muted = featured ? "text-white/75" : "text-fg-3";
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
              <p className={`mt-2 flex items-baseline gap-2 ${display} text-[40px] leading-none tracking-[-0.045em]`}>
                <motion.span key={`${plan.id}-${interval}`} initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                  ${price.perMonth}
                </motion.span>
                <span className={`text-[15px] font-medium tracking-normal ${muted}`}>
                  {interval === "year" && <s className="mr-1 opacity-80">${plan.price}</s>}/mo
                </span>
              </p>
              <p className={`mt-1.5 text-[13px] ${muted}`}>
                {interval === "year" ? (
                  <>
                    Billed ${price.charged.toLocaleString("en-US")} yearly ·{" "}
                    <span className={featured ? "font-medium text-white" : "font-medium text-octa-700 dark:text-octa-400"}>
                      save ${price.saved.toLocaleString("en-US")}
                    </span>
                  </>
                ) : (
                  "Billed monthly"
                )}
              </p>
              <p className={`mt-3 text-[14px] ${featured ? "text-white/85" : "text-fg-2"}`}>{plan.tagline}</p>
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
                onClick={() => onChoose(plan.id, interval)}
                disabled={isCurrent || !!busy}
                className={`mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-full text-[15px] font-medium transition-colors disabled:opacity-60 ${
                  featured ? "bg-white text-octa-700 hover:bg-white/90" : "bg-fg text-canvas hover:bg-octa-600 hover:text-white"
                }`}
              >
                {busy === plan.id
                  ? "Starting checkout…"
                  : isCurrent
                    ? "Your plan"
                    : current?.plan === plan.id
                      ? interval === "year"
                        ? "Switch to yearly"
                        : "Switch to monthly"
                      : current
                        ? `Switch to ${plan.name}`
                        : `Choose ${plan.name}`}
                {!isCurrent && busy !== plan.id && <ArrowRight size={16} />}
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
