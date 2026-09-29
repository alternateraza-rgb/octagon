"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowUp, Check, Link2, Loader2, Sparkles } from "lucide-react";
import { AgentBadge } from "./agent-badge";
import { ago } from "./time";
import type { Agent, Intent, Thread } from "./types";

const INTENT: Record<Intent, { label: string; tone: string }> = {
  interested: { label: "Interested", tone: "bg-octa-600 text-white" },
  question: { label: "Question", tone: "bg-octa-600/10 text-octa-700 dark:text-octa-400" },
  not_now: { label: "Not now", tone: "bg-fg/[.07] text-fg-2" },
};

const FILTERS: { id: Intent | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "interested", label: "Interested" },
  { id: "question", label: "Questions" },
  { id: "not_now", label: "Not now" },
];

const spring = { type: "spring" as const, stiffness: 260, damping: 28 };

// Where a drafted reply wants the link to the site preview; "Build their site" fills it in.
const PREVIEW = "[preview link]";

// Replies from every agent in one place, sorted by what they mean. The answer is already drafted,
// and the next step (a real preview of their site) is one button away.
export function InboxView({ threads: initial, agents, now }: { threads: Thread[]; agents: Agent[]; now: number }) {
  const reduce = useReducedMotion();
  const [threads, setThreads] = useState(initial);
  const [filter, setFilter] = useState<Intent | "all">("all");
  const [openId, setOpenId] = useState<string | null>(initial[0]?.id ?? null);
  // On phones the list and the conversation take turns.
  const [mobileThread, setMobileThread] = useState(false);

  const shown = useMemo(() => threads.filter((t) => filter === "all" || t.intent === filter), [threads, filter]);
  const thread = threads.find((t) => t.id === openId) ?? null;
  const agentOf = (id: string) => agents.find((a) => a.id === id);

  const open = (id: string) => {
    setOpenId(id);
    setMobileThread(true);
    setThreads((ts) => ts.map((t) => (t.id === id ? { ...t, unread: false } : t)));
  };

  const send = (id: string, body: string) =>
    setThreads((ts) => ts.map((t) => (t.id === id ? { ...t, draft: "", messages: [...t.messages, { from: "agent", body, at: Date.now() }] } : t)));

  return (
    <div className="flex h-full flex-col">
      <div className="mx-auto flex w-full max-w-[1280px] min-h-0 flex-1 flex-col px-5 pb-5 pt-8 sm:pt-10">
        <div className={`flex-wrap items-end justify-between gap-4 ${mobileThread ? "hidden md:flex" : "flex"}`}>
          <div>
            <Link href="/dashboard/agents" className="inline-flex h-11 items-center gap-1.5 text-[15px] text-fg-2 hover:text-fg">
              <ArrowLeft size={16} strokeWidth={1.5} /> Agents
            </Link>
            <h1 className="mt-2 font-[family-name:var(--font-display)] text-[36px] font-semibold leading-[1.05] tracking-[-0.04em] sm:text-[48px]">
              Replies
            </h1>
          </div>
          <div className="flex gap-1 overflow-x-auto rounded-full bg-fg/[.05] p-1">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`relative h-9 shrink-0 rounded-full px-4 text-[14px] font-medium ${filter === f.id ? "text-fg" : "text-fg-2 hover:text-fg"}`}
              >
                {filter === f.id && (
                  <motion.span layoutId="inbox-filter" transition={spring} className="absolute inset-0 rounded-full bg-elevated shadow-soft" />
                )}
                <span className="relative">{f.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 grid min-h-0 flex-1 gap-4 md:grid-cols-[340px_minmax(0,1fr)]">
          <ul className={`min-h-0 space-y-1 overflow-y-auto ${mobileThread ? "hidden md:block" : ""}`}>
            {shown.map((t) => {
              const last = t.messages.at(-1)!;
              const agent = agentOf(t.agentId);
              return (
                <li key={t.id}>
                  <button
                    onClick={() => open(t.id)}
                    className={`flex w-full gap-3 rounded-[18px] p-3.5 text-left transition-colors ${
                      t.id === openId ? "bg-elevated shadow-soft ring-1 ring-hairline" : "hover:bg-fg/[.04]"
                    }`}
                  >
                    <span className="relative">
                      <span className="grid size-11 place-items-center rounded-full bg-fg/[.07] text-[15px] font-semibold">{t.contact.slice(0, 1)}</span>
                      {t.unread && <span className="absolute -right-0.5 -top-0.5 size-3 rounded-full bg-octa-600 ring-2 ring-canvas" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className={`truncate text-[15px] ${t.unread ? "font-semibold" : "font-medium"}`}>{t.business}</span>
                        <span className="shrink-0 text-[12px] tabular-nums text-fg-3">{ago(last.at, now)}</span>
                      </span>
                      <span className="mt-0.5 block truncate text-[13px] text-fg-2">
                        {last.from === "agent" ? "You: " : ""}
                        {last.body.replace(/\s+/g, " ")}
                      </span>
                      <span className="mt-2 flex items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${INTENT[t.intent].tone}`}>{INTENT[t.intent].label}</span>
                        {agent && <span className="text-[12px] text-fg-3">via {agent.name}</span>}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
            {!shown.length && <li className="px-3 py-12 text-center text-[15px] text-fg-3">Nothing here yet.</li>}
          </ul>

          <div className={`min-h-0 ${mobileThread ? "" : "hidden md:block"}`}>
            <AnimatePresence mode="wait">
              {thread ? (
                <motion.div
                  key={thread.id}
                  initial={reduce ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? undefined : { opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  <Conversation
                    thread={thread}
                    agent={agentOf(thread.agentId)}
                    now={now}
                    onBack={() => setMobileThread(false)}
                    onSend={(body) => send(thread.id, body)}
                  />
                </motion.div>
              ) : (
                <div className="grid h-full place-items-center rounded-[28px] bg-elevated ring-1 ring-hairline">
                  <p className="text-[15px] text-fg-3">Pick a conversation.</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

function Conversation({
  thread,
  agent,
  now,
  onBack,
  onSend,
}: {
  thread: Thread;
  agent: Agent | undefined;
  now: number;
  onBack: () => void;
  onSend: (body: string) => void;
}) {
  const reduce = useReducedMotion();
  const [draft, setDraft] = useState(thread.draft);
  const [preview, setPreview] = useState<"idle" | "building" | "ready">("idle");
  const previewUrl = `${thread.business.toLowerCase().replace(/[^a-z]+/g, "-").replace(/^-|-$/g, "").slice(0, 24)}.octacore.app`;
  const wantsPreview = draft.includes(PREVIEW);
  const list = useRef<HTMLOListElement>(null);

  // Open on the latest message, and follow new ones.
  useEffect(() => {
    list.current?.scrollTo({ top: list.current.scrollHeight, behavior: reduce ? "auto" : "smooth" });
  }, [thread.messages.length, reduce]);

  const build = () => {
    setPreview("building");
    // The real button runs the lead → site build and swaps in its preview link.
    setTimeout(() => {
      setPreview("ready");
      setDraft((d) => (d.includes(PREVIEW) ? d.replace(PREVIEW, previewUrl) : `${d}\n\nHere's a first look: ${previewUrl}`));
    }, reduce ? 200 : 1800);
  };

  return (
    <section className="flex h-full min-h-[560px] flex-col overflow-hidden rounded-[28px] bg-elevated shadow-soft ring-1 ring-hairline">
      <header className="flex items-center gap-3 border-b border-hairline px-4 py-3 sm:px-6">
        <button onClick={onBack} aria-label="Back to replies" className="-ml-2 grid size-11 place-items-center rounded-full text-fg-2 hover:bg-fg/5 md:hidden">
          <ArrowLeft size={18} strokeWidth={1.5} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[17px] font-semibold tracking-[-0.01em]">{thread.business}</p>
          <p className="truncate text-[13px] text-fg-2">
            {thread.contact} · {thread.category}
          </p>
        </div>
        <span className={`hidden rounded-full px-2.5 py-1 text-[12px] font-semibold sm:inline ${INTENT[thread.intent].tone}`}>{INTENT[thread.intent].label}</span>
      </header>

      <ol ref={list} className="flex-1 space-y-4 overflow-y-auto px-4 py-6 sm:px-6">
        <AnimatePresence initial={false}>
          {thread.messages.map((m, i) => {
            const mine = m.from === "agent";
            return (
              <motion.li
                key={i}
                initial={reduce ? false : { opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={spring}
                className={`flex ${mine ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-[85%] sm:max-w-[72%] ${mine ? "items-end" : "items-start"} flex flex-col`}>
                  <div
                    className={`whitespace-pre-line rounded-[22px] px-4 py-3 text-[15px] leading-[1.5] ${
                      mine ? "rounded-br-[8px] bg-fg text-canvas" : "rounded-bl-[8px] bg-fg/[.06]"
                    }`}
                  >
                    {m.body}
                  </div>
                  <p className="mt-1 px-2 text-[12px] text-fg-3">
                    {mine ? (i === 0 && agent ? `${agent.name} · ` : "You · ") : `${thread.contact.split(" ")[0]} · `}
                    {ago(m.at, now)} ago
                  </p>
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ol>

      <div className="border-t border-hairline p-3 sm:p-4">
        {draft && agent && (
          <p className="mb-2 flex items-center gap-2 px-1 text-[12px] font-medium text-fg-3">
            <AgentBadge name={agent.name} status="active" size={18} /> {agent.name} drafted this reply. Edit it or send as is.
          </p>
        )}
        <div className="rounded-[22px] bg-canvas ring-1 ring-hairline focus-within:ring-4 focus-within:ring-octa-600/15">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={4}
            placeholder={`Write to ${thread.contact.split(" ")[0]}…`}
            className="block w-full resize-none bg-transparent px-4 pt-3 text-[15px] leading-[1.5] outline-none"
          />
          <div className="flex flex-wrap items-center justify-between gap-2 p-2">
            <button
              onClick={build}
              disabled={preview !== "idle"}
              className={`flex h-10 items-center gap-2 rounded-full px-3.5 text-[14px] font-medium transition-colors ${
                preview === "ready" ? "bg-octa-600/10 text-octa-700 dark:text-octa-400" : "bg-fg/[.06] hover:bg-fg/10"
              } ${wantsPreview && preview === "idle" ? "ring-2 ring-octa-600/40" : ""}`}
            >
              {preview === "building" ? (
                <Loader2 size={15} strokeWidth={1.75} className="animate-spin" />
              ) : preview === "ready" ? (
                <Check size={15} strokeWidth={2} />
              ) : (
                <Sparkles size={15} strokeWidth={1.5} className="text-octa-600" />
              )}
              {preview === "building" ? "Building their site…" : preview === "ready" ? "Preview link added" : "Build their site"}
              {preview === "ready" && <Link2 size={14} strokeWidth={1.5} />}
            </button>
            <button
              onClick={() => {
                onSend(draft.trim());
                setDraft("");
              }}
              disabled={!draft.trim() || wantsPreview}
              title={wantsPreview ? "Build their site first to fill in the preview link" : undefined}
              aria-label="Send"
              className="grid size-10 place-items-center rounded-full bg-octa-600 text-white hover:bg-octa-500 active:bg-octa-700 disabled:opacity-30"
            >
              <ArrowUp size={18} strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
