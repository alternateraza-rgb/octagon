"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, CircleSlash, MessageCircleReply, RotateCcw, Send, Sparkles } from "lucide-react";
import { noticeUpgrade } from "@/lib/billing/client";
import type { Lead } from "@/lib/agents/store";
import type { Sequence } from "@/lib/outreach/store";
import { SEQUENCE_STATUS } from "./outreach";

type Draft = { subject: string; body: string };

const LABELS = ["First email", "Follow-up", "Last follow-up"];
const DAYS = ["Today", "3 days later", "7 days later"];
const date = new Intl.DateTimeFormat("en", { weekday: "short", month: "short", day: "numeric" });

// The email part of a business's sheet: what's been sent and what's next, or a way to start.
export function Compose({
  lead,
  ready,
  onSetup,
  onChange,
}: {
  lead: Lead;
  // A mailbox is connected and the outreach settings are saved.
  ready: boolean;
  onSetup: () => void;
  onChange: (lead: Lead) => void;
}) {
  const reduce = useReducedMotion();
  // `at` is when it was loaded, to tell what's due now.
  const [loaded, setLoaded] = useState<{ id: string; sequence: Sequence | null; at: number } | null>(null);
  const [drafts, setDrafts] = useState<{ id: string; emails: Draft[] } | null>(null);
  const [busy, setBusy] = useState<"draft" | "start" | "update" | null>(null);
  const [error, setError] = useState("");
  const sequence = loaded?.id === lead.id ? loaded.sequence : undefined;
  const emails = drafts?.id === lead.id ? drafts.emails : null;

  useEffect(() => {
    let stale = false;
    fetch(`/api/agents/leads/${lead.id}/sequence`)
      .then((r) => r.json() as Promise<{ sequence?: Sequence | null }>)
      .then((b) => !stale && setLoaded({ id: lead.id, sequence: b.sequence ?? null, at: Date.now() }))
      .catch(() => !stale && setLoaded({ id: lead.id, sequence: null, at: Date.now() }));
    return () => {
      stale = true;
    };
  }, [lead.id]);

  async function draft() {
    setBusy("draft");
    setError("");
    const res = await fetch(`/api/agents/leads/${lead.id}/draft`, { method: "POST" }).catch(() => null);
    const body = (await res?.json().catch(() => null)) as { emails?: Draft[]; error?: string; setup?: boolean } | null;
    setBusy(null);
    if (res?.ok && body?.emails) return setDrafts({ id: lead.id, emails: body.emails });
    if (body?.setup) return onSetup();
    if (!noticeUpgrade(res?.status, body)) setError(body?.error ?? "Octa couldn't write the emails. Try again.");
  }

  async function start() {
    if (!emails) return;
    setBusy("start");
    setError("");
    const res = await fetch(`/api/agents/leads/${lead.id}/sequence`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ emails }),
    }).catch(() => null);
    const body = (await res?.json().catch(() => null)) as { sequence?: Sequence; error?: string } | null;
    setBusy(null);
    if (!res?.ok || !body?.sequence) return setError(body?.error ?? "Couldn't start. Try again.");
    setLoaded({ id: lead.id, sequence: body.sequence, at: Date.now() });
    setDrafts(null);
    onChange({ ...lead, outreach: "active" });
  }

  async function update(action: "replied" | "stop") {
    setBusy("update");
    const res = await fetch(`/api/agents/leads/${lead.id}/sequence`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action }),
    }).catch(() => null);
    const body = (await res?.json().catch(() => null)) as { sequence?: Sequence } | null;
    setBusy(null);
    if (body?.sequence) {
      setLoaded({ id: lead.id, sequence: body.sequence, at: Date.now() });
      onChange({ ...lead, outreach: body.sequence.status, stage: action === "replied" ? "replied" : lead.stage });
    }
  }

  const edit = (i: number, change: Partial<Draft>) =>
    emails && setDrafts({ id: lead.id, emails: emails.map((e, n) => (n === i ? { ...e, ...change } : e)) });

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-semibold">Email</h3>
        {sequence && (
          <span className={`rounded-full px-2.5 py-1 text-[12px] font-medium ${SEQUENCE_STATUS[sequence.status].tone}`}>
            {SEQUENCE_STATUS[sequence.status].label}
          </span>
        )}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {sequence === undefined ? (
          <motion.div key="loading" exit={{ opacity: 0 }} className="shimmer mt-3 h-24 rounded-[18px]" aria-hidden />
        ) : sequence && !emails ? (
          <motion.div key="timeline" initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <ol className="relative mt-4 space-y-3 pl-7">
              <span aria-hidden className="absolute bottom-3 left-[9px] top-3 w-px bg-hairline" />
              {sequence.steps.map((s) => (
                <li key={s.step} className="relative">
                  <span
                    aria-hidden
                    className={`absolute -left-7 top-4 grid size-[19px] place-items-center rounded-full ring-4 ring-elevated ${
                      s.status === "sent" ? "bg-octa-600 text-white" : s.status === "canceled" ? "bg-fg/[.1]" : "bg-elevated ring-1 ring-inset ring-fg/20"
                    }`}
                  >
                    {s.status === "sent" && <Check size={11} strokeWidth={3} />}
                  </span>
                  <details className="group rounded-[16px] bg-canvas px-4 py-3 ring-1 ring-hairline">
                    <summary className="flex cursor-pointer list-none items-center gap-2 text-[14px]">
                      <span className="font-medium">{LABELS[s.step]}</span>
                      <span className="text-fg-3">
                        {s.status === "sent" && s.sentAt
                          ? `Sent ${date.format(s.sentAt)}`
                          : s.status === "canceled"
                            ? "Won't send"
                            : s.error
                              ? "Retrying"
                              : `Sends ${s.scheduledAt <= (loaded?.at ?? 0) ? "soon" : date.format(s.scheduledAt)}`}
                      </span>
                    </summary>
                    <p className="mt-3 text-[13px] font-medium text-fg-2">{s.subject}</p>
                    <p className="mt-1 whitespace-pre-line text-[14px] leading-[1.5] text-fg-2">{s.body}</p>
                    {s.error && <p className="mt-2 text-[13px] text-amber-700 dark:text-amber-300">{s.error}</p>}
                  </details>
                </li>
              ))}
            </ol>
            {sequence.status === "active" ? (
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => update("replied")}
                  disabled={!!busy}
                  className="flex h-10 items-center gap-1.5 rounded-full bg-fg/[.06] px-4 text-[14px] font-medium hover:bg-fg/[.1] disabled:opacity-50"
                >
                  <MessageCircleReply size={15} strokeWidth={1.5} /> They replied
                </button>
                <button
                  onClick={() => update("stop")}
                  disabled={!!busy}
                  className="flex h-10 items-center gap-1.5 rounded-full px-4 text-[14px] font-medium text-fg-2 hover:bg-fg/[.06] hover:text-fg disabled:opacity-50"
                >
                  <CircleSlash size={15} strokeWidth={1.5} /> Stop emails
                </button>
              </div>
            ) : (
              ["stopped", "finished", "failed"].includes(sequence.status) && (
                <button
                  onClick={draft}
                  disabled={!!busy || !ready}
                  className="mt-4 flex h-10 items-center gap-1.5 rounded-full bg-fg/[.06] px-4 text-[14px] font-medium hover:bg-fg/[.1] disabled:opacity-50"
                >
                  <RotateCcw size={15} strokeWidth={1.5} /> Write new emails
                </button>
              )
            )}
          </motion.div>
        ) : emails ? (
          <motion.div key="drafts" initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <p className="mt-1 text-[13px] text-fg-3">To {lead.email}. Edit anything, then start.</p>
            <ol className="mt-3 space-y-3">
              {emails.map((e, i) => (
                <motion.li
                  key={i}
                  initial={reduce ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08, type: "spring", stiffness: 200, damping: 24 }}
                  className="rounded-[18px] bg-canvas p-3 ring-1 ring-hairline focus-within:ring-octa-600/40"
                >
                  <p className="flex items-center justify-between px-1 text-[12px] font-medium text-fg-3">
                    <span>{LABELS[i]}</span>
                    <span>{DAYS[i]}</span>
                  </p>
                  {i === 0 ? (
                    <input
                      value={e.subject}
                      onChange={(ev) => edit(i, { subject: ev.target.value })}
                      aria-label="Subject"
                      className="mt-1.5 h-10 w-full rounded-[10px] bg-transparent px-1 text-[15px] font-semibold outline-none"
                    />
                  ) : null}
                  <textarea
                    value={e.body}
                    onChange={(ev) => edit(i, { body: ev.target.value })}
                    aria-label={`${LABELS[i]} text`}
                    rows={i === 0 ? 8 : 3}
                    className="w-full resize-none rounded-[10px] bg-transparent px-1 py-1 text-[14px] leading-[1.5] outline-none"
                  />
                </motion.li>
              ))}
            </ol>
            <p className="mt-2 text-[12px] text-fg-3">Your mailing address and an unsubscribe link are added at the bottom.</p>
            {error && <p role="alert" className="mt-2 text-[14px] text-red-600 dark:text-red-400">{error}</p>}
            <div className="mt-4 flex gap-2">
              <button
                onClick={draft}
                disabled={!!busy}
                className="flex h-11 items-center gap-1.5 rounded-full px-4 text-[14px] font-medium text-fg-2 hover:bg-fg/[.06] hover:text-fg disabled:opacity-50"
              >
                <RotateCcw size={15} strokeWidth={1.5} /> {busy === "draft" ? "Rewriting…" : "Rewrite"}
              </button>
              <button
                onClick={start}
                disabled={!!busy}
                className="ml-auto flex h-11 items-center gap-2 rounded-full bg-fg px-5 text-[15px] font-medium text-canvas transition-opacity hover:opacity-85 disabled:opacity-50"
              >
                <Send size={15} strokeWidth={1.75} /> {busy === "start" ? "Starting…" : "Start emailing"}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div key="start" initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {busy === "draft" ? (
              <div className="mt-3 rounded-[18px] bg-canvas p-4 ring-1 ring-hairline" aria-live="polite">
                <p className="shimmer-text text-[14px]">Octa is writing to {lead.name}…</p>
                <div className="mt-3 space-y-2" aria-hidden>
                  <div className="shimmer h-3.5 w-2/3 rounded-full" />
                  <div className="shimmer h-3.5 w-full rounded-full" />
                  <div className="shimmer h-3.5 w-5/6 rounded-full" />
                </div>
              </div>
            ) : (
              <div className="mt-3 flex items-center gap-4 rounded-[18px] bg-canvas p-4 ring-1 ring-hairline">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-octa-600/10 text-octa-600">
                  <Sparkles size={18} strokeWidth={1.5} />
                </span>
                <p className="min-w-0 flex-1 text-[14px] text-fg-2">
                  {!lead.email
                    ? "Add their email above, and Octa can write to them."
                    : ready
                      ? "Octa writes a short, personal email from their reviews, plus two gentle follow-ups."
                      : "Connect Outlook and Octa will write and send their emails."}
                </p>
                {lead.email && (
                  <button
                    onClick={ready ? draft : onSetup}
                    className="flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-fg px-4 text-[14px] font-medium text-canvas hover:opacity-85"
                  >
                    {ready ? "Email them" : "Set up"}
                  </button>
                )}
              </div>
            )}
            {error && <p role="alert" className="mt-2 text-[14px] text-red-600 dark:text-red-400">{error}</p>}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
