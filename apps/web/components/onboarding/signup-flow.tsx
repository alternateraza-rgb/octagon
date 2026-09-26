"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight, Check, Mail } from "lucide-react";
import { OctacoreLogo } from "@octacore/ui/logo";
import { TEMPLATES } from "@/components/templates";
import { TemplateFrame } from "@/components/templates/frame";
import { CropMarks } from "@/components/marketing/motion";

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
  const [emailError, setEmailError] = useState("");
  const [billing, setBilling] = useState<Billing>("annual");
  const [plan, setPlan] = useState<(typeof PLANS)[number]["id"]>("pro");

  const template = TEMPLATES.find((t) => t.slug === templateSlug) ?? TEMPLATES[0];
  const Preview = template.Component;

  // TODO: wire to Supabase Auth (OAuth + magic link) once the project keys are configured.
  function continueWithEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Enter a valid email address");
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
    <div data-theme="light" className="grid min-h-dvh bg-canvas text-fg lg:grid-cols-[1fr_1fr]">
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
                <div className="mt-8 space-y-3">
                  <OAuthButton label="Continue with Google" icon={<GoogleIcon />} onClick={() => setStep("plan")} />
                  <OAuthButton label="Continue with Apple" icon={<AppleIcon />} onClick={() => setStep("plan")} />
                </div>
                <div className="my-6 flex items-center gap-3 text-[13px] text-fg-3">
                  <span className="h-px flex-1 bg-hairline" /> or <span className="h-px flex-1 bg-hairline" />
                </div>
                <form onSubmit={continueWithEmail} noValidate>
                  <label htmlFor="email" className="text-[14px] font-medium">
                    Email
                  </label>
                  <div className="relative mt-2">
                    <Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-3" />
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setEmailError("");
                      }}
                      placeholder="you@company.com"
                      aria-invalid={!!emailError}
                      aria-describedby={emailError ? "email-error" : undefined}
                      className="h-12 w-full rounded-[10px] bg-white pl-10 pr-3 text-[16px] ring-1 ring-black/10 transition-shadow focus:outline-none focus:ring-2 focus:ring-octa-600"
                    />
                  </div>
                  {emailError && (
                    <p id="email-error" className="mt-2 text-[13px] text-red-700">
                      {emailError}
                    </p>
                  )}
                  <button className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-[#0f0f0f] text-[15px] font-medium text-white transition-colors hover:bg-octa-700">
                    Continue with email <ArrowRight size={16} />
                  </button>
                </form>
                <p className="mt-6 text-[13px] text-fg-3">
                  Already have an account?{" "}
                  <button onClick={() => setStep("plan")} className="text-fg underline underline-offset-4">
                    Log in
                  </button>
                </p>
              </motion.section>
            )}

            {step === "plan" && (
              <motion.section key="plan" {...slide}>
                <button
                  onClick={() => setStep("account")}
                  className="mb-6 flex items-center gap-1.5 text-[14px] text-fg-2 hover:text-fg"
                >
                  <ArrowLeft size={14} /> Back
                </button>
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
                  The builder is the next piece we&apos;re shipping. Your idea is saved and will open there automatically.
                </p>
                {prompt && <p className="mt-6 bg-white p-4 text-[15px] ring-1 ring-black/10">{prompt}</p>}
                <Link href="/" className="mt-8 inline-flex items-center gap-1.5 text-[15px] underline underline-offset-4">
                  <ArrowLeft size={14} /> Back to home
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

function OAuthButton({ label, icon, onClick }: { label: string; icon: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex h-12 w-full items-center justify-center gap-3 rounded-[10px] bg-white text-[15px] font-medium ring-1 ring-black/10 transition-shadow hover:ring-black/25"
    >
      {icon}
      {label}
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 38.2 44 33 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="16" height="18" viewBox="0 0 814 1000" aria-hidden fill="currentColor">
      <path d="M788 341c-6 4-108 62-108 190 0 148 130 200 134 202-1 3-21 72-69 142-43 62-88 124-156 124s-86-40-165-40c-77 0-104 41-167 41s-106-58-156-128C44 790 0 671 0 557c0-182 118-279 235-279 62 0 114 41 153 41 37 0 95-43 166-43 27 0 124 2 188 97zM554 169c29-35 50-83 50-131 0-7-1-14-2-19-48 2-104 32-138 72-27 30-52 78-52 127 0 7 1 15 2 17 3 1 8 1 13 1 43 0 97-29 127-67z" />
    </svg>
  );
}
