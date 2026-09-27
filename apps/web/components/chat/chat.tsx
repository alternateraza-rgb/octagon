"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowDown, ArrowUpRight, Check, Copy, RotateCcw } from "lucide-react";
import { OctacoreMark } from "@octacore/ui/logo";
import { readModelText } from "@/lib/ai/read-events";
import type { ChatMessage } from "@/lib/chat/store";
import { CATEGORIES, PROMPTS, matchPrompts, type PromptCategory } from "@/lib/chat/prompt-library";
import { AttachmentList } from "@/components/uploads/attachments";
import { useUploads } from "@/components/uploads/use-uploads";
import { useWorkspace } from "@/components/app/workspace";
import { Composer } from "./composer";
import { Markdown } from "./markdown";
import { useSmoothText } from "./use-smooth-text";

type Message = Pick<ChatMessage, "role" | "content"> & { id: string; failed?: boolean; attachments?: ChatMessage["attachments"] };

const spring = { type: "spring" as const, stiffness: 260, damping: 26 };
const suggest = (q: string) => (q.trim().length >= 3 ? matchPrompts(q).map((p) => p.text) : []);

// Greeting by the reader's local time; the server renders a neutral one.
const noop = () => () => {};
function useGreeting(name: string) {
  return useSyncExternalStore(
    noop,
    () => {
      const h = new Date().getHours();
      return `${h < 5 ? "Up late" : h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening"}, ${name}`;
    },
    () => `Welcome back, ${name}`,
  );
}

export function Chat({ conversationId, initialMessages = [] }: { conversationId?: string; initialMessages?: ChatMessage[] }) {
  const { me, conversations, upsertConversation } = useWorkspace();
  const reduce = useReducedMotion();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const uploads = useUploads();
  const [streaming, setStreaming] = useState(false);
  const [liveId, setLiveId] = useState<string | null>(null);
  const [followUps, setFollowUps] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [atBottom, setAtBottom] = useState(true);
  const idRef = useRef(conversationId);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef(true);

  const contentRef = useRef<HTMLDivElement>(null);
  const hasMessages = messages.length > 0;

  // Follow the reply as it grows (it types in smoothly), unless the reader has scrolled up.
  useEffect(() => {
    const el = scrollRef.current;
    const content = contentRef.current;
    if (!el || !content) return;
    const follow = () => {
      if (stickRef.current) el.scrollTop = el.scrollHeight;
    };
    follow();
    const observer = new ResizeObserver(follow);
    observer.observe(content);
    return () => observer.disconnect();
  }, [hasMessages]);

  const setReply = (id: string, patch: Partial<Message>) =>
    setMessages((m) => m.map((msg) => (msg.id === id ? { ...msg, ...patch } : msg)));

  async function stream(body: Record<string, unknown>, replyId: string, title: string) {
    setStreaming(true);
    setLiveId(replyId);
    setFollowUps([]);
    setError("");
    stickRef.current = true;
    const abort = new AbortController();
    abortRef.current = abort;
    let reply = "";
    const save = async () => {
      if (!reply || !idRef.current) return false;
      const res = await fetch(`/api/chat/${idRef.current}/reply`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content: reply }),
      }).catch(() => null);
      return !!res?.ok;
    };
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...body, conversationId: idRef.current }),
        signal: abort.signal,
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "Something went wrong.");
      }
      const newId = res.headers.get("x-conversation-id");
      if (newId && !idRef.current) {
        idRef.current = newId;
        window.history.replaceState(null, "", `/dashboard/chat/${newId}`);
      }
      reply = await readModelText(res, (content) => {
        reply = content;
        setReply(replyId, { content });
      });
      if (await save()) loadFollowUps();
    } catch (e) {
      if (abort.signal.aborted) await save();
      else {
        setReply(replyId, { failed: true });
        setError(e instanceof Error ? e.message : "Something went wrong.");
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
      if (idRef.current) {
        const existing = conversations.find((c) => c.id === idRef.current);
        upsertConversation({
          id: idRef.current,
          title: existing?.title ?? title.replace(/\s+/g, " ").slice(0, 60),
          updatedAt: Date.now(),
        });
      }
    }
  }

  async function loadFollowUps() {
    const res = await fetch(`/api/chat/${idRef.current}/suggest`, { method: "POST" }).catch(() => null);
    const data = (await res?.json().catch(() => null)) as { suggestions?: string[] } | null;
    setFollowUps(data?.suggestions ?? []);
  }

  function send(text: string) {
    const value = text.trim();
    const attachments = uploads.attachments;
    if ((!value && !attachments.length) || streaming || uploads.uploading) return;
    setInput("");
    uploads.clear();
    const replyId = crypto.randomUUID();
    setMessages((m) => [
      ...m,
      { id: crypto.randomUUID(), role: "user", content: value, attachments },
      { id: replyId, role: "assistant", content: "" },
    ]);
    stream({ message: value, attachments: attachments.map((a) => a.id) }, replyId, value || "Files");
  }

  function regenerate() {
    if (streaming || !idRef.current) return;
    const replyId = crypto.randomUUID();
    setMessages((m) => [
      ...m.slice(0, m.at(-1)?.role === "assistant" ? -1 : undefined),
      { id: replyId, role: "assistant", content: "" },
    ]);
    stream({ regenerate: true }, replyId, "");
  }

  const empty = messages.length === 0;
  const last = messages.at(-1);

  return (
    <div className="relative flex h-full flex-col">
      <div
        ref={scrollRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          const bottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
          stickRef.current = bottom;
          if (bottom !== atBottom) setAtBottom(bottom);
        }}
        className="min-h-0 flex-1 overflow-y-auto"
      >
        {empty ? (
          <EmptyState name={me.name.split(" ")[0]} onPick={send} />
        ) : (
          <div ref={contentRef} className="mx-auto max-w-[760px] space-y-8 px-5 pb-16 pt-10">
            {messages.map((m) =>
              m.role === "user" ? (
                <motion.div
                  key={m.id}
                  initial={reduce ? false : { opacity: 0, y: 18, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={spring}
                  className="flex origin-bottom-right flex-col items-end gap-2"
                >
                  <AttachmentList items={m.attachments ?? []} />
                  {m.content && (
                    <p className="max-w-[85%] whitespace-pre-wrap break-words rounded-[20px] rounded-br-[6px] bg-fg/[.07] px-4 py-2.5 text-[16px] leading-[1.5]">
                      {m.content}
                    </p>
                  )}
                </motion.div>
              ) : (
                <AssistantMessage
                  key={m.id}
                  message={m}
                  live={m.id === liveId}
                  streaming={streaming && m === last}
                  canRegenerate={m === last && !streaming}
                  onRegenerate={regenerate}
                />
              ),
            )}
            <AnimatePresence>
              {!streaming && followUps.length > 0 && last?.role === "assistant" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-start gap-2"
                >
                  {followUps.map((s, i) => (
                    <motion.button
                      key={s}
                      initial={reduce ? false : { opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ ...spring, delay: i * 0.07 }}
                      onClick={() => send(s)}
                      className="group flex min-h-10 items-center gap-2 rounded-full bg-elevated px-4 text-left text-[14px] text-fg-2 ring-1 ring-hairline transition-colors hover:text-fg hover:ring-octa-600/40"
                    >
                      {s}
                      <ArrowUpRight
                        size={14}
                        className="text-fg-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-octa-600"
                      />
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      <AnimatePresence>
        {!empty && !atBottom && (
          <motion.button
            aria-label="Scroll to latest"
            initial={{ opacity: 0, y: 8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.9 }}
            onClick={() =>
              scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: reduce ? "auto" : "smooth" })
            }
            className="absolute bottom-32 left-1/2 z-10 grid size-10 -translate-x-1/2 place-items-center rounded-full bg-elevated shadow-float ring-1 ring-hairline"
          >
            <ArrowDown size={17} />
          </motion.button>
        )}
      </AnimatePresence>

      <div className="shrink-0 px-3 pb-4 sm:px-5">
        <div className="mx-auto max-w-[760px]">
          <AnimatePresence>
            {error && (
              <motion.p
                role="alert"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-2 px-1 text-[13px] text-red-600"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>
          <Composer
            id="chat-input"
            label="Message Octa"
            placeholder={empty ? "Ask Octa anything…" : "Reply to Octa…"}
            value={input}
            onChange={setInput}
            onSubmit={send}
            onStop={() => abortRef.current?.abort()}
            uploads={uploads}
            busy={streaming}
            suggest={suggest}
            autoFocus
          />
          <p className="mt-2 text-center text-[12px] text-fg-3">Octa can make mistakes. Check anything important.</p>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ name, onPick }: { name: string; onPick: (text: string) => void }) {
  const reduce = useReducedMotion();
  const greeting = useGreeting(name);
  const [category, setCategory] = useState<PromptCategory>("Popular");
  const prompts = PROMPTS.filter((p) => (category === "Popular" ? p.popular : p.category === category)).slice(0, 4);

  return (
    <div className="mx-auto flex min-h-full max-w-[760px] flex-col justify-center px-5 py-10">
      <motion.div
        initial={reduce ? false : { opacity: 0, scale: 0.8, rotate: -30 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 120, damping: 14 }}
      >
        <OctacoreMark size={40} />
      </motion.div>
      <motion.h1
        initial={reduce ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 90, damping: 18, delay: 0.05 }}
        className="mt-6 text-balance [overflow-wrap:anywhere] font-[family-name:var(--font-display)] text-[40px] font-semibold leading-[1.02] tracking-[-0.045em] sm:text-[56px]"
      >
        {greeting}
      </motion.h1>
      <motion.p
        initial={reduce ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 90, damping: 18, delay: 0.1 }}
        className="mt-3 text-[17px] text-fg-2"
      >
        What are we working on? From pricing a site to pitching your next client.
      </motion.p>

      <div role="tablist" aria-label="Prompt ideas" className="-mx-1 mt-9 flex gap-1 overflow-x-auto px-1 pb-1">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            role="tab"
            aria-selected={category === c}
            onClick={() => setCategory(c)}
            className={`relative h-9 shrink-0 rounded-full px-3.5 text-[13px] font-medium transition-colors ${category === c ? "text-fg" : "text-fg-3 hover:text-fg"}`}
          >
            {category === c && (
              <motion.span
                layoutId="prompt-category"
                className="absolute inset-0 rounded-full bg-fg/[.07]"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative">{c}</span>
          </button>
        ))}
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <AnimatePresence mode="popLayout" initial={false}>
          {prompts.map((p, i) => (
            <motion.button
              key={p.text}
              layout
              initial={reduce ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 260, damping: 26, delay: i * 0.04 }}
              onClick={() => onPick(p.text)}
              className="group flex min-h-[64px] items-start justify-between gap-3 rounded-[18px] bg-elevated px-4 py-3.5 text-left text-[15px] leading-[1.35] text-fg-2 shadow-soft ring-1 ring-hairline transition-[color,transform,box-shadow] hover:-translate-y-0.5 hover:text-fg hover:shadow-float"
            >
              {p.text}
              <ArrowUpRight size={16} className="mt-0.5 shrink-0 text-fg-3 transition-colors group-hover:text-octa-600" />
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function AssistantMessage({
  message,
  live,
  streaming,
  canRegenerate,
  onRegenerate,
}: {
  message: Message;
  live: boolean;
  streaming: boolean;
  canRegenerate: boolean;
  onRegenerate: () => void;
}) {
  const reduce = useReducedMotion();
  const [copied, setCopied] = useState(false);
  const { text, done } = useSmoothText(message.content, live && !reduce);
  const typing = streaming || !done;

  if (!message.content && streaming) {
    return (
      <div role="status" className="flex items-center gap-3 py-1">
        <motion.span
          animate={reduce ? undefined : { rotate: 360 }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
        >
          <OctacoreMark size={20} />
        </motion.span>
        <span className="shimmer-text text-[15px] font-medium">Thinking…</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      className="group min-w-0 text-[16px] leading-[1.65]"
    >
      <Markdown>{text}</Markdown>
      {typing && (
        <span
          aria-hidden
          className="ml-0.5 inline-block size-2.5 translate-y-[-1px] animate-pulse rounded-full bg-octa-600 align-middle"
        />
      )}
      {message.failed && <p className="mt-2 text-[13px] text-red-600">This reply didn&apos;t finish. Try again.</p>}
      {!typing && message.content && (
        <div className="mt-2 flex gap-0.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
          <button
            onClick={async () => {
              await navigator.clipboard.writeText(message.content);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            className="flex h-9 items-center gap-1.5 rounded-full px-2.5 text-[13px] text-fg-3 hover:bg-fg/5 hover:text-fg"
          >
            {copied ? <Check size={14} /> : <Copy size={14} strokeWidth={1.5} />} {copied ? "Copied" : "Copy"}
          </button>
          {canRegenerate && (
            <button
              onClick={onRegenerate}
              className="flex h-9 items-center gap-1.5 rounded-full px-2.5 text-[13px] text-fg-3 hover:bg-fg/5 hover:text-fg"
            >
              <RotateCcw size={14} strokeWidth={1.5} /> Regenerate
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}
