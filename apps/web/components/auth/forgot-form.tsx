"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, Mail, MailCheck } from "lucide-react";
import { authClient } from "@/lib/auth/client";
import { Field } from "./field";

export function ForgotForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError("Enter a valid email address");
    setSending(true);
    const { error } = await authClient.requestPasswordReset({ email, redirectTo: "/reset-password" });
    setSending(false);
    // Same message whether or not the account exists, so this can't be used to probe for emails.
    if (error && error.status !== 404) return setError(error.message ?? "Something went wrong. Try again.");
    setSent(true);
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      {sent ? (
        <motion.div
          key="sent"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 rounded-[20px] bg-white p-6 shadow-soft ring-1 ring-black/5"
        >
          <span className="grid size-11 place-items-center rounded-full bg-octa-600/10 text-octa-600">
            <MailCheck size={20} strokeWidth={1.75} />
          </span>
          <p className="mt-4 text-[17px] font-semibold tracking-[-0.01em]">Check your inbox</p>
          <p className="mt-1 text-[15px] leading-[1.5] text-fg-2">
            If an account exists for <span className="text-fg">{email}</span>, a reset link is on its way. It works for one hour.
          </p>
          <Link
            href="/login"
            className="mt-5 inline-flex items-center gap-1.5 text-[14px] font-medium text-octa-600 hover:text-octa-500"
          >
            <ArrowLeft size={14} /> Back to log in
          </Link>
        </motion.div>
      ) : (
        <motion.form key="form" exit={{ opacity: 0, y: -8 }} onSubmit={submit} noValidate className="mt-8 space-y-4">
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
          {error && (
            <p id="auth-error" role="alert" className="text-[13px] text-red-700">
              {error}
            </p>
          )}
          <button
            disabled={sending}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-[#0f0f0f] text-[15px] font-medium text-white transition-colors hover:bg-octa-700 disabled:opacity-60"
          >
            {sending ? "Sending…" : "Email me a reset link"} <ArrowRight size={16} />
          </button>
          <p className="text-[13px] text-fg-3">
            Remembered it?{" "}
            <Link href="/login" className="text-fg underline underline-offset-4">
              Log in
            </Link>
          </p>
        </motion.form>
      )}
    </AnimatePresence>
  );
}
