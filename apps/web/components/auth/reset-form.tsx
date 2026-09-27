"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Lock } from "lucide-react";
import { authClient } from "@/lib/auth/client";
import { Field } from "./field";

export function ResetForm({ token, invalid }: { token: string | null; invalid: boolean }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  if (!token || invalid) {
    return (
      <div className="mt-8 rounded-[20px] bg-white p-6 shadow-soft ring-1 ring-black/5">
        <p className="text-[17px] font-semibold tracking-[-0.01em]">This link has expired</p>
        <p className="mt-1 text-[15px] text-fg-2">Reset links work once, for one hour. Ask for a new one.</p>
        <Link
          href="/forgot-password"
          className="mt-5 inline-flex items-center gap-1.5 text-[14px] font-medium text-octa-600 hover:text-octa-500"
        >
          Send a new link <ArrowRight size={14} />
        </Link>
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) return setError("Use at least 8 characters.");
    if (password !== confirm) return setError("Those passwords don't match.");
    setSaving(true);
    const { error } = await authClient.resetPassword({ newPassword: password, token: token! });
    setSaving(false);
    if (error)
      return setError(
        error.code === "INVALID_TOKEN" ? "This link has expired. Ask for a new one." : (error.message ?? "Something went wrong."),
      );
    router.replace("/login?reset=1");
  }

  return (
    <form onSubmit={submit} noValidate className="mt-8 space-y-4">
      <Field
        id="password"
        label="New password"
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
      <Field
        id="confirm"
        label="Confirm new password"
        icon={<Lock size={16} />}
        type="password"
        autoComplete="new-password"
        value={confirm}
        onChange={(v) => {
          setConfirm(v);
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
        disabled={saving}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-[#0f0f0f] text-[15px] font-medium text-white transition-colors hover:bg-octa-700 disabled:opacity-60"
      >
        {saving ? "Saving…" : "Set new password"} <ArrowRight size={16} />
      </button>
    </form>
  );
}
