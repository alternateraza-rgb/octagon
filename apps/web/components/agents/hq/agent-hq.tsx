"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import {
  ArrowLeft,
  AtSign,
  Inbox,
  MapPin,
  MessageCircle,
  Pause,
  Play,
  Radar,
  Reply,
  Search,
  Send,
  type LucideIcon,
} from "lucide-react";
import { useWorkspace } from "@/components/app/workspace";
import { AgentBadge } from "./agent-badge";
import { LeadPeek } from "./lead-peek";
import { STAGES, STAGE_DOT as PIN_DOT, type Agent, type AgentEvent, type EventKind, type FieldLead, type Stage } from "./types";
import { ago } from "./time";

const FieldMap = dynamic(() => import("./field-map"), {
  ssr: false,
  loading: () => <div className="absolute inset-0 animate-pulse bg-canvas-2" />,
});

const EVENT_ICON: Record<EventKind, LucideIcon> = {
  search: Search,
  found: MapPin,
  email: AtSign,
  sent: Send,
  followup: Reply,
  reply: MessageCircle,
  paused: Pause,
};

const spring = { type: "spring" as const, stiffness: 110, damping: 20 };

// Every page of the prototype moves the agent forward on its own, so the screen shows what a working
// agent feels like. The real screen polls the outreach API instead.
const TICK = 3800;

function subscribeDark(onChange: () => void) {
  const q = window.matchMedia("(prefers-color-scheme: dark)");
  q.addEventListener("change", onChange);
  return () => q.removeEventListener("change", onChange);
}

function usePrefersDark() {
  const { theme } = useWorkspace();
  const systemDark = useSyncExternalStore(
    subscribeDark,
    () => window.matchMedia("(prefers-color-scheme: dark)").matches,
    () => false,
  );
  return theme === "dark" || (theme === "system" && systemDark);
}

export function AgentHQ({ agent, initialLeads, initialEvents, now: renderedAt }: { agent: Agent; initialLeads: FieldLead[]; initialEvents: AgentEvent[]; now: number }) {
  const reduce = !!useReducedMotion();
  const dark = usePrefersDark();
  const [leads, setLeads] = useState(initialLeads);
  const [events, setEvents] = useState(initialEvents);
  const [status, setStatus] = useState(agent.status);
  const [filter, setFilter] = useState<Stage | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [now, setNow] = useState(renderedAt);
  const counter = useRef(0);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(id);
  }, []);

  const log = useCallback((kind: EventKind, text: string, detail?: string, leadId?: string) => {
    counter.current += 1;
    setEvents((e) => [{ id: `live-${counter.current}`, at: Date.now(), kind, text, detail, leadId }, ...e].slice(0, 40));
  }, []);

  const leadsRef = useRef(leads);
  useEffect(() => {
    leadsRef.current = leads;
  }, [leads]);

  // Moves one business a step along, the way the agent would over a day.
  useEffect(() => {
    if (status !== "active") return;
    const id = setInterval(() => {
      const all = leadsRef.current;
      // Replies turn into interest now and then; everything else keeps moving.
      const movable = all.filter((l) => l.stage !== "interested" && (l.stage !== "replied" || Math.random() < 0.15));
      const pick = movable[Math.floor(Math.random() * movable.length)];
      if (!pick) return;
      const next = STAGES[STAGES.findIndex((s) => s.id === pick.stage) + 1].id;
      const email = pick.email ?? `hello@${pick.name.toLowerCase().replace(/[^a-z]/g, "").slice(0, 14)}.ca`;
      const source = pick.emailSource ?? "facebook.com";
      const story: Record<Exclude<Stage, "found">, [EventKind, string, string]> = {
        email: ["email", `Found an email for ${pick.name}`, `Listed on ${source}`],
        contacted: ["sent", `Sent the first email to ${pick.name}`, `“A website for ${pick.name}?”`],
        replied: ["reply", `${pick.name} replied`, "Question: “What would it cost to keep it running?”"],
        interested: ["reply", `${pick.name} is interested`, "“Let's do it. Send me a preview.”"],
      };
      if (next === "found") return;
      const [kind, text, detail] = story[next];
      setLeads((ls) => ls.map((l) => (l.id === pick.id ? { ...l, stage: next, email, emailSource: source, at: Date.now() } : l)));
      log(kind, text, detail, pick.id);
    }, TICK);
    return () => clearInterval(id);
  }, [status, log]);

  const scout = () => {
    if (scanning) return;
    setScanning(true);
    log("search", `Scouting ${agent.locations[0]?.split(",")[0]} for ${agent.niche.toLowerCase()}`, "Checking every listing for a website");
    setTimeout(
      () => {
        const fresh: FieldLead[] = ["Hess Village Plumbing", "Main West Drains", "Fruitland Pipe Co.", "Mohawk Plumbing"].map((name, i) => {
          const angle = (i / 4) * Math.PI * 2 + 0.6;
          return {
            id: `new-${Date.now()}-${i}`,
            name,
            category: agent.niche.replace(/s$/, ""),
            address: `${200 + i * 37} ${["Queen St S", "Main St W", "Fruitland Rd", "Mohawk Rd E"][i]}`,
            lng: agent.center[0] + Math.cos(angle) * (0.03 + i * 0.008) * 1.4,
            lat: agent.center[1] + Math.sin(angle) * (0.03 + i * 0.008),
            stage: "found",
            score: 60 + i * 8,
            email: null,
            emailSource: null,
            at: Date.now(),
          };
        });
        setLeads((all) => [...all, ...fresh]);
        setScanning(false);
        log("found", `Found ${fresh.length} ${agent.niche.toLowerCase()} with no website`, fresh.map((f) => f.name).join(" · "));
      },
      reduce ? 300 : 2600,
    );
  };

  const counts = useMemo(() => {
    const c = { found: 0, email: 0, contacted: 0, replied: 0, interested: 0 } as Record<Stage, number>;
    for (const l of leads) c[l.stage] += 1;
    return c;
  }, [leads]);

  const visible = filter ? leads.filter((l) => l.stage === filter) : leads;
  const lead = leads.find((l) => l.id === selected) ?? null;

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-[1280px] px-5 pb-24 pt-8 sm:pt-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/dashboard/agents" className="inline-flex h-11 items-center gap-1.5 text-[15px] text-fg-2 hover:text-fg">
            <ArrowLeft size={16} strokeWidth={1.5} /> Agents
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/agents/inbox"
              className="flex h-11 items-center gap-2 rounded-full bg-fg/[.06] px-4 text-[15px] font-medium hover:bg-fg/10"
            >
              <Inbox size={17} strokeWidth={1.5} /> Replies
              <span className="tabular-nums text-fg-2">{counts.replied + counts.interested}</span>
            </Link>
            <button
              onClick={() => {
                const next = status === "active" ? "paused" : "active";
                setStatus(next);
                log(next === "active" ? "search" : "paused", next === "active" ? `${agent.name} is back at work` : `${agent.name} is paused`);
              }}
              className="flex h-11 items-center gap-2 rounded-full bg-fg/[.06] px-4 text-[15px] font-medium hover:bg-fg/10"
            >
              {status === "active" ? <Pause size={16} strokeWidth={1.5} /> : <Play size={16} strokeWidth={1.5} />}
              {status === "active" ? "Pause" : "Resume"}
            </button>
          </div>
        </div>

        <header className="mt-6 flex items-center gap-5">
          <AgentBadge name={agent.name} status={status} size={72} />
          <div className="min-w-0">
            <h1 className="font-[family-name:var(--font-display)] text-[36px] font-semibold leading-[1.05] tracking-[-0.04em] sm:text-[48px]">
              {agent.name}
            </h1>
            <p className="mt-1 truncate text-[17px] text-fg-2">
              {agent.niche} in {agent.locations.join(", ")} · {agent.dailyCap} a day
            </p>
          </div>
        </header>

        {/* The Field */}
        <section className="relative mt-8 overflow-hidden rounded-[28px] bg-canvas-2 shadow-soft ring-1 ring-hairline">
          <div className="relative h-[420px] sm:h-[520px]">
            <FieldMap leads={visible} center={agent.center} dark={dark} selected={selected} onSelect={setSelected} reduceMotion={reduce} />

            <AnimatePresence>{scanning && <RadarSweep reduce={reduce} />}</AnimatePresence>

            <div className="pointer-events-none absolute inset-x-3 top-3 flex flex-wrap items-start justify-between gap-2">
              <div className="material pointer-events-auto flex max-w-full gap-1 overflow-x-auto rounded-full p-1 shadow-soft ring-1 ring-hairline">
                <button
                  onClick={() => setFilter(null)}
                  className={`h-9 shrink-0 rounded-full px-3.5 text-[13px] font-medium transition-colors ${filter === null ? "bg-fg text-canvas" : "text-fg-2 hover:text-fg"}`}
                >
                  All <span className="tabular-nums opacity-70">{leads.length}</span>
                </button>
                {STAGES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setFilter(filter === s.id ? null : s.id)}
                    className={`flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium transition-colors ${
                      filter === s.id ? "bg-fg text-canvas" : "text-fg-2 hover:text-fg"
                    }`}
                  >
                    <span className={`size-2 rounded-full ${PIN_DOT[s.id]}`} />
                    <span className="hidden sm:inline">{s.label}</span>
                    <span className="tabular-nums opacity-70">{counts[s.id]}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pointer-events-none absolute bottom-3 left-3">
              <button
                onClick={scout}
                disabled={scanning}
                className="material pointer-events-auto flex h-11 items-center gap-2 rounded-full px-4 text-[15px] font-medium shadow-soft ring-1 ring-hairline hover:bg-elevated disabled:opacity-60"
              >
                <Radar size={17} strokeWidth={1.5} className={scanning ? "animate-spin text-octa-600" : "text-octa-600"} />
                {scanning ? "Scouting…" : "Scout now"}
              </button>
            </div>

            <Activity events={events} now={now} onPick={setSelected} className="absolute bottom-9 right-3 top-16 hidden w-[340px] lg:flex" />
          </div>
        </section>

        <Activity events={events} now={now} onPick={setSelected} className="mt-4 flex max-h-[360px] lg:hidden" />

        {/* The Pipeline */}
        <section className="mt-12">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-[28px] font-semibold tracking-[-0.03em]">Pipeline</h2>
            <p className="text-[14px] text-fg-3">Businesses move right as {agent.name} works.</p>
          </div>
          <LayoutGroup>
            <div className="-mx-5 mt-5 overflow-x-auto px-5 pb-2">
              <div className="grid min-w-[980px] grid-cols-5 gap-3">
                {STAGES.map((s, i) => {
                  const inStage = leads.filter((l) => l.stage === s.id).sort((a, b) => b.at - a.at);
                  return (
                    <div key={s.id} className={`rounded-[22px] p-3 ${i === 4 ? "bg-octa-600/[.06] ring-1 ring-octa-600/15" : "bg-fg/[.03]"}`}>
                      <div className="flex items-center justify-between px-1.5 pb-3 pt-1">
                        <p className="flex items-center gap-2 text-[14px] font-semibold">
                          <span className={`size-2 rounded-full ${PIN_DOT[s.id]}`} />
                          {s.label}
                        </p>
                        <motion.span key={inStage.length} initial={reduce ? false : { scale: 1.4 }} animate={{ scale: 1 }} className="text-[14px] tabular-nums text-fg-2">
                          {inStage.length}
                        </motion.span>
                      </div>
                      <ul className="space-y-2">
                        <AnimatePresence initial={false}>
                          {inStage.slice(0, 6).map((l) => (
                            <motion.li
                              key={l.id}
                              layout={!reduce}
                              layoutId={reduce ? undefined : l.id}
                              initial={reduce ? false : { opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={reduce ? undefined : { opacity: 0, scale: 0.9 }}
                              transition={spring}
                            >
                              <button
                                onClick={() => setSelected(l.id)}
                                className={`w-full rounded-[16px] bg-elevated p-3 text-left shadow-soft ring-1 transition-shadow hover:shadow-float ${
                                  selected === l.id ? "ring-octa-600" : "ring-hairline"
                                }`}
                              >
                                <p className="truncate text-[14px] font-semibold tracking-[-0.01em]">{l.name}</p>
                                <p className="mt-0.5 flex items-center justify-between text-[12px] text-fg-3">
                                  <span className="truncate">{l.email ?? l.address}</span>
                                  <span className="ml-2 shrink-0 tabular-nums">{ago(l.at, now)}</span>
                                </p>
                              </button>
                            </motion.li>
                          ))}
                        </AnimatePresence>
                      </ul>
                      {inStage.length > 6 && (
                        <button
                          onClick={() => setFilter(s.id)}
                          className="mt-2 h-9 w-full rounded-full text-[13px] font-medium text-fg-2 hover:bg-fg/5 hover:text-fg"
                        >
                          {inStage.length - 6} more on the map
                        </button>
                      )}
                      {!inStage.length && <p className="px-1.5 py-6 text-center text-[13px] text-fg-3">{s.hint}</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          </LayoutGroup>
        </section>
      </div>

      <LeadPeek lead={lead} agent={agent} now={now} onClose={() => setSelected(null)} />
    </div>
  );
}

function Activity({
  events,
  now,
  onPick,
  className = "",
}: {
  events: AgentEvent[];
  now: number;
  onPick: (id: string) => void;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <aside className={`material flex-col overflow-hidden rounded-[22px] shadow-soft ring-1 ring-hairline ${className}`}>
      <p className="flex items-center gap-2 border-b border-hairline px-4 py-3 text-[13px] font-semibold">
        <span className="relative flex size-2">
          <span className="absolute inset-0 animate-ping rounded-full bg-octa-500 opacity-60 motion-reduce:hidden" />
          <span className="relative size-2 rounded-full bg-octa-600" />
        </span>
        Live
      </p>
      <ol className="flex-1 overflow-y-auto px-2 py-2" aria-live="polite">
        <AnimatePresence initial={false}>
          {events.map((e) => {
            const Icon = EVENT_ICON[e.kind];
            const hot = e.kind === "reply";
            return (
              <motion.li
                key={e.id}
                layout={!reduce}
                initial={reduce ? false : { opacity: 0, y: -12, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                transition={spring}
              >
                <button
                  onClick={() => e.leadId && onPick(e.leadId)}
                  disabled={!e.leadId}
                  className="flex w-full gap-3 rounded-[14px] px-2 py-2.5 text-left enabled:hover:bg-fg/[.04]"
                >
                  <span
                    className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-full ${hot ? "bg-octa-600 text-white" : "bg-fg/[.06] text-fg-2"}`}
                  >
                    <Icon size={14} strokeWidth={1.75} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="text-[14px] font-medium leading-[1.35]">{e.text}</span>
                      <span className="shrink-0 text-[12px] tabular-nums text-fg-3">{ago(e.at, now)}</span>
                    </span>
                    {e.detail && <span className="mt-0.5 block truncate text-[13px] text-fg-2">{e.detail}</span>}
                  </span>
                </button>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ol>
    </aside>
  );
}

// A sweep over the city while the agent looks for businesses.
function RadarSweep({ reduce }: { reduce: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pointer-events-none absolute inset-0 grid place-items-center overflow-hidden"
      aria-hidden
    >
      <div className="relative size-[min(90%,560px)] rounded-full">
        {[0.33, 0.66, 1].map((s) => (
          <span key={s} className="absolute inset-0 m-auto rounded-full border border-octa-600/25" style={{ width: `${s * 100}%`, height: `${s * 100}%` }} />
        ))}
        {!reduce && (
          <motion.span
            className="absolute inset-0 rounded-full"
            style={{
              background:
                "conic-gradient(from 0deg, transparent 0deg 290deg, color-mix(in oklab, var(--color-octa-500) 38%, transparent) 360deg)",
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
          />
        )}
        <span className="absolute inset-0 m-auto size-3 rounded-full bg-octa-600 shadow-glow" />
      </div>
    </motion.div>
  );
}
