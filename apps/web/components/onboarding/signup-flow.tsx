"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight, Lock, Mail } from "lucide-react";
import { OctacoreLogo } from "@octacore/ui/logo";
import { TEMPLATES } from "@/components/templates";
import { TemplateFrame } from "@/components/templates/frame";
import { CropMarks } from "@/components/marketing/motion";
import { authClient } from "@/lib/auth/client";
import { Field } from "@/components/auth/field";
import { templateFontVariables } from "@/lib/template-fonts";
import { PlanCards } from "@/components/billing/plan-cards";
import { BillingDialog } from "@/components/billing/billing-dialog";
import type { Interval, PlanId } from "@/lib/billing/plans";

type Step = "account" | "plan" | "done";

const display = "font-[family-name:var(--font-display)] font-semibold";

export function SignupFlow({ prompt, templateSlug }: { prompt?: string; templateSlug?: string }) {
  const reduce = useReducedMotion();
  const [step, setStep] = useState<Step>("account");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [checkout, setCheckout] = useState<{ plan: PlanId; interval: Interval } | null>(null);

  const template = TEMPLATES.find((t) => t.slug === templateSlug) ?? TEMPLATES[0];
  const Preview = template.Component;

  async function createAccount(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError("Enter a valid email address");
    if (password.length < 8) return setError("Use at least 8 characters for your password");
    setSubmitting(true);
    const { error } = await authClient.signUp.email({ email, password, name: email.split("@")[0] });
    setSubmitting(false);
    if (error) {
      setError(
        error.code?.startsWith("USER_ALREADY_EXISTS")
          ? "An account with this email already exists. Log in instead."
          : (error.message ?? "Something went wrong. Try again."),
      );
      return;
    }
    setStep("plan");
  }

  const slide = {
    initial: reduce ? false : { opacity: 0, x: 24 },
    animate: { opacity: 1, x: 0 },
    exit: reduce ? undefined : { opacity: 0, x: -24 },
    transition: { type: "spring" as const, stiffness: 120, damping: 20 },
  };

  return (
    <div data-theme="light" className={`${templateFontVariables} grid min-h-dvh bg-canvas text-fg lg:grid-cols-[1fr_1fr]`}>
      <div className="dots flex flex-col px-5 py-6 sm:px-10">
        <header className="flex items-center justify-between">
          <Link href="/" aria-label="Octacore home">
            <OctacoreLogo size={24} />
          </Link>
          <StepDots step={step} />
        </header>

        <main className="mx-auto flex w-full max-w-[440px] flex-1 flex-col justify-center py-12">
          {prompt && step !== "done" && (
            <p className="mb-8 line-clamp-2 border-l-2 border-octa-600 pl-3 text-[14px] text-fg-2">
              Your idea: <span className="text-fg">{prompt}</span>
            </p>
          )}

          <AnimatePresence mode="wait" initial={false}>
            {step === "account" && (
              <motion.section key="account" {...slide}>
                <h1 className={`${display} text-[40px] leading-[1] tracking-[-0.04em]`}>Create your account</h1>
                <p className="mt-3 text-[16px] text-fg-2">Start building websites you can sell today.</p>
                <form onSubmit={createAccount} noValidate className="mt-8 space-y-4">
                  <Field
                    id="email"
                    label="Email"
                    icon={<Mail size={16} />}
                    type="email"
                    autoComplete="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(v) => {
                      setEmail(v);
                      setError("");
                    }}
                    invalid={!!error}
                  />
                  <Field
                    id="password"
                    label="Password"
                    icon={<Lock size={16} />}
                    type="password"
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(v) => {
                      setPassword(v);
                      setError("");
                    }}
                    invalid={!!error}
                  />
                  {error && (
                    <p id="auth-error" role="alert" className="text-[13px] text-red-700">
                      {error}
                    </p>
                  )}
                  <button
                    disabled={submitting}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-[#0f0f0f] text-[15px] font-medium text-white transition-colors hover:bg-octa-700 disabled:opacity-60"
                  >
                    {submitting ? "Creating account…" : "Create account"} <ArrowRight size={16} />
                  </button>
                </form>
                <p className="mt-6 text-[13px] text-fg-3">
                  Already have an account?{" "}
                  <Link href="/login" className="text-fg underline underline-offset-4">
                    Log in
                  </Link>
                </p>
              </motion.section>
            )}

            {step === "plan" && (
              <motion.section key="plan" {...slide}>
                <h1 className={`${display} text-[40px] leading-[1] tracking-[-0.04em]`}>Choose your plan</h1>
                <p className="mt-3 text-[16px] text-fg-2">Pays for itself with one sale. Cancel anytime.</p>
                <div className="mt-7">
                  <PlanCards compact onChoose={(plan, interval) => setCheckout({ plan, interval })} />
                </div>
                <p className="mt-4 flex items-center gap-1.5 text-[13px] text-fg-3">
                  <Lock size={12} /> Secure payments by Whop. Cancel anytime.
                </p>
              </motion.section>
            )}

            {step === "done" && (
              <motion.section key="done" {...slide}>
                <h1 className={`${display} text-[40px] leading-[1] tracking-[-0.04em]`}>You&apos;re in.</h1>
                <p className="mt-3 text-[16px] text-fg-2">Your plan is active and your idea is waiting in the builder.</p>
                {prompt && <p className="mt-6 bg-white p-4 text-[15px] ring-1 ring-black/10">{prompt}</p>}
                <Link
                  href={prompt ? `/dashboard/sites?prompt=${encodeURIComponent(prompt)}` : "/dashboard"}
                  className="mt-8 flex h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-[#0f0f0f] text-[15px] font-medium text-white transition-colors hover:bg-octa-700"
                >
                  {prompt ? "Build my site" : "Go to your dashboard"} <ArrowRight size={16} />
                </Link>
              </motion.section>
            )}
          </AnimatePresence>
        </main>

        <BillingDialog
          open={!!checkout}
          plan={checkout}
          theme="light"
          onClose={() => setCheckout(null)}
          onActivated={() => setStep("done")}
        />
        <p className="text-[12px] text-fg-3">
          By continuing you agree to Octacore&apos;s{" "}
          <Link href="/terms" target="_blank" className="underline underline-offset-2 hover:text-fg">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" target="_blank" className="underline underline-offset-2 hover:text-fg">
            Privacy Policy
          </Link>
          .
        </p>
      </div>

      <aside className="grain relative hidden flex-col justify-between overflow-hidden bg-octa-700 p-12 text-white lg:flex">
        <p className={`${display} max-w-[520px] text-balance text-[44px] leading-[1] tracking-[-0.04em]`}>
          Every business needs a website. Sell them one.
        </p>
        <div className="relative mx-auto w-full max-w-[560px]">
          <TemplateFrame className="aspect-[16/11] bg-white">
            <Preview preview />
          </TemplateFrame>
          <CropMarks className="bg-white" />
        </div>
        <p className="max-w-[420px] text-[15px] text-white/85">
          “Octacore took me from making $500 a month selling websites to $20k MRR.”
          <span className="mt-2 block text-white/60">— Touseef · CEO, Killzone</span>
        </p>
      </aside>
    </div>
  );
}

function StepDots({ step }: { step: Step }) {
  const steps: Step[] = ["account", "plan", "done"];
  const idx = steps.indexOf(step);
  return (
    <div className="flex items-center gap-1.5" aria-label={`Step ${idx + 1} of 3`}>
      {steps.map((s, i) => (
        <span key={s} className={`h-1.5 rounded-full transition-all ${i <= idx ? "w-6 bg-octa-600" : "w-1.5 bg-black/15"}`} />
      ))}
    </div>
  );
}
