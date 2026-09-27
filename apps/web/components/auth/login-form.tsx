"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Lock, Mail } from "lucide-react";
import { authClient } from "@/lib/auth/client";
import { Field } from "./field";

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function logIn(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return setError("Enter your email and password");
    setSubmitting(true);
    const { error } = await authClient.signIn.email({ email, password });
    if (error) {
      setSubmitting(false);
      setError(
        error.code === "INVALID_EMAIL_OR_PASSWORD"
          ? "That email and password don’t match."
          : (error.message ?? "Something went wrong. Try again."),
      );
      return;
    }
    router.replace(next);
    router.refresh();
  }

  return (
    <>
      <form onSubmit={logIn} noValidate className="mt-8 space-y-4">
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
          autoComplete="current-password"
          value={password}
          onChange={(v) => {
            setPassword(v);
            setError("");
          }}
          invalid={!!error}
        />
        <div className="-mt-1 flex justify-end">
          <Link href="/forgot-password" className="text-[13px] text-fg-2 underline-offset-4 hover:text-fg hover:underline">
            Forgot password?
          </Link>
        </div>
        {error && (
          <p id="auth-error" role="alert" className="text-[13px] text-red-700">
            {error}
          </p>
        )}
        <button
          disabled={submitting}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-[#0f0f0f] text-[15px] font-medium text-white transition-colors hover:bg-octa-700 disabled:opacity-60"
        >
          {submitting ? "Logging in…" : "Log in"} <ArrowRight size={16} />
        </button>
      </form>
      <p className="mt-6 text-[13px] text-fg-3">
        New to Octacore?{" "}
        <Link href="/start" className="text-fg underline underline-offset-4">
          Create an account
        </Link>
      </p>
    </>
  );
}
