"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowUp, Check, Copy, Square } from "lucide-react";
import { readModelText } from "@/lib/ai/read-events";
import type { ChatMessage } from "@/lib/chat/store";
import { Markdown } from "./markdown";
import { AttachButton, AttachmentList, PendingTray } from "@/components/uploads/attachments";
import { useUploads } from "@/components/uploads/use-uploads";
import { useWorkspace } from "@/components/app/workspace";

type Message = Pick<ChatMessage, "role" | "content"> & { id: string; failed?: boolean; attachments?: ChatMessage["attachments"] };

const SUGGESTIONS = [
  "Write a cold email to a dentist whose website looks dated",
  "How should I price a five-page website for a restaurant?",
  "Give me ten local niches that still need better websites",
  "Explain local SEO to a bakery owner in plain words",
];

export function Chat({ conversationId, initialMessages = [] }: { conversationId?: string; initialMessages?: ChatMessage[] }) {
  const { conversations, upsertConversation } = useWorkspace();
  const reduce = useReducedMotion();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const uploads = useUploads();
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState("");
  const idRef = useRef(conversationId);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef(true);

  // Follow the reply as it streams, unless the reader has scrolled up.
  useEffect(() => {
    const el = scrollRef.current;
    if (el && stickRef.current) el.scrollTop = el.scrollHeight;
  }, [messages]);

  async function send(text: string) {
    const value = text.trim();
    const attachments = uploads.attachments;
    if ((!value && !attachments.length) || streaming || uploads.uploading) return;
    setInput("");
    uploads.clear();
    setError("");
    stickRef.current = true;
    const replyId = crypto.randomUUID();
    setMessages((m) => [...m, { id: crypto.randomUUID(), role: "user", content: value, attachments }, { id: replyId, role: "assistant", content: "" }]);
    setStreaming(true);
    const abort = new AbortController();
    abortRef.current = abort;
    const setReply = (patch: Partial<Message>) => setMessages((m) => m.map((msg) => (msg.id === replyId ? { ...msg, ...patch } : msg)));

    let reply = "";
    const save = () =>
      reply &&
      idRef.current &&
      fetch(`/api/chat/${idRef.current}/reply`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content: reply }),
      }).catch(() => {});
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ conversationId: idRef.current, message: value, attachments: attachments.map((a) => a.id) }),
        signal: abort.signal,
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Something went wrong.");
      }
      const newId = res.headers.get("x-conversation-id");
      if (newId && !idRef.current) {
        idRef.current = newId;
        window.history.replaceState(null, "", `/dashboard/chat/${newId}`);
      }
      reply = await readModelText(res, (content) => {
        reply = content;
        setReply({ content });
      });
      await save();
    } catch (e) {
      if (abort.signal.aborted) {
        // Keep what arrived before Stop.
        await save();
      } else {
        setReply({ failed: true });
        setError(e instanceof Error ? e.message : "Something went wrong.");
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
      if (idRef.current) {
        const existing = conversations.find((c) => c.id === idRef.current);
        upsertConversation({ id: idRef.current, title: existing?.title ?? value.replace(/\s+/g, " ").slice(0, 60), updatedAt: Date.now() });
      }
    }
  }

  const empty = messages.length === 0;

  return (
    <div className="flex h-full flex-col">
      <div
        ref={scrollRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
        }}
        className="min-h-0 flex-1 overflow-y-auto"
      >
        {empty ? (
          <div className="mx-auto flex h-full max-w-[760px] flex-col justify-center px-5 pb-10">
            <motion.h1
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 90, damping: 18 }}
              className="text-balance font-[family-name:var(--font-display)] text-[40px] font-semibold leading-[1.02] tracking-[-0.04em] sm:text-[56px]"
            >
              What&apos;s on your mind?
            </motion.h1>
            <p className="mt-3 text-[17px] text-fg-2">Ask anything — from pricing a site to pitching your next client.</p>
            <div className="mt-8 grid gap-2 sm:grid-cols-2">
              {SUGGESTIONS.map((s, i) => (
                <motion.button
                  key={s}
                  initial={reduce ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 90, damping: 18, delay: 0.08 * (i + 1) }}
                  onClick={() => send(s)}
                  className="min-h-[56px] rounded-[18px] bg-elevated px-4 py-3 text-left text-[15px] leading-[1.35] text-fg-2 shadow-soft ring-1 ring-hairline transition-colors hover:text-fg"
                >
                  {s}
                </motion.button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-[760px] space-y-8 px-5 py-10">
            {messages.map((m) =>
              m.role === "user" ? (
                <div key={m.id} className="flex flex-col items-end gap-2">
                  <AttachmentList items={m.attachments ?? []} />
                  <p className="max-w-[85%] whitespace-pre-wrap break-words rounded-[18px] bg-fg/[.07] px-4 py-2.5 text-[16px] leading-[1.5]">{m.content}</p>
                </div>
              ) : (
                <AssistantMessage key={m.id} message={m} streaming={streaming && m === messages[messages.length - 1]} />
              ),
            )}
          </div>
        )}
      </div>

      <div className="shrink-0 px-3 pb-4 sm:px-5">
        {error && (
          <p role="alert" className="mx-auto mb-2 max-w-[760px] px-1 text-[13px] text-red-600">
            {error}
          </p>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files.length) uploads.add(e.dataTransfer.files);
          }}
          className="mx-auto max-w-[760px] rounded-[22px] bg-elevated p-2 shadow-soft ring-1 ring-hairline transition-shadow focus-within:shadow-[0_1px_2px_rgba(0,0,0,.06),0_20px_60px_-10px_rgba(194,65,12,.25)]"
        >
          <PendingTray files={uploads.files} onRemove={uploads.remove} />
          <div className="flex items-end gap-1">
            <AttachButton onFiles={uploads.add} disabled={streaming} />
            <label htmlFor="chat-input" className="sr-only">
              Message Octa
            </label>
            <textarea
              id="chat-input"
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onPaste={(e) => {
                if (e.clipboardData.files.length) {
                  e.preventDefault();
                  uploads.add(e.clipboardData.files);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  send(input);
                }
              }}
              placeholder="Message Octa"
              className="field-sizing-content max-h-[200px] min-h-11 flex-1 resize-none bg-transparent px-1 py-2.5 text-[16px] leading-[1.5] placeholder:text-fg-3 focus:outline-none"
            />
            {streaming ? (
              <button
                type="button"
                aria-label="Stop"
                onClick={() => abortRef.current?.abort()}
                className="grid size-11 shrink-0 place-items-center rounded-full bg-fg text-canvas transition-transform active:scale-95"
              >
                <Square size={14} fill="currentColor" />
              </button>
            ) : (
              <button
                type="submit"
                aria-label="Send"
                disabled={(!input.trim() && !uploads.attachments.length) || uploads.uploading}
                className="grid size-11 shrink-0 place-items-center rounded-full bg-octa-600 text-white transition-all hover:bg-octa-500 active:scale-95 disabled:bg-fg/10 disabled:text-fg-3"
              >
                <ArrowUp size={20} strokeWidth={2} />
              </button>
            )}
          </div>
        </form>
        <p className="mx-auto mt-2 max-w-[760px] text-center text-[12px] text-fg-3">Octa can make mistakes. Check anything important.</p>
      </div>
    </div>
  );
}

function AssistantMessage({ message, streaming }: { message: Message; streaming: boolean }) {
  const [copied, setCopied] = useState(false);
  if (!message.content && streaming) {
    return (
      <div role="status" aria-label="Octa is thinking" className="flex gap-1.5 py-2">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="size-2 rounded-full bg-fg-3"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
    );
  }
  return (
    <div className="group min-w-0 text-[16px] leading-[1.6]">
      <Markdown>{message.content}</Markdown>
      {message.failed && <p className="mt-2 text-[13px] text-red-600">This reply didn&apos;t finish. Try sending it again.</p>}
      {!streaming && message.content && (
        <button
          onClick={async () => {
            await navigator.clipboard.writeText(message.content);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="mt-2 flex h-9 items-center gap-1.5 rounded-full px-2.5 text-[13px] text-fg-3 opacity-100 transition-opacity hover:bg-fg/5 hover:text-fg sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
        >
          {copied ? <Check size={14} /> : <Copy size={14} strokeWidth={1.5} />} {copied ? "Copied" : "Copy"}
        </button>
      )}
    </div>
  );
}
