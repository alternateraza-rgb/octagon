"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, Mic, PhoneOff } from "lucide-react";
import { readModelText } from "@/lib/ai/read-events";
import { Markdown } from "@/components/chat/markdown";
import { coachStore, useCoach } from "./coach-store";
import { VoiceOrb } from "./voice-orb";

type Message = { role: "user" | "assistant"; content: string };

const STARTERS = ["Walk me through this lesson", "What should I do next in my account?", "Role-play this with me"];

// Coach beside a lesson: talk out loud when voice is set up, or type. Keyed by lesson, so each
// lesson starts a fresh conversation.
export function CoachPanel({ lessonId, voice }: { lessonId: string; voice: boolean }) {
  const coach = useCoach();
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const list = useRef<HTMLDivElement>(null);
  const live = coach.status === "connected" || coach.status === "starting";
  const voiceHere = live && coach.lessonId === lessonId;

  useEffect(() => {
    list.current?.scrollTo({ top: list.current.scrollHeight, behavior: "smooth" });
  }, [messages, coach.lines]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || busy) return;
    const history: Message[] = [...messages, { role: "user", content }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setDraft("");
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/academy/coach", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ lessonId, messages: history }),
      });
      if (!res.ok) throw new Error(((await res.json().catch(() => null)) as { error?: string } | null)?.error ?? "Coach didn't answer.");
      await readModelText(res, (t) => setMessages([...history, { role: "assistant", content: t }]));
    } catch (e) {
      setMessages(history);
      setError(e instanceof Error ? e.message : "Coach didn't answer.");
    } finally {
      setBusy(false);
    }
  }

  const lines = voiceHere ? coach.lines.map((l) => ({ role: l.role === "coach" ? "assistant" : "user", content: l.text }) as Message) : messages;

  return (
    <section aria-label="Coach" className="flex max-h-[calc(100dvh-96px)] flex-col overflow-hidden rounded-[28px] bg-elevated shadow-soft ring-1 ring-hairline">
      <div className="flex items-center gap-4 border-b border-hairline p-5">
        <VoiceOrb size={56} active={voiceHere && coach.status === "connected"} speaking={voiceHere && coach.speaking} />
        <div className="min-w-0 flex-1">
          <p className="text-[17px] font-semibold tracking-[-0.01em]">Coach</p>
          <p className="text-[13px] text-fg-2">
            {voiceHere
              ? coach.status === "starting"
                ? "Connecting…"
                : coach.speaking
                  ? "Talking…"
                  : "Listening. Just talk."
              : voice
                ? "Talk it through, or type."
                : "Ask anything about this lesson."}
          </p>
        </div>
        {voice &&
          (voiceHere ? (
            <button
              onClick={() => coachStore.stop()}
              aria-label="End voice session"
              className="grid size-11 place-items-center rounded-full bg-red-500 text-white hover:bg-red-600"
            >
              <PhoneOff size={18} strokeWidth={1.75} />
            </button>
          ) : (
            <button
              onClick={() => {
                if (live) coachStore.stop();
                coachStore.start(lessonId);
              }}
              className="flex h-11 items-center gap-1.5 rounded-full bg-octa-600 px-4 text-[14px] font-medium text-white hover:bg-octa-500"
            >
              <Mic size={16} strokeWidth={1.75} /> Talk
            </button>
          ))}
      </div>

      <div ref={list} className="min-h-[160px] flex-1 space-y-3 overflow-y-auto p-5" aria-live="polite">
        {lines.length === 0 && !voiceHere && (
          <div className="space-y-2">
            {STARTERS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="block min-h-11 w-full rounded-[14px] bg-canvas-2 px-4 py-2.5 text-left text-[14px] text-fg-2 hover:bg-fg/[.06] hover:text-fg"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        {lines.map((m, i) =>
          m.role === "user" ? (
            <p key={i} className="ml-8 rounded-[18px] rounded-br-[6px] bg-fg/[.07] px-4 py-2.5 text-[15px]">
              {m.content}
            </p>
          ) : (
            <div key={i} className="text-[15px] leading-[1.55]">
              {m.content ? <Markdown>{m.content}</Markdown> : <span className="inline-block size-2 animate-pulse rounded-full bg-fg-3" />}
            </div>
          ),
        )}
        {(error || (coach.status === "error" && coach.lessonId === lessonId && coach.error)) && (
          <p className="text-[14px] text-red-600 dark:text-red-400">{error ?? coach.error}</p>
        )}
      </div>

      {!voiceHere && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(draft);
          }}
          className="flex items-end gap-2 border-t border-hairline p-3"
        >
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(draft);
              }
            }}
            rows={1}
            placeholder="Ask Coach…"
            aria-label="Message Coach"
            className="max-h-32 min-h-11 flex-1 resize-none rounded-[12px] bg-canvas-2 px-3.5 py-3 text-[15px] outline-none placeholder:text-fg-3 focus:ring-4 focus:ring-octa-600/15"
          />
          <button
            type="submit"
            disabled={!draft.trim() || busy}
            aria-label="Send"
            className="grid size-11 shrink-0 place-items-center rounded-full bg-octa-600 text-white hover:bg-octa-500 disabled:opacity-40"
          >
            <ArrowUp size={18} strokeWidth={2} />
          </button>
        </form>
      )}
    </section>
  );
}
