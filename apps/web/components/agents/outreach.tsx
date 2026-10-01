"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, ChevronDown, CircleAlert, Inbox, Mail, Pause, Play, Send, Sparkles, Unplug, Zap } from "lucide-react";
import type { OutreachState } from "@/lib/outreach/state";
import type { SequenceStatus, SequenceSummary } from "@/lib/outreach/store";
import { useToast } from "@/components/ui/toast";
import { BusinessPhoto } from "./parts";

export const SEQUENCE_STATUS: Record<SequenceStatus, { label: string; tone: string }> = {
  active: { label: "Emailing", tone: "bg-sky-500/15 text-sky-700 dark:text-sky-300" },
  replied: { label: "Replied", tone: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" },
  finished: { label: "No reply yet", tone: "bg-fg/[.07] text-fg-2" },
  stopped: { label: "Stopped", tone: "bg-fg/[.05] text-fg-3" },
  bounced: { label: "Bounced", tone: "bg-red-500/12 text-red-700 dark:text-red-300" },
  unsubscribed: { label: "Unsubscribed", tone: "bg-fg/[.05] text-fg-3" },
  failed: { label: "Failed", tone: "bg-red-500/12 text-red-700 dark:text-red-300" },
};

const NOTICES: Record<string, { tone: "good" | "bad"; text: string }> = {
  connected: { tone: "good", text: "Outlook is connected. Octa sends from your own inbox." },
  declined: { tone: "bad", text: "Outlook wasn't connected. You can try again any time." },
  expired: { tone: "bad", text: "That took too long. Connect Outlook again." },
  error: { tone: "bad", text: "Microsoft didn't let Octa connect. Try again, or use a different account." },
  unavailable: { tone: "bad", text: "Outlook isn't switched on for Octacore yet." },
};

const when = (at: number) => {
  const d = new Date(at);
  const days = Math.round((d.setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "tomorrow";
  return new Intl.DateTimeFormat("en", { weekday: "short", month: "short", day: "numeric" }).format(at);
};

// The Outreach tab: connect an inbox, say who's sending and what they offer, then watch the emails go.
export function Outreach({
  state,
  onState,
  notice,
  onOpenLead,
}: {
  state: OutreachState;
  onState: (s: OutreachState) => void;
  notice: string | null;
  onOpenLead: (leadId: string) => void;
}) {
  const reduce = useReducedMotion();
  const toast = useToast();
  const connected = state.mailbox?.status === "connected";
  const ready = connected && !!state.settings;
  const [shownNotice, setShownNotice] = useState(notice);

  async function save(change: Record<string, unknown>) {
    const res = await fetch("/api/agents/outreach", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(change),
    }).catch(() => null);
    const body = (await res?.json().catch(() => null)) as (OutreachState & { error?: string }) | null;
    if (res?.ok && body?.mailbox !== undefined) {
      onState(body);
      return null;
    }
    return body?.error ?? "Couldn't save that.";
  }

  async function disconnect() {
    const res = await fetch("/api/agents/mailbox", { method: "DELETE" }).catch(() => null);
    if (res?.ok) {
      onState({ ...state, mailbox: null });
      toast.success("Outlook disconnected");
    } else toast.error("Couldn't disconnect");
  }

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {shownNotice && NOTICES[shownNotice] && (
          <motion.div
            initial={reduce ? false : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            className={`flex items-center gap-3 rounded-[18px] px-4 py-3 text-[15px] ${
              NOTICES[shownNotice].tone === "good"
                ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
                : "bg-amber-500/10 text-amber-800 dark:text-amber-200"
            }`}
          >
            {NOTICES[shownNotice].tone === "good" ? <Check size={18} strokeWidth={2} /> : <CircleAlert size={18} strokeWidth={1.75} />}
            <span className="flex-1">{NOTICES[shownNotice].text}</span>
            <button onClick={() => setShownNotice(null)} className="text-[13px] font-medium opacity-70 hover:opacity-100">
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {!connected ? (
        <ConnectInbox available={state.outlookAvailable} broken={state.mailbox?.status === "error" ? state.mailbox : null} />
      ) : (
        <MailboxPanel state={state} onSave={save} onDisconnect={disconnect} />
      )}

      {connected && <SetupCard state={state} onSave={save} open={!state.settings} />}

      {ready && <Activity sequences={state.sequences} onOpenLead={onOpenLead} />}
    </div>
  );
}

function ConnectInbox({ available, broken }: { available: boolean; broken: { email: string; error: string | null } | null }) {
  return (
    <section className="overflow-hidden rounded-[28px] bg-elevated shadow-soft ring-1 ring-hairline dark:shadow-none">
      <div className="relative px-6 pb-8 pt-10 sm:px-10">
        <div aria-hidden className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-octa-500/10 blur-3xl" />
        <span className="grid size-12 place-items-center rounded-[16px] bg-octa-600/10 text-octa-600">
          <Send size={22} strokeWidth={1.5} />
        </span>
        <h2 className="mt-5 max-w-[520px] text-[28px] font-semibold leading-tight tracking-[-0.025em] text-balance sm:text-[32px]">
          {broken ? "Reconnect your inbox" : "Let Octa email them for you"}
        </h2>
        <p className="mt-2 max-w-[560px] text-[16px] leading-[1.5] text-fg-2">
          {broken
            ? `${broken.email} stopped working with Octacore. ${broken.error ?? ""} Connect it again and Octa picks up where it left off.`
            : "Connect your own inbox. Octa writes a short, personal email for each business, sends it from your address, follows up twice, and stops the moment they reply."}
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <a
            href={available ? "/api/agents/mailbox/microsoft/connect" : undefined}
            aria-disabled={!available}
            className={`group flex items-center gap-4 rounded-[22px] p-4 ring-1 transition-all ${
              available
                ? "bg-canvas ring-hairline hover:-translate-y-0.5 hover:shadow-soft hover:ring-octa-600/30"
                : "pointer-events-none bg-fg/[.02] opacity-60 ring-hairline"
            }`}
          >
            <OutlookLogo />
            <div className="min-w-0 flex-1">
              <p className="text-[16px] font-semibold">Outlook</p>
              <p className="text-[13px] text-fg-2">{available ? "Outlook.com or Microsoft 365" : "Not switched on yet"}</p>
            </div>
            {available && (
              <span className="rounded-full bg-octa-600 px-3.5 py-1.5 text-[13px] font-medium text-white transition-colors group-hover:bg-octa-500">
                Connect
              </span>
            )}
          </a>
          <div className="flex items-center gap-4 rounded-[22px] bg-fg/[.02] p-4 ring-1 ring-hairline" aria-disabled>
            <GmailLogo />
            <div className="min-w-0 flex-1 opacity-70">
              <p className="text-[16px] font-semibold">Gmail</p>
              <p className="text-[13px] text-fg-2">Google Workspace too</p>
            </div>
            <span className="rounded-full bg-fg/[.07] px-3 py-1.5 text-[12px] font-semibold text-fg-2">Coming soon</span>
          </div>
        </div>

        <ul className="mt-8 grid gap-3 text-[14px] text-fg-2 sm:grid-cols-3">
          {[
            ["Your address", "Emails come from you, so replies land in your inbox."],
            ["Human pace", "A few at a time on weekdays, 9 to 5, up to your daily limit."],
            ["Stops on reply", "Follow-ups end as soon as they write back or unsubscribe."],
          ].map(([t, b]) => (
            <li key={t} className="flex gap-2.5">
              <Check size={16} strokeWidth={2} className="mt-0.5 shrink-0 text-octa-600" />
              <span>
                <span className="font-medium text-fg">{t}.</span> {b}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function MailboxPanel({
  state,
  onSave,
  onDisconnect,
}: {
  state: OutreachState;
  onSave: (change: Record<string, unknown>) => Promise<string | null>;
  onDisconnect: () => void;
}) {
  const s = state.settings;
  const cap = s?.dailyCap ?? 20;
  const pct = Math.min(1, state.sentToday / cap);
  const reduce = useReducedMotion();
  const active = state.sequences.filter((q) => q.status === "active").length;
  const replied = state.sequences.filter((q) => q.status === "replied").length;
  return (
    <section className="grid grid-cols-2 gap-3 md:grid-cols-[1.4fr_1fr_1fr]">
      <div className="col-span-2 flex min-w-0 items-center gap-3 rounded-[24px] bg-elevated p-4 sm:gap-4 sm:p-5 shadow-soft ring-1 ring-hairline dark:shadow-none md:col-span-1">
        <OutlookLogo />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-[13px] font-medium text-fg-3">
            <span className={`size-2 rounded-full ${s?.paused ? "bg-amber-500" : "bg-emerald-500"}`} />
            {s?.paused ? "Paused" : "Sending from"}
          </p>
          <p className="truncate text-[17px] font-semibold">{state.mailbox!.email}</p>
        </div>
        {s && (
          <button
            onClick={() => onSave({ paused: !s.paused })}
            aria-label={s.paused ? "Resume sending" : "Pause sending"}
            className="flex h-10 items-center gap-1.5 rounded-full bg-fg/[.06] px-3.5 text-[14px] font-medium hover:bg-fg/[.1]"
          >
            {s.paused ? <Play size={14} strokeWidth={2} /> : <Pause size={14} strokeWidth={2} />}
            <span className="hidden sm:inline">{s.paused ? "Resume" : "Pause"}</span>
          </button>
        )}
        <button
          onClick={onDisconnect}
          aria-label="Disconnect Outlook"
          title="Disconnect"
          className="grid size-10 place-items-center rounded-full text-fg-3 hover:bg-fg/[.06] hover:text-fg"
        >
          <Unplug size={16} strokeWidth={1.5} />
        </button>
      </div>
      <div className="flex min-w-0 items-center gap-3 rounded-[24px] bg-elevated p-4 shadow-soft ring-1 ring-hairline dark:shadow-none sm:gap-4 sm:p-5">
        <svg width={52} height={52} viewBox="0 0 52 52" className="size-11 shrink-0 -rotate-90 sm:size-[52px]" aria-hidden>
          <circle cx={26} cy={26} r={22} fill="none" strokeWidth={5} className="stroke-fg/[.08]" />
          <motion.circle
            cx={26}
            cy={26}
            r={22}
            fill="none"
            strokeWidth={5}
            strokeLinecap="round"
            className="stroke-octa-600"
            strokeDasharray={2 * Math.PI * 22}
            initial={reduce ? false : { strokeDashoffset: 2 * Math.PI * 22 }}
            animate={{ strokeDashoffset: 2 * Math.PI * 22 * (1 - pct) }}
            transition={{ type: "spring", stiffness: 60, damping: 18 }}
          />
        </svg>
        <div>
          <p className="whitespace-nowrap text-[13px] font-medium text-fg-3">Sent today</p>
          <p className="text-[24px] font-semibold tabular-nums tracking-[-0.02em]">
            {state.sentToday}
            <span className="text-[15px] font-normal text-fg-3"> / {cap}</span>
          </p>
        </div>
      </div>
      <div className="grid min-w-0 grid-cols-2 gap-2 rounded-[24px] bg-elevated p-4 sm:p-5 shadow-soft ring-1 ring-hairline dark:shadow-none">
        <div>
          <p className="text-[13px] font-medium text-fg-3">Active</p>
          <p className="text-[24px] font-semibold tabular-nums tracking-[-0.02em]">{active}</p>
        </div>
        <div>
          <p className="text-[13px] font-medium text-fg-3">Replies</p>
          <p className="text-[24px] font-semibold tabular-nums tracking-[-0.02em] text-emerald-600 dark:text-emerald-400">{replied}</p>
        </div>
      </div>
    </section>
  );
}

function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={`relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors ${on ? "bg-octa-600" : "bg-fg/[.14]"}`}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 600, damping: 35 }}
        className={`absolute top-[2px] size-[27px] rounded-full bg-white shadow-soft ${on ? "right-[2px]" : "left-[2px]"}`}
      />
    </button>
  );
}

function SetupCard({ state, onSave, open: startOpen }: { state: OutreachState; onSave: (c: Record<string, unknown>) => Promise<string | null>; open: boolean }) {
  const s = state.settings;
  const reduce = useReducedMotion();
  const toast = useToast();
  const [open, setOpen] = useState(startOpen);
  const [form, setForm] = useState({
    senderName: s?.senderName ?? state.mailbox?.name ?? "",
    mailingAddress: s?.mailingAddress ?? "",
    offer: s?.offer ?? "a free preview of a new website for their business",
    dailyCap: s?.dailyCap ?? 20,
    followUps: s?.followUps ?? true,
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // The browser knows the user's timezone; emails go out during their working day.
  useEffect(() => {
    if (s && s.timezone !== Intl.DateTimeFormat().resolvedOptions().timeZone && s.timezone === "America/Toronto") {
      void onSave({ timezone: Intl.DateTimeFormat().resolvedOptions().timeZone });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const err = await onSave({ ...form, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone });
    setSaving(false);
    if (err) return setError(err);
    setError("");
    toast.success(s ? "Saved" : "You're ready to send");
    setOpen(false);
  }

  const input =
    "h-12 w-full rounded-[12px] bg-canvas px-3.5 text-[16px] ring-1 ring-hairline outline-none placeholder:text-fg-3 focus:ring-4 focus:ring-octa-600/15";

  return (
    <section className="overflow-hidden rounded-[24px] bg-elevated shadow-soft ring-1 ring-hairline dark:shadow-none">
      {s && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3 px-5 py-4">
          <span className="grid size-10 place-items-center rounded-[12px] bg-octa-600/10 text-octa-600">
            <Zap size={18} strokeWidth={1.75} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[16px] font-semibold">Autopilot</p>
            <p className="text-[14px] text-fg-2">
              {s.autopilot
                ? "Octa emails every business you add as soon as it finds their email."
                : "Off. You start each email yourself from a business."}
            </p>
          </div>
          <Switch on={s.autopilot} onChange={(v) => void onSave({ autopilot: v })} label="Autopilot" />
        </div>
      )}
      {s && (
        <button
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex w-full items-center gap-2 border-t border-hairline px-5 py-3.5 text-left text-[14px] font-medium text-fg-2 hover:text-fg"
        >
          <span className="whitespace-nowrap">Email settings</span>
          <span className="hidden truncate font-normal text-fg-3 sm:inline">
            · signed {s.senderName} · up to {s.dailyCap} a day{s.followUps ? " · 2 follow-ups" : ""}
          </span>
          <ChevronDown size={16} strokeWidth={1.5} className={`ml-auto shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      )}
      <AnimatePresence initial={false}>
        {open && (
          <motion.form
            onSubmit={submit}
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 32 }}
            className="overflow-hidden"
          >
            <div className={`grid gap-5 px-5 pb-5 sm:grid-cols-2 ${s ? "" : "pt-6"}`}>
              {!s && (
                <div className="sm:col-span-2">
                  <h2 className="text-[21px] font-semibold tracking-[-0.015em]">A few details for your emails</h2>
                  <p className="mt-1 text-[15px] text-fg-2">Octa uses these in every email it writes for you.</p>
                </div>
              )}
              <label className="block">
                <span className="text-[14px] font-medium">Sign emails as</span>
                <input
                  value={form.senderName}
                  onChange={(e) => setForm({ ...form, senderName: e.target.value })}
                  placeholder="Alex from Northside Web"
                  className={`mt-1.5 ${input}`}
                />
              </label>
              <label className="block">
                <span className="text-[14px] font-medium">What you&apos;re offering</span>
                <input
                  value={form.offer}
                  onChange={(e) => setForm({ ...form, offer: e.target.value })}
                  placeholder="a free preview of their new website"
                  className={`mt-1.5 ${input}`}
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-[14px] font-medium">Your mailing address</span>
                <input
                  value={form.mailingAddress}
                  onChange={(e) => setForm({ ...form, mailingAddress: e.target.value })}
                  placeholder="123 Main St, Hamilton, ON L8P 1A1"
                  className={`mt-1.5 ${input}`}
                />
                <span className="mt-1.5 block text-[13px] text-fg-3">
                  Shown small at the bottom of each email, with an unsubscribe link. Anti-spam laws in the US and Canada require both.
                </span>
              </label>
              <div>
                <span className="flex items-baseline justify-between text-[14px] font-medium">
                  Emails a day <span className="tabular-nums text-fg-2">{form.dailyCap}</span>
                </span>
                <input
                  type="range"
                  min={5}
                  max={40}
                  step={5}
                  value={form.dailyCap}
                  onChange={(e) => setForm({ ...form, dailyCap: Number(e.target.value) })}
                  aria-label="Emails a day"
                  className="mt-3 w-full accent-octa-600"
                />
                <span className="mt-1 block text-[13px] text-fg-3">Start around 20. A new inbox sending more looks like spam.</span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span>
                  <span className="block text-[14px] font-medium">Follow up twice</span>
                  <span className="mt-0.5 block text-[13px] text-fg-3">3 and 7 days later, in the same thread, unless they reply.</span>
                </span>
                <Switch on={form.followUps} onChange={(v) => setForm({ ...form, followUps: v })} label="Follow up twice" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-hairline px-5 py-4">
              {error && (
                <p role="alert" className="mr-auto text-[14px] text-red-600 dark:text-red-400">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={saving}
                className="flex h-11 items-center gap-2 rounded-full bg-octa-600 px-6 text-[15px] font-medium text-white hover:bg-octa-500 disabled:opacity-60"
              >
                {saving ? "Saving…" : s ? "Save" : "Save and continue"}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </section>
  );
}

function Activity({ sequences, onOpenLead }: { sequences: SequenceSummary[]; onOpenLead: (id: string) => void }) {
  const reduce = useReducedMotion();
  if (!sequences.length) {
    return (
      <section className="flex flex-col items-center rounded-[24px] bg-fg/[.025] px-6 py-12 text-center">
        <Inbox size={26} strokeWidth={1.5} className="text-fg-3" />
        <h3 className="mt-4 text-[19px] font-semibold">No emails yet</h3>
        <p className="mt-1 max-w-[420px] text-[15px] text-fg-2">
          Open a business with an email and press <span className="font-medium text-fg">Email them</span>, or turn on Autopilot.
        </p>
      </section>
    );
  }
  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 text-[13px] font-medium text-fg-3">
        <Mail size={14} strokeWidth={1.5} /> Emails
      </h2>
      <ul className="overflow-hidden rounded-[24px] bg-elevated shadow-soft ring-1 ring-hairline dark:shadow-none">
        {sequences.map((q, i) => (
          <motion.li
            key={q.id}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i, 10) * 0.03 }}
            className="border-b border-hairline last:border-b-0"
          >
            <button onClick={() => onOpenLead(q.leadId)} className="flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-fg/[.025]">
              <BusinessPhoto src={q.photoUrl} name={q.name} className="size-11 shrink-0 rounded-[12px] text-[18px]" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[16px] font-semibold">{q.name}</p>
                <p className="truncate text-[13px] text-fg-2">{q.toEmail}</p>
              </div>
              <div className="hidden items-center gap-1 sm:flex" aria-label={`${q.sent} of ${q.total} sent`}>
                {Array.from({ length: q.total }, (_, n) => (
                  <span key={n} className={`h-1.5 w-5 rounded-full ${n < q.sent ? "bg-octa-600" : "bg-fg/[.1]"}`} />
                ))}
              </div>
              <p className="hidden w-32 text-right text-[13px] text-fg-3 md:block">
                {q.status === "active" && q.nextAt ? `Next ${when(q.nextAt)}` : q.lastSentAt ? `Sent ${when(q.lastSentAt)}` : ""}
              </p>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-[12px] font-medium ${SEQUENCE_STATUS[q.status].tone}`}>
                {q.status === "active" && !q.sent ? "Queued" : SEQUENCE_STATUS[q.status].label}
              </span>
            </button>
          </motion.li>
        ))}
      </ul>
      <p className="mt-3 flex items-center gap-1.5 text-[12px] text-fg-3">
        <Sparkles size={12} strokeWidth={1.5} /> Emails go out on weekdays, 9 to 5 your time. Replies show up in your Outlook inbox.
      </p>
    </section>
  );
}

export function OutlookLogo({ className = "size-11" }: { className?: string }) {
  return (
    <span className={`grid shrink-0 place-items-center rounded-[12px] bg-[#0a64c8]/10 ${className}`} aria-hidden>
      <svg viewBox="0 0 24 24" className="size-6">
        <rect x="9" y="4" width="13" height="16" rx="2" className="fill-[#28a8ea]" />
        <path d="M9 9.5 15.5 13 22 9.5V18a2 2 0 0 1-2 2H11a2 2 0 0 1-2-2Z" className="fill-[#0a64c8]" />
        <rect x="2" y="6.5" width="11" height="11" rx="2" className="fill-[#0f4a8a]" />
        <ellipse cx="7.5" cy="12" rx="2.6" ry="3" fill="none" stroke="white" strokeWidth="1.6" />
      </svg>
    </span>
  );
}

export function GmailLogo({ className = "size-11" }: { className?: string }) {
  return (
    <span className={`grid shrink-0 place-items-center rounded-[12px] bg-fg/[.05] ${className}`} aria-hidden>
      <svg viewBox="0 0 24 24" className="size-6 opacity-80">
        <path d="M3 7.5 12 14l9-6.5V18a1.5 1.5 0 0 1-1.5 1.5H17V11l-5 3.6L7 11v8.5H4.5A1.5 1.5 0 0 1 3 18Z" className="fill-[#ea4335]" />
        <path d="M3 7.5A1.5 1.5 0 0 1 5.4 6.3L12 11l6.6-4.7A1.5 1.5 0 0 1 21 7.5L12 14Z" className="fill-[#c5221f]" />
        <path d="M17 11v8.5h2.5A1.5 1.5 0 0 0 21 18V7.5Z" className="fill-[#34a853]" />
        <path d="M3 7.5V18a1.5 1.5 0 0 0 1.5 1.5H7V11Z" className="fill-[#4285f4]" />
      </svg>
    </span>
  );
}
