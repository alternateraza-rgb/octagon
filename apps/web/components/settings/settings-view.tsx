"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  Check,
  CreditCard,
  KeyRound,
  Laptop,
  Monitor,
  Moon,
  Palette,
  ShieldCheck,
  Smartphone,
  Sun,
  Trash2,
  User,
} from "lucide-react";
import { authClient } from "@/lib/auth/client";
import { useWorkspace, type Theme } from "@/components/app/workspace";
import { useToast } from "@/components/ui/toast";
import { Billing } from "@/components/billing/billing-section";
import { Card } from "./card";
import type { BillingStatus } from "@/lib/billing/client";

const SECTIONS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "security", label: "Security", icon: ShieldCheck },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "billing", label: "Plan and billing", icon: CreditCard },
  { id: "danger", label: "Delete account", icon: Trash2 },
] as const;

const since = new Intl.DateTimeFormat("en", { month: "long", year: "numeric" });

export function SettingsView({
  user,
  currentSessionId,
  billing,
}: {
  user: { name: string; email: string; createdAt: number };
  currentSessionId: string;
  billing: BillingStatus;
}) {
  const reduce = useReducedMotion();
  const [active, setActive] = useState<string>("profile");

  // Highlight the section being read.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-20% 0px -60% 0px" },
    );
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="h-full overflow-y-auto scroll-smooth" id="settings-scroll">
      <div className="mx-auto max-w-[1040px] px-5 pb-32 pt-12 sm:pt-16">
        <motion.h1
          initial={reduce ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 90, damping: 18 }}
          className="font-[family-name:var(--font-display)] text-[44px] font-semibold leading-[1] tracking-[-0.045em] sm:text-[56px]"
        >
          Settings
        </motion.h1>
        <p className="mt-3 text-[17px] text-fg-2">
          Member since {since.format(user.createdAt)} · {user.email}
        </p>

        <div className="mt-10 grid gap-10 lg:grid-cols-[200px_1fr]">
          <nav aria-label="Settings sections" className="hidden lg:block">
            <ul className="sticky top-6 space-y-0.5">
              {SECTIONS.map(({ id, label, icon: Icon }) => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    aria-current={active === id ? "true" : undefined}
                    className={`relative flex h-10 items-center gap-2.5 rounded-[10px] px-3 text-[14px] transition-colors ${
                      active === id ? "font-medium text-fg" : "text-fg-2 hover:text-fg"
                    }`}
                  >
                    {active === id && (
                      <motion.span
                        layoutId="settings-active"
                        className="absolute inset-0 rounded-[10px] bg-fg/[.06]"
                        transition={{ type: "spring", stiffness: 420, damping: 36 }}
                      />
                    )}
                    <Icon
                      size={16}
                      strokeWidth={1.5}
                      className={`relative ${active === id ? "text-octa-600" : ""} ${id === "danger" ? "text-red-600" : ""}`}
                    />
                    <span className="relative">{label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="min-w-0 space-y-6">
            <Profile user={user} />
            <Security email={user.email} currentSessionId={currentSessionId} />
            <Appearance />
            <Billing status={billing} />
            <Danger email={user.email} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const { label, id, ...rest } = props;
  return (
    <div>
      <label htmlFor={id} className="text-[13px] font-medium text-fg-2">
        {label}
      </label>
      <input
        id={id}
        {...rest}
        className="mt-1.5 h-11 w-full rounded-[12px] bg-canvas px-3.5 text-[15px] ring-1 ring-hairline transition-shadow placeholder:text-fg-3 focus:outline-none focus:ring-2 focus:ring-octa-600 disabled:text-fg-3"
      />
    </div>
  );
}

function PrimaryButton({ children, busy, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { busy?: boolean }) {
  return (
    <button
      {...rest}
      disabled={rest.disabled || busy}
      className="flex h-11 items-center gap-2 rounded-full bg-octa-600 px-5 text-[15px] font-medium text-white transition-colors hover:bg-octa-500 disabled:bg-fg/10 disabled:text-fg-3"
    >
      {busy ? "Saving…" : children}
    </button>
  );
}

function Profile({ user }: { user: { name: string; email: string } }) {
  const toast = useToast();
  const router = useRouter();
  const [name, setName] = useState(user.name);
  const [saved, setSaved] = useState(user.name);
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const value = name.trim();
    if (!value) return;
    setBusy(true);
    const { error } = await authClient.updateUser({ name: value });
    setBusy(false);
    if (error) return toast.error(error.message ?? "Couldn't save your name");
    setSaved(value);
    toast.success("Profile updated");
    router.refresh();
  }

  return (
    <Card id="profile" title="Profile" description="How you appear across Octacore.">
      <form onSubmit={save} className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <span className="grid size-20 shrink-0 place-items-center rounded-full bg-gradient-to-br from-octa-500 to-octa-700 text-[30px] font-semibold text-white shadow-float">
          {(name || user.email)[0]?.toUpperCase()}
        </span>
        <div className="grid flex-1 gap-4 sm:grid-cols-2">
          <Input id="name" label="Name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          <Input id="email" label="Email" value={user.email} disabled />
          <div className="sm:col-span-2">
            <PrimaryButton busy={busy} disabled={!name.trim() || name.trim() === saved}>
              Save changes
            </PrimaryButton>
          </div>
        </div>
      </form>
    </Card>
  );
}

type SessionRow = {
  id: string;
  userAgent?: string | null;
  ipAddress?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
};

function describeDevice(ua = "") {
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /Chrome\//.test(ua)
      ? "Chrome"
      : /Firefox\//.test(ua)
        ? "Firefox"
        : /Safari\//.test(ua)
          ? "Safari"
          : "Browser";
  const os = /iPhone|iPad/.test(ua)
    ? "iPhone"
    : /Android/.test(ua)
      ? "Android"
      : /Mac OS X/.test(ua)
        ? "Mac"
        : /Windows/.test(ua)
          ? "Windows"
          : /Linux/.test(ua)
            ? "Linux"
            : "device";
  return { label: `${browser} on ${os}`, mobile: os === "iPhone" || os === "Android" };
}

function Security({ email, currentSessionId }: { email: string; currentSessionId: string }) {
  const toast = useToast();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sessions, setSessions] = useState<SessionRow[] | null>(null);
  const [revoking, setRevoking] = useState(false);

  const loadSessions = () =>
    authClient
      .listSessions()
      .then(({ data }) =>
        setSessions(((data ?? []) as SessionRow[]).sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))),
      );

  useEffect(() => {
    loadSessions();
  }, []);

  async function change(e: React.FormEvent) {
    e.preventDefault();
    if (next.length < 8) return setError("Use at least 8 characters for the new password.");
    if (next !== confirm) return setError("The new passwords don't match.");
    setBusy(true);
    const { error } = await authClient.changePassword({ currentPassword: current, newPassword: next, revokeOtherSessions: true });
    setBusy(false);
    if (error)
      return setError(
        error.code === "INVALID_PASSWORD"
          ? "Your current password isn't right."
          : (error.message ?? "Couldn't change your password."),
      );
    setCurrent("");
    setNext("");
    setConfirm("");
    toast.success("Password changed");
    loadSessions();
  }

  async function sendReset() {
    const { error } = await authClient.requestPasswordReset({ email, redirectTo: "/reset-password" });
    if (error) toast.error(error.message ?? "Couldn't send the email");
    else toast.success(`Reset link sent to ${email}`);
  }

  return (
    <Card id="security" title="Security" description="Your password and the devices signed in to your account.">
      <form onSubmit={change} noValidate className="grid gap-4 sm:grid-cols-3">
        <Input
          id="current-password"
          label="Current password"
          type="password"
          autoComplete="current-password"
          value={current}
          onChange={(e) => (setCurrent(e.target.value), setError(""))}
        />
        <Input
          id="new-password"
          label="New password"
          type="password"
          autoComplete="new-password"
          placeholder="8+ characters"
          value={next}
          onChange={(e) => (setNext(e.target.value), setError(""))}
        />
        <Input
          id="confirm-password"
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => (setConfirm(e.target.value), setError(""))}
        />
        <AnimatePresence>
          {error && (
            <motion.p
              role="alert"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="text-[13px] text-red-600 sm:col-span-3"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
        <div className="flex flex-wrap items-center gap-3 sm:col-span-3">
          <PrimaryButton busy={busy} disabled={!current || !next || !confirm}>
            <KeyRound size={16} strokeWidth={1.75} /> Change password
          </PrimaryButton>
          <button
            type="button"
            onClick={sendReset}
            className="h-11 rounded-full px-4 text-[14px] font-medium text-octa-600 hover:bg-octa-600/10"
          >
            Forgot it? Email me a reset link
          </button>
        </div>
      </form>

      <div className="mt-8 border-t border-hairline pt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-[15px] font-semibold">Signed-in devices</h3>
          {sessions && sessions.length > 1 && (
            <button
              onClick={async () => {
                setRevoking(true);
                await authClient.revokeOtherSessions();
                setRevoking(false);
                toast.success("Signed out other devices");
                loadSessions();
              }}
              disabled={revoking}
              className="h-9 rounded-full px-3.5 text-[13px] font-medium text-fg-2 ring-1 ring-hairline hover:bg-fg/5 hover:text-fg disabled:opacity-60"
            >
              {revoking ? "Signing out…" : "Sign out other devices"}
            </button>
          )}
        </div>
        <ul className="mt-3 divide-y divide-hairline">
          {!sessions &&
            [0, 1].map((i) => (
              <li key={i} className="flex items-center gap-3 py-3">
                <span className="shimmer size-10 rounded-full" />
                <span className="shimmer h-4 w-40 rounded-full" />
              </li>
            ))}
          {sessions?.map((s) => {
            const device = describeDevice(s.userAgent ?? "");
            const Icon = device.mobile ? Smartphone : Laptop;
            return (
              <li key={s.id} className="flex items-center gap-3 py-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-fg/[.05] text-fg-2">
                  <Icon size={18} strokeWidth={1.5} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-medium">{device.label}</p>
                  <p className="text-[12px] text-fg-3">
                    Signed in{" "}
                    {new Date(s.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
                {s.id === currentSessionId && (
                  <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[12px] font-medium text-emerald-700 dark:text-emerald-400">
                    This device
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </Card>
  );
}

const THEMES: { id: Theme; label: string; icon: typeof Sun }[] = [
  { id: "system", label: "Match system", icon: Monitor },
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
];

function Appearance() {
  const { theme, setTheme } = useWorkspace();
  return (
    <Card id="appearance" title="Appearance" description="Choose how Octacore looks on this device.">
      <div role="radiogroup" aria-label="Theme" className="grid gap-3 sm:grid-cols-3">
        {THEMES.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            role="radio"
            aria-checked={theme === id}
            onClick={() => setTheme(id)}
            className={`group rounded-[18px] p-2 text-left ring-1 transition-all ${theme === id ? "ring-2 ring-octa-600" : "ring-hairline hover:ring-fg/20"}`}
          >
            <ThemePreview kind={id} />
            <span className="flex items-center gap-2 px-1.5 pb-1 pt-3 text-[14px] font-medium">
              <Icon size={15} strokeWidth={1.75} /> {label}
              {theme === id && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="ml-auto grid size-5 place-items-center rounded-full bg-octa-600 text-white"
                >
                  <Check size={12} strokeWidth={3} />
                </motion.span>
              )}
            </span>
          </button>
        ))}
      </div>
    </Card>
  );
}

function ThemePreview({ kind }: { kind: Theme }) {
  const pane = (dark: boolean) => (
    <div className={`flex h-full flex-1 gap-1.5 p-2 ${dark ? "bg-[#0b0b0c]" : "bg-[#f9f8f6]"}`}>
      <div className={`w-1/4 rounded-[6px] ${dark ? "bg-[#161617]" : "bg-[#eeeceb]"}`} />
      <div className="flex flex-1 flex-col gap-1.5">
        <div className={`h-2 w-2/3 rounded-full ${dark ? "bg-white/70" : "bg-black/70"}`} />
        <div className={`h-1.5 w-1/2 rounded-full ${dark ? "bg-white/25" : "bg-black/20"}`} />
        <div
          className={`mt-auto h-4 rounded-[6px] ${dark ? "bg-[#161617]" : "bg-white"} ring-1 ${dark ? "ring-white/10" : "ring-black/5"}`}
        />
      </div>
    </div>
  );
  return (
    <div className="flex h-24 overflow-hidden rounded-[12px] ring-1 ring-hairline">
      {kind === "system" ? (
        <>
          {pane(false)}
          {pane(true)}
        </>
      ) : (
        pane(kind === "dark")
      )}
    </div>
  );
}

function Danger({ email }: { email: string }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [typed, setTyped] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function remove(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await authClient.deleteUser({ password });
    setBusy(false);
    if (error)
      return setError(
        error.code === "INVALID_PASSWORD" ? "That password isn't right." : (error.message ?? "Couldn't delete your account."),
      );
    router.replace("/");
    router.refresh();
  }

  return (
    <Card
      id="danger"
      title="Delete account"
      description="Permanently delete your account, chats, websites and uploads. Live sites go offline straight away."
      tone="danger"
    >
      <button
        onClick={() => setOpen(true)}
        className="flex h-11 items-center gap-2 rounded-full px-5 text-[15px] font-medium text-red-600 ring-1 ring-red-500/30 hover:bg-red-500/10"
      >
        <Trash2 size={16} strokeWidth={1.75} /> Delete my account
      </button>
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[95] grid place-items-center px-4">
            <motion.div
              className="absolute inset-0 bg-black/30 backdrop-blur-[3px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.form
              onSubmit={remove}
              role="alertdialog"
              aria-modal
              aria-labelledby="delete-title"
              initial={reduce ? false : { opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
              className="relative w-full max-w-[420px] space-y-4 rounded-[24px] bg-elevated p-6 shadow-float ring-1 ring-hairline"
            >
              <h2 id="delete-title" className="text-[19px] font-semibold tracking-[-0.015em]">
                Delete your account?
              </h2>
              <p className="text-[15px] leading-[1.47] text-fg-2">
                This deletes <span className="text-fg">{email}</span> and everything in it. It can&apos;t be undone.
              </p>
              <Input
                id="delete-password"
                label="Your password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => (setPassword(e.target.value), setError(""))}
              />
              <Input
                id="delete-confirm"
                label='Type "delete" to confirm'
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                autoComplete="off"
              />
              {error && (
                <p role="alert" className="text-[13px] text-red-600">
                  {error}
                </p>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="h-11 rounded-full px-5 text-[15px] font-medium text-fg-2 hover:bg-fg/5"
                >
                  Cancel
                </button>
                <button
                  disabled={busy || !password || typed.trim().toLowerCase() !== "delete"}
                  className="h-11 rounded-full bg-red-600 px-5 text-[15px] font-medium text-white hover:bg-red-500 disabled:opacity-50"
                >
                  {busy ? "Deleting…" : "Delete forever"}
                </button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </Card>
  );
}
