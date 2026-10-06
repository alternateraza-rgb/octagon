"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ConversationProvider, useConversation } from "@elevenlabs/react";
import { ArrowLeft, ArrowUp, Keyboard, Loader2, Mic, Phone, PhoneOff } from "lucide-react";
import { DIFFICULTIES, MOODS, TRADES } from "@/lib/academy/scenarios";
import type { AcademyLead, PracticeCall, TranscriptLine } from "@/lib/academy/store";
import type { Difficulty, Mood, Scenario, Trade } from "@/lib/academy/types";
import { readModelText } from "@/lib/ai/read-events";
import { useToast } from "@/components/ui/toast";
import { ScoreBadge } from "./academy-home";
import { coachStore } from "./coach-store";
import { Scorecard } from "./scorecard";
import { VoiceOrb } from "./voice-orb";

type Prospect = { name: string; business: string; trade: string; city: string; firstMessage: string };
type Started = { seed: number; prospect: Prospect; voice: { signedUrl: string; overrides: Record<string, unknown>; maxSeconds: number } | null };
type Phase = { at: "setup" } | { at: "call"; started: Started } | { at: "grading" } | { at: "result"; call: PracticeCall };

const when = new Intl.DateTimeFormat("en", { month: "short", day: "numeric" });

// Cold-call practice: pick a prospect, call them (out loud or by text), then get a scorecard.
export function CallSimulator({
  leads,
  calls: initialCalls,
  voice,
  preset,
}: {
  leads: AcademyLead[];
  calls: PracticeCall[];
  voice: boolean;
  preset: Partial<Scenario> & { lead?: string };
}) {
  const toast = useToast();
  const reduce = useReducedMotion();
  const [scenario, setScenario] = useState<Scenario>({
    trade: preset.trade ?? "plumber",
    mood: preset.mood ?? "busy",
    difficulty: preset.difficulty ?? "normal",
  });
  const [leadId, setLeadId] = useState(preset.lead && leads.some((l) => l.id === preset.lead) ? preset.lead : "");
  const [mode, setMode] = useState<"voice" | "text">(voice ? "voice" : "text");
  const [phase, setPhase] = useState<Phase>({ at: "setup" });
  const [starting, setStarting] = useState(false);
  const [calls, setCalls] = useState(initialCalls);
  const lead = leads.find((l) => l.id === leadId) ?? null;

  async function start() {
    setStarting(true);
    if (mode === "voice") {
      coachStore.stop();
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch {
        setStarting(false);
        return toast.error("Allow microphone access to call out loud, or switch to text.");
      }
    }
    const res = await fetch("/api/academy/practice/start", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ scenario, leadId: leadId || null, voice: mode === "voice" }),
    }).catch(() => null);
    const body = (await res?.json().catch(() => null)) as (Started & { error?: string }) | null;
    setStarting(false);
    if (!res?.ok || !body) return toast.error(body?.error ?? "Couldn't start the call. Try again.");
    setPhase({ at: "call", started: body });
  }

  async function finish(started: Started, transcript: TranscriptLine[], durationSec: number, conversationId: string | null) {
    if (transcript.filter((l) => l.role === "user").length < 2) {
      toast.error("That call was too short to score.");
      return setPhase({ at: "setup" });
    }
    setPhase({ at: "grading" });
    const res = await fetch("/api/academy/calls", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ scenario, leadId: leadId || null, seed: started.seed, transcript, durationSec, conversationId }),
    }).catch(() => null);
    const body = (await res?.json().catch(() => null)) as (PracticeCall & { error?: string }) | null;
    if (!res?.ok || !body) {
      toast.error(body?.error ?? "Couldn't score that call.");
      return setPhase({ at: "setup" });
    }
    setCalls((c) => [body, ...c]);
    setPhase({ at: "result", call: body });
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-[1000px] px-5 pb-24 pt-8 sm:pt-12">
        <Link href="/dashboard/academy" className="inline-flex h-11 items-center gap-1.5 text-[14px] text-fg-2 hover:text-fg">
          <ArrowLeft size={16} strokeWidth={1.75} /> Academy
        </Link>
        <motion.h1
          initial={reduce ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 90, damping: 18 }}
          className="mt-2 font-[family-name:var(--font-display)] text-[44px] font-semibold leading-[1] tracking-[-0.045em] sm:text-[56px]"
        >
          Practice calls
        </motion.h1>
        <p className="mt-3 max-w-[620px] text-[17px] text-fg-2">
          Call an AI business owner who doesn&apos;t want to be sold to. Open, ask questions, handle the pushback, and ask for the next step.
        </p>

        <div className="mt-10">
          <AnimatePresence mode="wait">
            {phase.at === "setup" && (
              <motion.div key="setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
                {leads.length > 0 && (
                  <Field label="Call a business you found" hint="The prospect plays this exact business. Leave empty for a made-up one.">
                    <select
                      value={leadId}
                      onChange={(e) => setLeadId(e.target.value)}
                      aria-label="Business to call"
                      className="h-11 w-full max-w-[420px] rounded-[12px] bg-elevated px-3 text-[15px] outline-none ring-1 ring-hairline focus:ring-4 focus:ring-octa-600/15"
                    >
                      <option value="">A made-up business</option>
                      {leads.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name}
                          {l.city ? ` · ${l.city}` : ""}
                        </option>
                      ))}
                    </select>
                  </Field>
                )}
                {!lead && (
                  <Field label="Trade">
                    <Chips
                      value={scenario.trade}
                      options={Object.entries(TRADES).map(([id, t]) => ({ id: id as Trade, label: t.label }))}
                      onChange={(trade) => setScenario({ ...scenario, trade })}
                    />
                  </Field>
                )}
                <Field label="Mood">
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    {(Object.entries(MOODS) as [Mood, (typeof MOODS)[Mood]][]).map(([id, m]) => (
                      <button
                        key={id}
                        onClick={() => setScenario({ ...scenario, mood: id })}
                        aria-pressed={scenario.mood === id}
                        className={`rounded-[18px] p-4 text-left transition-shadow ${
                          scenario.mood === id ? "bg-elevated shadow-soft ring-2 ring-octa-600" : "bg-canvas-2 hover:bg-fg/[.06]"
                        }`}
                      >
                        <p className="text-[15px] font-semibold">{m.label}</p>
                        <p className="mt-1 text-[13px] leading-[1.4] text-fg-2">{m.hint}</p>
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label="Difficulty">
                  <Chips
                    value={scenario.difficulty}
                    options={Object.entries(DIFFICULTIES).map(([id, d]) => ({ id: id as Difficulty, label: d.label }))}
                    onChange={(difficulty) => setScenario({ ...scenario, difficulty })}
                  />
                </Field>

                <div className="flex flex-wrap items-center gap-3 border-t border-hairline pt-8">
                  <div className="flex rounded-full bg-fg/[.06] p-1" role="radiogroup" aria-label="How to call">
                    {(
                      [
                        ["voice", "Out loud", Mic],
                        ["text", "By text", Keyboard],
                      ] as const
                    ).map(([id, label, Icon]) => (
                      <button
                        key={id}
                        role="radio"
                        aria-checked={mode === id}
                        disabled={id === "voice" && !voice}
                        onClick={() => setMode(id)}
                        title={id === "voice" && !voice ? "Voice calls aren't set up yet" : undefined}
                        className={`flex h-10 items-center gap-1.5 rounded-full px-4 text-[14px] font-medium disabled:opacity-40 ${
                          mode === id ? "bg-elevated shadow-soft" : "text-fg-2"
                        }`}
                      >
                        <Icon size={15} strokeWidth={1.75} /> {label}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={start}
                    disabled={starting}
                    className="flex h-12 items-center gap-2 rounded-full bg-emerald-600 px-6 text-[16px] font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
                  >
                    {starting ? <Loader2 size={18} className="animate-spin" /> : <Phone size={18} strokeWidth={1.75} />}
                    Call {lead ? lead.name : `the ${TRADES[scenario.trade].label.toLowerCase()}`}
                  </button>
                  {!voice && <p className="text-[13px] text-fg-3">Voice calls turn on once ElevenLabs is connected.</p>}
                </div>
              </motion.div>
            )}

            {phase.at === "call" &&
              (phase.started.voice ? (
                <ConversationProvider key="voice">
                  <VoiceCall started={phase.started} onEnd={(t, d, id) => finish(phase.started, t, d, id)} />
                </ConversationProvider>
              ) : (
                <TextCall
                  key="text"
                  started={phase.started}
                  scenario={scenario}
                  leadId={leadId || null}
                  onEnd={(t, d) => finish(phase.started, t, d, null)}
                />
              ))}

            {phase.at === "grading" && (
              <motion.div key="grading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid place-items-center py-24 text-center">
                <Loader2 size={28} className="animate-spin text-octa-600" />
                <p className="mt-4 text-[17px] font-medium">Scoring your call…</p>
                <p className="mt-1 text-[14px] text-fg-2">Going through it line by line.</p>
              </motion.div>
            )}

            {phase.at === "result" && <Scorecard key="result" call={phase.call} onAgain={() => setPhase({ at: "setup" })} />}
          </AnimatePresence>
        </div>

        {calls.length > 0 && phase.at === "setup" && (
          <>
            <h2 className="mt-16 text-[24px] font-semibold tracking-[-0.02em]">Your calls</h2>
            <ul className="mt-4 overflow-hidden rounded-[24px] bg-elevated shadow-soft ring-1 ring-hairline">
              {calls.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => setPhase({ at: "result", call: c })}
                    className="flex w-full items-center gap-4 border-b border-hairline px-5 py-4 text-left hover:bg-fg/[.03]"
                  >
                    <ScoreBadge score={c.score} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[16px] font-medium">{c.prospectName}</span>
                      <span className="block truncate text-[13px] text-fg-2">
                        {MOODS[c.scenario.mood].label} · {DIFFICULTIES[c.scenario.difficulty].label} · {c.feedback.summary}
                      </span>
                    </span>
                    <span className="text-[13px] text-fg-3">{when.format(c.createdAt)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[15px] font-semibold">{label}</p>
      {hint && <p className="mt-0.5 text-[13px] text-fg-2">{hint}</p>}
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Chips<T extends string>({ value, options, onChange }: { value: T; options: { id: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          aria-pressed={value === o.id}
          className={`h-11 rounded-full px-4 text-[14px] font-medium ${value === o.id ? "bg-fg text-canvas" : "bg-fg/[.06] text-fg-2 hover:text-fg"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function useTimer() {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);
  return seconds;
}

const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

function CallFrame({
  prospect,
  seconds,
  status,
  orb,
  lines,
  onHangUp,
  children,
}: {
  prospect: Prospect;
  seconds: number;
  status: string;
  orb: { active: boolean; speaking: boolean };
  lines: TranscriptLine[];
  onHangUp: () => void;
  children?: React.ReactNode;
}) {
  const list = useRef<HTMLDivElement>(null);
  useEffect(() => {
    list.current?.scrollTo({ top: list.current.scrollHeight, behavior: "smooth" });
  }, [lines]);
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="overflow-hidden rounded-[32px] bg-ink text-white shadow-float dark:bg-elevated"
    >
      <div className="flex flex-col items-center px-6 pb-6 pt-10 text-center">
        <VoiceOrb size={112} active={orb.active} speaking={orb.speaking} />
        <p className="mt-5 text-[24px] font-semibold tracking-[-0.02em]">{prospect.name}</p>
        <p className="text-[15px] text-white/65">
          {prospect.business}
          {prospect.city ? ` · ${prospect.city}` : ""}
        </p>
        <p className="mt-2 text-[14px] tabular-nums text-white/50">
          {clock(seconds)} · {status}
        </p>
      </div>
      <div ref={list} className="h-[300px] space-y-2.5 overflow-y-auto border-t border-white/10 px-5 py-5" aria-live="polite">
        {lines.map((l, i) => (
          <p
            key={i}
            className={`w-fit max-w-[80%] rounded-[18px] px-4 py-2.5 text-[15px] leading-[1.45] ${
              l.role === "user" ? "ml-auto rounded-br-[6px] bg-octa-600" : "rounded-bl-[6px] bg-white/10"
            }`}
          >
            {l.text}
          </p>
        ))}
      </div>
      {children}
      <div className="flex justify-center border-t border-white/10 py-5">
        <button
          onClick={onHangUp}
          className="flex h-14 items-center gap-2 rounded-full bg-red-500 px-7 text-[16px] font-medium text-white hover:bg-red-600"
        >
          <PhoneOff size={19} strokeWidth={1.75} /> Hang up and score
        </button>
      </div>
    </motion.div>
  );
}

function VoiceCall({ started, onEnd }: { started: Started; onEnd: (t: TranscriptLine[], seconds: number, id: string | null) => void }) {
  const seconds = useTimer();
  const [lines, setLines] = useState<TranscriptLine[]>([]);
  const [status, setStatus] = useState("Ringing…");
  const linesRef = useRef<TranscriptLine[]>([]);
  const startedAt = useRef(0);
  const idRef = useRef<string | null>(null);
  const ended = useRef(false);
  const begun = useRef(false);

  const end = () => {
    if (ended.current) return;
    ended.current = true;
    onEnd(linesRef.current, Math.round((Date.now() - startedAt.current) / 1000), idRef.current);
  };

  const conversation = useConversation({
    onConnect: ({ conversationId }: { conversationId: string }) => {
      idRef.current = conversationId;
      setStatus("Connected");
    },
    onMessage: ({ message, role }) => {
      if (!message.trim()) return;
      linesRef.current = [...linesRef.current, { role: role === "user" ? "user" : "prospect", text: message }];
      setLines(linesRef.current);
    },
    onDisconnect: () => end(),
    onError: (message: string) => setStatus(message || "Line dropped"),
  });
  const { startSession, endSession, isSpeaking } = conversation;

  useEffect(() => {
    // Strict mode mounts twice in development; one call is enough.
    if (begun.current) return;
    begun.current = true;
    startedAt.current = Date.now();
    startSession({ signedUrl: started.voice!.signedUrl, overrides: started.voice!.overrides });
    const limit = setTimeout(() => endSession(), started.voice!.maxSeconds * 1000);
    return () => clearTimeout(limit);
  }, [startSession, endSession, started]);

  return (
    <CallFrame
      prospect={started.prospect}
      seconds={seconds}
      status={isSpeaking ? `${started.prospect.name} is talking` : status === "Connected" ? "Your turn" : status}
      orb={{ active: status === "Connected", speaking: isSpeaking }}
      lines={lines}
      onHangUp={() => {
        endSession();
        end();
      }}
    />
  );
}

function TextCall({
  started,
  scenario,
  leadId,
  onEnd,
}: {
  started: Started;
  scenario: Scenario;
  leadId: string | null;
  onEnd: (t: TranscriptLine[], seconds: number) => void;
}) {
  const seconds = useTimer();
  const toast = useToast();
  const [lines, setLines] = useState<TranscriptLine[]>([{ role: "prospect", text: started.prospect.firstMessage }]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  async function say() {
    const text = draft.trim();
    if (!text || busy) return;
    const next: TranscriptLine[] = [...lines, { role: "user", text }];
    setLines(next);
    setDraft("");
    setBusy(true);
    try {
      const res = await fetch("/api/academy/practice/reply", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          scenario,
          leadId,
          seed: started.seed,
          messages: next.map((l) => ({ role: l.role === "user" ? "user" : "assistant", content: l.text })),
        }),
      });
      if (!res.ok) throw new Error(((await res.json().catch(() => null)) as { error?: string } | null)?.error ?? "No answer.");
      await readModelText(res, (t) => setLines([...next, { role: "prospect", text: t }]));
    } catch (e) {
      setLines(next);
      toast.error(e instanceof Error ? e.message : "No answer.");
    } finally {
      setBusy(false);
      input.current?.focus();
    }
  }

  return (
    <CallFrame
      prospect={started.prospect}
      seconds={seconds}
      status={busy ? `${started.prospect.name} is answering` : "Your turn"}
      orb={{ active: true, speaking: busy }}
      lines={lines}
      onHangUp={() => onEnd(lines, seconds)}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          say();
        }}
        className="flex gap-2 border-t border-white/10 p-3"
      >
        <input
          ref={input}
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type what you'd say…"
          aria-label="What you say"
          className="h-12 flex-1 rounded-full bg-white/10 px-5 text-[15px] text-white outline-none placeholder:text-white/40 focus:ring-4 focus:ring-octa-600/30"
        />
        <button
          type="submit"
          disabled={!draft.trim() || busy}
          aria-label="Say it"
          className="grid size-12 place-items-center rounded-full bg-octa-600 hover:bg-octa-500 disabled:opacity-40"
        >
          <ArrowUp size={19} strokeWidth={2} />
        </button>
      </form>
    </CallFrame>
  );
}
