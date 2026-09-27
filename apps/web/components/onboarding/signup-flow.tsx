"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight, Check, Lock, Mail } from "lucide-react";
import { OctacoreLogo } from "@octacore/ui/logo";
import { TEMPLATES } from "@/components/templates";
import { TemplateFrame } from "@/components/templates/frame";
import { CropMarks } from "@/components/marketing/motion";
import { authClient } from "@/lib/auth/client";
import { Field } from "@/components/auth/field";
import { templateFontVariables } from "@/lib/template-fonts";

type Step = "account" | "plan" | "done";
type Billing = "annual" | "monthly";

const display = "font-[family-name:var(--font-display)] font-semibold";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: { annual: 0, monthly: 0 },
    tagline: "Try Octacore and build your first sites.",
    features: ["3 draft websites", "All templates", "General AI chat", "Manual ownership transfer"],
  },
  {
    id: "pro",
    name: "Pro",
    price: { annual: 29, monthly: 36 },
    tagline: "Everything you need to run a web business.",
    features: ["Unlimited websites", "Sell with checkout links", "Custom domains", "Octa Agents", "Lower platform fees"],
    featured: true,
  },
] as const;

export function SignupFlow({ prompt, templateSlug }: { prompt?: string; templateSlug?: string }) {
  const reduce = useReducedMotion();
  const [step, setStep] = useState<Step>("account");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [billing, setBilling] = useState<Billing>("annual");
  const [plan, setPlan] = useState<(typeof PLANS)[number]["id"]>("pro");

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
      setError(error.code?.startsWith("USER_ALREADY_EXISTS") ? "An account with this email already exists. Log in instead." : error.message ?? "Something went wrong. Try again.");
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
                <p className="mt-3 text-[16px] text-fg-2">Pays for itself with one sale. Change or cancel anytime.</p>

                <div role="radiogroup" aria-label="Billing period" className="mt-7 inline-flex rounded-full bg-black/5 p-1 text-[14px]">
                  {(["annual", "monthly"] as const).map((b) => (
                    <button
                      key={b}
                      role="radio"
                      aria-checked={billing === b}
                      onClick={() => setBilling(b)}
                      className={`rounded-full px-4 py-1.5 transition-colors ${billing === b ? "bg-white shadow-sm" : "text-fg-2"}`}
                    >
                      {b === "annual" ? "Yearly · save 20%" : "Monthly"}
                    </button>
                  ))}
                </div>

                <div role="radiogroup" aria-label="Plan" className="mt-5 space-y-3">
                  {PLANS.map((p) => {
                    const selected = plan === p.id;
                    return (
                      <button
                        key={p.id}
                        role="radio"
                        aria-checked={selected}
                        onClick={() => setPlan(p.id)}
                        className={`relative block w-full p-5 text-left transition-colors ${
                          selected
                            ? p.id === "pro"
                              ? "grain bg-octa-600 text-white"
                              : "bg-white ring-2 ring-[#0f0f0f]"
                            : "bg-white ring-1 ring-black/10 hover:ring-black/25"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="flex items-center gap-2 text-[17px] font-medium">
                              {p.name}
                              {"featured" in p && (
                                <span className={`rounded-full px-2 py-0.5 text-[11px] ${selected ? "bg-white/20" : "bg-octa-600/10 text-octa-700"}`}>
                                  Most popular
                                </span>
                              )}
                            </p>
                            <p className={`mt-1 text-[14px] ${selected && p.id === "pro" ? "text-white/85" : "text-fg-2"}`}>{p.tagline}</p>
                          </div>
                          <p className={`${display} shrink-0 text-[36px] leading-none tracking-[-0.04em]`}>
                            ${p.price[billing]}
                            <span className="text-[15px]">/mo</span>
                          </p>
                        </div>
                        <ul className="mt-4 grid grid-cols-1 gap-x-4 gap-y-1.5 text-[14px] sm:grid-cols-2">
                          {p.features.map((f) => (
                            <li key={f} className="flex items-center gap-2">
                              <Check size={14} strokeWidth={2.5} className="shrink-0" /> {f}
                            </li>
                          ))}
                        </ul>
                      </button>
                    );
                  })}
                </div>
                {plan === "pro" && billing === "annual" && (
                  <p className="mt-3 text-[13px] text-fg-3">Billed annually at $348. Taxes may apply.</p>
                )}
                {/* TODO: Pro → Stripe Checkout session; Free → straight to the builder. */}
                <button
                  onClick={() => setStep("done")}
                  className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-[#0f0f0f] text-[15px] font-medium text-white transition-colors hover:bg-octa-700"
                >
                  {plan === "free" ? "Start for free" : "Continue to payment"} <ArrowRight size={16} />
                </button>
                <p className="mt-4 text-[13px] text-fg-3">
                  Running an agency?{" "}
                  <a href="mailto:sales@octacore.site" className="text-fg underline underline-offset-4">
                    Talk to us
                  </a>
                </p>
              </motion.section>
            )}

            {step === "done" && (
              <motion.section key="done" {...slide}>
                <h1 className={`${display} text-[40px] leading-[1] tracking-[-0.04em]`}>You&apos;re in.</h1>
                <p className="mt-3 text-[16px] text-fg-2">
                  Your idea is waiting in the builder.
                </p>
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

        <p className="text-[12px] text-fg-3">
          By continuing you agree to Octacore&apos;s Terms of Service and Privacy Policy.
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
