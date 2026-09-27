"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { Card } from "@/components/settings/card";
import { summarize, useWorkspace } from "@/components/app/workspace";
import { useToast } from "@/components/ui/toast";
import { fetchBillingStatus, type BillingStatus } from "@/lib/billing/client";
import { formatBytes, planById, type Meter } from "@/lib/billing/plans";
import { PlanCards } from "./plan-cards";

const date = new Intl.DateTimeFormat("en", { month: "long", day: "numeric", year: "numeric" });
const upcoming = (time: number) => time > Date.now();

const METERS: { id: Meter; label: string; format?: (n: number) => string }[] = [
  { id: "builds", label: "AI builds and edits" },
  { id: "chat", label: "Chat messages" },
  { id: "sites", label: "Live websites" },
  { id: "storage", label: "Upload storage", format: formatBytes },
];

// Settings › Plan and billing: the current plan, this period's usage, and the way to change or manage it.
export function Billing({ status }: { status: BillingStatus }) {
  const router = useRouter();
  const params = useSearchParams();
  const toast = useToast();
  const { openBilling, setBilling } = useWorkspace();
  const { access, usage } = status;
  const plan = planById(access.plan);

  // Back from Whop's own checkout page: wait for the webhook to switch the plan on.
  const returning = params.get("checkout") === "done";
  const notify = useRef({ toast, setBilling });
  useEffect(() => {
    notify.current = { toast, setBilling };
  });
  useEffect(() => {
    if (!returning || access.active) return;
    let stopped = false;
    let tries = 0;
    const tick = async () => {
      const next = await fetchBillingStatus();
      if (stopped) return;
      if (next?.access.active) {
        notify.current.setBilling(summarize(next));
        notify.current.toast.success(`You're on ${planById(next.access.plan)?.name ?? "your new plan"}`);
        router.replace("/dashboard/settings#billing");
        router.refresh();
        return;
      }
      if (++tries < 40) timer = setTimeout(tick, 1500);
    };
    let timer = setTimeout(tick, 500);
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [returning, access.active, router]);

  if (!access.active || !plan) {
    return (
      <Card id="billing" title="Plan and billing" description="Choose a plan to build, chat and deploy.">
        {access.pausesAt && (
          <p className="mb-5 rounded-[16px] bg-octa-600/10 px-4 py-3 text-[15px] text-octa-800 dark:text-octa-100">
            {upcoming(access.pausesAt)
              ? `Your plan has ended. Live websites stay up until ${date.format(access.pausesAt)} — renew to keep them online.`
              : "Your plan has ended and your live websites are paused. Renew to bring them back instantly."}
          </p>
        )}
        {returning && <p className="mb-5 text-[15px] text-fg-2">Confirming your payment…</p>}
        <PlanCards compact onChoose={(id, interval) => openBilling({ plan: id, interval })} />
      </Card>
    );
  }

  const state = access.comped
    ? { label: "Complimentary", tone: "good" }
    : access.status === "past_due"
      ? { label: "Payment failed", tone: "bad" }
      : access.cancelAtPeriodEnd
        ? { label: "Cancels at period end", tone: "warn" }
        : { label: "Active", tone: "good" };

  return (
    <Card id="billing" title="Plan and billing" description="Your plan and what you've used this billing month.">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <p className="font-[family-name:var(--font-display)] text-[36px] font-semibold leading-none tracking-[-0.04em]">
              {plan.name}
            </p>
            <span
              className={`rounded-full px-2.5 py-1 text-[12px] font-medium ${
                state.tone === "bad"
                  ? "bg-red-500/10 text-red-600"
                  : state.tone === "warn"
                    ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                    : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
              }`}
            >
              {state.label}
            </span>
          </div>
          <p className="mt-2 text-[15px] text-fg-2">
            {access.comped
              ? "Every Agency feature, on the house."
              : `${access.interval === "year" ? `$${(plan.yearly * 12).toLocaleString("en-US")}/year` : `$${plan.price}/month`}${
                  access.periodEnd ? ` · ${access.cancelAtPeriodEnd ? "Ends" : "Renews"} ${date.format(access.periodEnd)}` : ""
                }`}
          </p>
          {access.status === "past_due" && (
            <p className="mt-2 text-[14px] text-red-600">
              Your last payment didn&apos;t go through. Update your card to keep your plan.
            </p>
          )}
        </div>
        {!access.comped && (
          <div className="flex flex-wrap gap-2">
            {access.manageUrl && (
              <a
                href={access.manageUrl}
                target="_blank"
                rel="noopener"
                className="flex h-11 items-center gap-1.5 rounded-full px-5 text-[15px] font-medium ring-1 ring-hairline transition-colors hover:bg-fg/5"
              >
                Manage billing <ArrowUpRight size={15} />
              </a>
            )}
            <button
              onClick={() => openBilling()}
              className="flex h-11 items-center rounded-full bg-octa-600 px-5 text-[15px] font-medium text-white transition-colors hover:bg-octa-500"
            >
              Change plan
            </button>
          </div>
        )}
      </div>

      <div className="mt-7 grid gap-3 sm:grid-cols-2">
        {METERS.map((m, i) => (
          <UsageMeter
            key={m.id}
            label={m.label}
            used={usage[m.id]}
            limit={access.limits![m.id]}
            format={m.format}
            delay={i * 0.06}
          />
        ))}
      </div>
      <p className="mt-4 text-[13px] text-fg-3">
        {access.usageResetsAt
          ? `Builds and chat reset ${date.format(access.usageResetsAt)}. `
          : "Builds and chat reset each month. "}
        {!access.comped &&
          "Update your card, download receipts or cancel in Manage billing. Switching plans starts a new billing month."}
      </p>
    </Card>
  );
}

function UsageMeter({
  label,
  used,
  limit,
  format = (n) => n.toLocaleString("en-US"),
  delay,
}: {
  label: string;
  used: number;
  limit: number;
  format?: (n: number) => string;
  delay: number;
}) {
  const reduce = useReducedMotion();
  const share = limit ? Math.min(used / limit, 1) : 0;
  return (
    <div className="rounded-[18px] bg-canvas p-4 ring-1 ring-hairline">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-[14px] font-medium">{label}</p>
        <p className="text-[13px] tabular-nums text-fg-3">
          <span className={share >= 1 ? "font-medium text-red-600" : "text-fg-2"}>{format(used)}</span> of {format(limit)}
        </p>
      </div>
      <div
        className="mt-3 h-2 overflow-hidden rounded-full bg-fg/[.07]"
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={limit}
        aria-valuenow={used}
      >
        <motion.div
          className={`h-full rounded-full ${share >= 1 ? "bg-red-500" : share >= 0.8 ? "bg-amber-500" : "bg-octa-600"}`}
          initial={reduce ? false : { width: 0 }}
          whileInView={{ width: `${Math.max(share * 100, used ? 2 : 0)}%` }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 70, damping: 18, delay }}
        />
      </div>
    </div>
  );
}
