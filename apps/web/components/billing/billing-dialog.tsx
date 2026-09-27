"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowUpRight, Check, Lock, X } from "lucide-react";
import { planById, type PlanId } from "@/lib/billing/plans";
import { fetchBillingStatus, type BillingStatus } from "@/lib/billing/client";
import { PlanCards } from "./plan-cards";

// Whop's embed touches `window` as it loads, so it only ever renders in the browser.
const WhopCheckoutEmbed = dynamic(() => import("@whop/checkout/react").then((m) => m.WhopCheckoutEmbed), {
  ssr: false,
  loading: () => <EmbedLoading />,
});

type Step = "plans" | "checkout" | "done";
type Session = { plan: PlanId; id: string; purchaseUrl: string };

// Choose a plan, pay in Whop's embedded checkout, then wait for the webhook to switch the plan on.
export function BillingDialog({
  open,
  plan: initialPlan,
  current,
  message,
  theme = "system",
  onClose,
  onActivated,
}: {
  open: boolean;
  // Skip straight to checkout for this plan.
  plan?: PlanId | null;
  current?: PlanId | null;
  // Why the dialog opened, e.g. a limit that was reached.
  message?: string;
  theme?: "light" | "dark" | "system";
  onClose: () => void;
  onActivated: (status: BillingStatus) => void;
}) {
  return (
    <AnimatePresence>{open && <Dialog {...{ initialPlan, current, message, theme, onClose, onActivated }} />}</AnimatePresence>
  );
}

function Dialog({
  initialPlan,
  current,
  message,
  theme,
  onClose,
  onActivated,
}: {
  initialPlan?: PlanId | null;
  current?: PlanId | null;
  message?: string;
  theme: "light" | "dark" | "system";
  onClose: () => void;
  onActivated: (status: BillingStatus) => void;
}) {
  const reduce = useReducedMotion();
  const [step, setStep] = useState<Step>(initialPlan ? "checkout" : "plans");
  const [session, setSession] = useState<Session | null>(null);
  const [busy, setBusy] = useState<PlanId | null>(null);
  const [error, setError] = useState("");
  const [slow, setSlow] = useState(false);
  const [embedReady, setEmbedReady] = useState(false);
  // Paid in the embed; waiting for Whop's webhook to switch the plan on.
  const [paid, setPaid] = useState(false);
  const activatedRef = useRef(onActivated);
  useEffect(() => {
    activatedRef.current = onActivated;
  });

  async function choose(plan: PlanId) {
    setBusy(plan);
    setError("");
    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ plan }),
    }).catch(() => null);
    const body = (await res?.json().catch(() => null)) as { id?: string; purchaseUrl?: string; error?: string } | null;
    setBusy(null);
    if (!res?.ok || !body?.id || !body.purchaseUrl) {
      setError(body?.error ?? "Couldn't start checkout. Try again.");
      setStep("plans");
      return;
    }
    setSession({ plan, id: body.id, purchaseUrl: body.purchaseUrl });
    setStep("checkout");
  }

  // Opening for a specific plan goes straight to its checkout.
  const started = useRef(false);
  useEffect(() => {
    if (initialPlan && !started.current) {
      started.current = true;
      choose(initialPlan);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reveal the embed even if it never reports its state.
  useEffect(() => {
    if (!session) return;
    const timer = setTimeout(() => setEmbedReady(true), 6000);
    return () => clearTimeout(timer);
  }, [session]);

  // Whop confirms payments to our webhook, not to the page: watch the account until the plan is on.
  // Also covers paying in Whop's own tab, which never calls back here.
  useEffect(() => {
    if (!session || step !== "checkout") return;
    let stopped = false;
    const startedAt = Date.now();
    const tick = async () => {
      const status = await fetchBillingStatus();
      if (stopped) return;
      if (status?.access.active && status.access.plan === session.plan) {
        setStep("done");
        activatedRef.current(status);
        return;
      }
      if (paid && Date.now() - startedAt > 45_000) setSlow(true);
      timer = setTimeout(tick, paid ? 1500 : 4000);
    };
    let timer = setTimeout(tick, paid ? 800 : 4000);
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [session, step, paid]);

  // Whop's embed covers the page with its own overlay while a payment processes and closes it
  // shortly after. Make sure none is left behind once checkout is over or this dialog closes.
  useEffect(() => {
    if (step !== "done") return;
    const timers = [0, 2000].map((ms) => setTimeout(clearWhopOverlays, ms));
    return () => timers.forEach(clearTimeout);
  }, [step]);
  useEffect(() => () => void setTimeout(clearWhopOverlays, 0), []);

  const plan = session ? planById(session.plan)! : null;
  const activating = step === "checkout" && paid;
  const closable = !activating || slow;
  const wide = step === "plans";

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center sm:p-6"
      onKeyDown={(e) => e.key === "Escape" && closable && onClose()}
    >
      <motion.div
        className="absolute inset-0 bg-black/35 backdrop-blur-[3px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => closable && onClose()}
      />
      <motion.div
        role="dialog"
        aria-modal
        aria-label={step === "plans" ? "Choose a plan" : "Checkout"}
        layout={!reduce}
        initial={reduce ? false : { opacity: 0, y: 40, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={reduce ? { opacity: 0 } : { opacity: 0, y: 30, scale: 0.98 }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
        className={`relative max-h-[92dvh] w-full overflow-y-auto rounded-t-[28px] bg-canvas p-5 shadow-float ring-1 ring-hairline sm:rounded-[28px] sm:p-8 ${
          wide ? "sm:max-w-[1000px]" : "sm:max-w-[520px]"
        }`}
      >
        <div className="mb-5 flex items-center gap-2">
          {step === "checkout" && !paid && !initialPlan && (
            <button
              aria-label="Back to plans"
              onClick={() => setStep("plans")}
              className="-ml-2 grid size-10 place-items-center rounded-full text-fg-2 hover:bg-fg/5 hover:text-fg"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="font-[family-name:var(--font-display)] text-[28px] font-semibold leading-[1.05] tracking-[-0.035em] sm:text-[32px]">
              {step === "plans" && (current ? "Change your plan" : "Choose your plan")}
              {step === "checkout" && !paid && plan && (paid ? "Setting up your plan…" : `Octacore ${plan.name}`)}
              {step === "done" && plan && `You're on ${plan.name}`}
            </h2>
            {step === "checkout" && plan && (
              <p className="mt-1 text-[15px] text-fg-2">
                ${plan.price}/month · cancel anytime
                {current && current !== plan.id && " · your current plan ends when this starts"}
              </p>
            )}
          </div>
          {closable && (
            <button
              aria-label="Close"
              onClick={onClose}
              className="-mr-2 grid size-10 shrink-0 place-items-center self-start rounded-full text-fg-2 hover:bg-fg/5 hover:text-fg"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <AnimatePresence mode="wait" initial={false}>
          {step === "plans" && (
            <motion.div key="plans" initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {message && (
                <p className="mb-5 rounded-[16px] bg-octa-600/10 px-4 py-3 text-[15px] text-octa-800 dark:text-octa-100">
                  {message}
                </p>
              )}
              <PlanCards current={current} busy={busy} onChoose={choose} />
              {error && (
                <p role="alert" className="mt-4 text-[14px] text-red-600">
                  {error}
                </p>
              )}
              <p className="mt-5 flex items-center justify-center gap-1.5 text-[13px] text-fg-3">
                <Lock size={12} /> Secure payments by Whop. Monthly billing, cancel anytime.
              </p>
            </motion.div>
          )}

          {step === "checkout" && session && (
            <motion.div key="checkout" initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {paid && <Activating slow={slow} />}
              {/* Stays mounted after payment so Whop can finish and close its own overlay. */}
              <div
                aria-hidden={paid || undefined}
                className={
                  paid
                    ? "pointer-events-none absolute h-0 overflow-hidden opacity-0"
                    : "relative min-h-[420px] overflow-hidden rounded-[18px]"
                }
              >
                {!embedReady && (
                  <div className="absolute inset-0">
                    <EmbedLoading />
                  </div>
                )}
                <div className={`transition-opacity duration-300 ${embedReady ? "opacity-100" : "opacity-0"}`}>
                  <WhopCheckoutEmbed
                    sessionId={session.id}
                    theme={theme}
                    skipRedirect
                    themeOptions={{ accentColor: "#c2410c", borderRadius: 12 }}
                    onStateChange={(state) => state !== "loading" && setEmbedReady(true)}
                    onComplete={() => setPaid(true)}
                  />
                </div>
              </div>
              {!paid && (
                <a
                  href={session.purchaseUrl}
                  target="_blank"
                  rel="noopener"
                  className="mt-4 flex items-center justify-center gap-1 text-[13px] text-fg-3 hover:text-fg"
                >
                  Trouble paying here? Open secure checkout in a new tab <ArrowUpRight size={13} />
                </a>
              )}
            </motion.div>
          )}

          {step === "checkout" && !session && (
            <motion.div key="starting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <EmbedLoading />
            </motion.div>
          )}

          {step === "done" && plan && (
            <motion.div
              key="done"
              initial={reduce ? false : { opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <motion.span
                initial={reduce ? false : { scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 16 }}
                className="mx-auto mt-2 grid size-16 place-items-center rounded-full bg-octa-600 text-white shadow-float"
              >
                <Check size={30} strokeWidth={2.5} />
              </motion.span>
              <ul className="mx-auto mt-6 max-w-[320px] space-y-2 text-left text-[15px] text-fg-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check size={15} strokeWidth={2.5} className="mt-[3px] shrink-0 text-octa-600" /> {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={onClose}
                className="mt-7 h-12 w-full rounded-full bg-octa-600 text-[15px] font-medium text-white transition-colors hover:bg-octa-500"
              >
                Start building
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

function Activating({ slow }: { slow: boolean }) {
  return (
    <div className="grid place-items-center py-10 text-center">
      <span className="relative grid size-16 place-items-center">
        <span className="absolute inset-0 animate-ping rounded-full bg-octa-600/20" />
        <span className="size-4 rounded-full bg-octa-600" />
      </span>
      <p className="mt-6 max-w-[340px] text-[15px] text-fg-2">
        {slow
          ? "Payment received — it's taking a little longer than usual to switch your plan on. We'll email you the moment it's ready."
          : "Payment received. Unlocking everything in your plan…"}
      </p>
    </div>
  );
}

// Removes any overlay Whop's embed left open, and the scroll lock it puts on the page.
function clearWhopOverlays() {
  document.querySelectorAll<HTMLDialogElement>("dialog[data-whop-checkout-overlay]").forEach((overlay) => {
    try {
      overlay.close();
    } catch {}
    overlay.remove();
  });
  document.body.style.overflow = "";
  document.documentElement.style.overflow = "";
}

function EmbedLoading() {
  return (
    <div className="grid min-h-[420px] place-items-center">
      <div className="w-full space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="shimmer h-12 rounded-[12px] bg-fg/[.05]" />
        ))}
        <div className="shimmer h-12 rounded-full bg-octa-600/20" />
      </div>
    </div>
  );
}
