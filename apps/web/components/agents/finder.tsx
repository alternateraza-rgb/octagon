"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import {
  ArrowRight,
  Car,
  Dog,
  Droplets,
  Flower2,
  Hammer,
  HeartPulse,
  History,
  Home,
  MapPin,
  Paintbrush,
  RotateCcw,
  Scissors,
  Search,
  Sparkles,
  Utensils,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { noticeUpgrade } from "@/lib/billing/client";
import type { Card, Hand } from "@/lib/agents/deck";
import type { Lead } from "@/lib/agents/store";
import { useToast } from "@/components/ui/toast";
import { BusinessCard, type Decision } from "./business-card";
import { Radar } from "./parts";

export type RecentSearch = { id: string; niche: string; location: string; country: "US" | "CA"; added: number };

const NICHES: { label: string; icon: LucideIcon }[] = [
  { label: "Plumbers", icon: Droplets },
  { label: "Electricians", icon: Zap },
  { label: "Roofers", icon: Home },
  { label: "Landscapers", icon: Flower2 },
  { label: "Contractors", icon: Hammer },
  { label: "Painters", icon: Paintbrush },
  { label: "Auto repair", icon: Car },
  { label: "Hair salons", icon: Scissors },
  { label: "Cleaners", icon: Sparkles },
  { label: "Restaurants", icon: Utensils },
  { label: "Dentists", icon: HeartPulse },
  { label: "Pet groomers", icon: Dog },
];

const STEPS = [
  "Searching Google Maps…",
  "Skipping businesses that already have a website…",
  "Reading their reviews…",
  "Ranking who's most likely to want a site…",
];

type Session = Hand & { searchId: string; niche: string; location: string; country: "US" | "CA" };

export function Finder({
  recent,
  onAdded,
  onSearched,
}: {
  recent: RecentSearch[];
  onAdded: (lead: Lead, from: HTMLElement | null, card: Card) => void;
  onSearched: (search: RecentSearch) => void;
}) {
  const reduce = useReducedMotion();
  const toast = useToast();
  const [niche, setNiche] = useState("");
  const [location, setLocation] = useState("");
  const [country, setCountry] = useState<"US" | "CA">("US");
  const [phase, setPhase] = useState<"idle" | "searching" | "deck">("idle");
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [leaving, setLeaving] = useState<Record<string, Decision>>({});
  const [dealing, setDealing] = useState(false);
  const [step, setStep] = useState(0);
  const nicheRef = useRef<HTMLInputElement>(null);
  const dealingRef = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);
  // The deck as of the latest decision, so quick decisions in a row don't overwrite each other.
  const sessionRef = useRef<Session | null>(null);
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    if (phase !== "searching") return;
    const t = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 1400);
    return () => clearInterval(t);
  }, [phase]);

  async function run(search: { niche: string; location: string; country: "US" | "CA" }) {
    if (search.niche.trim().length < 2) return setError("What kind of business are you looking for?");
    if (search.location.trim().length < 2) return setError("Which city should Octa search?");
    setError("");
    setStep(0);
    setPhase("searching");
    rootRef.current?.closest(".overflow-y-auto")?.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    const started = Date.now();
    const res = await fetch("/api/agents/search", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(search),
    }).catch(() => null);
    const body = (await res?.json().catch(() => null)) as (Session & { error?: string }) | null;
    // Let the radar make at least one full sweep, so a cached search doesn't flash.
    await new Promise((r) => setTimeout(r, Math.max(0, 1200 - (Date.now() - started))));
    if (!res?.ok || !body?.searchId) {
      setPhase("idle");
      if (!noticeUpgrade(res?.status, body)) setError(body?.error ?? "Couldn't search right now. Try again.");
      return;
    }
    setSession(body);
    setPhase("deck");
    onSearched({ id: body.searchId, niche: body.niche, location: body.location, country: body.country, added: 0 });
  }

  async function deal(s: Session) {
    if (dealingRef.current) return;
    dealingRef.current = true;
    setDealing(true);
    const res = await fetch(`/api/agents/search/${s.searchId}/next`, { method: "POST" }).catch(() => null);
    const body = (await res?.json().catch(() => null)) as (Hand & { error?: string }) | null;
    dealingRef.current = false;
    setDealing(false);
    if (!res?.ok || !body) {
      toast.error(body?.error ?? "Couldn't load more businesses");
      return;
    }
    setSession({ ...s, ...body });
  }

  async function decide(card: Card, decision: Decision, el: HTMLElement | null) {
    if (!session || busy[card.placeId]) return;
    setBusy((b) => ({ ...b, [card.placeId]: true }));
    const res = await fetch("/api/agents/leads", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ searchId: session.searchId, placeId: card.placeId, decision }),
    }).catch(() => null);
    const body = (await res?.json().catch(() => null)) as { lead?: Lead | null; error?: string } | null;
    if (!res?.ok) {
      setBusy((b) => ({ ...b, [card.placeId]: false }));
      if (!noticeUpgrade(res?.status, body)) toast.error(body?.error ?? "Couldn't save that. Try again.");
      // A business that now has a website can't be added; it leaves the deck either way.
      if (res?.status !== 409) return;
    }
    if (decision === "add" && body?.lead) onAdded(body.lead, el, card);
    setLeaving((l) => ({ ...l, [card.placeId]: decision }));
    // One frame later, so the card has its exit direction before it leaves.
    requestAnimationFrame(() => {
      const s = sessionRef.current;
      if (!s) return;
      const next = { ...s, cards: s.cards.filter((c) => c.placeId !== card.placeId) };
      sessionRef.current = next;
      setSession(next);
      // The last card of a hand: deal the next three.
      if (!next.cards.length && (next.left > 0 || next.more)) void deal(next);
    });
  }

  function skipHand() {
    if (!session) return;
    for (const c of session.cards) void decide(c, "skip", null);
  }

  function reset() {
    setPhase("idle");
    setSession(null);
    setTimeout(() => nicheRef.current?.focus(), 50);
  }

  const done = session && !session.cards.length && !session.left && !session.more && !dealing;
  const from = session ? Math.max(1, session.shown - session.cards.length + 1) : 0;

  return (
    <div ref={rootRef}>
      <AnimatePresence mode="wait" initial={false}>
        {phase === "idle" && (
          <motion.div
            key="idle"
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
            transition={{ type: "spring", stiffness: 160, damping: 22 }}
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void run({ niche, location, country });
              }}
              className="rounded-[28px] bg-elevated p-2 shadow-soft ring-1 ring-hairline dark:shadow-none"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <label className="flex min-h-14 flex-1 items-center gap-3 rounded-[22px] px-4 focus-within:bg-fg/[.03]">
                  <Search size={18} strokeWidth={1.5} className="shrink-0 text-fg-3" />
                  <span className="sr-only">Kind of business</span>
                  <input
                    ref={nicheRef}
                    value={niche}
                    onChange={(e) => setNiche(e.target.value)}
                    placeholder="Plumbers, salons…"
                    maxLength={60}
                    autoFocus
                    className="h-12 w-full bg-transparent text-[17px] outline-none placeholder:text-fg-3"
                  />
                </label>
                <span className="hidden h-8 w-px bg-hairline sm:block" />
                <label className="flex min-h-14 flex-1 items-center gap-3 rounded-[22px] px-4 focus-within:bg-fg/[.03]">
                  <MapPin size={18} strokeWidth={1.5} className="shrink-0 text-fg-3" />
                  <span className="sr-only">City</span>
                  <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="City, e.g. Austin TX"
                    maxLength={80}
                    className="h-12 w-full bg-transparent text-[17px] outline-none placeholder:text-fg-3"
                  />
                </label>
                <div className="flex items-center gap-2 px-2 pb-2 sm:pb-0">
                  <div role="radiogroup" aria-label="Country" className="relative flex h-11 rounded-full bg-fg/[.05] p-1">
                    {(["US", "CA"] as const).map((c) => (
                      <button
                        key={c}
                        type="button"
                        role="radio"
                        aria-checked={country === c}
                        onClick={() => setCountry(c)}
                        className="relative z-10 w-11 rounded-full text-[13px] font-semibold"
                      >
                        {country === c && (
                          <motion.span
                            layoutId="finder-country"
                            className="absolute inset-0 -z-10 rounded-full bg-elevated shadow-soft ring-1 ring-hairline"
                            transition={{ type: "spring", stiffness: 500, damping: 38 }}
                          />
                        )}
                        {c}
                      </button>
                    ))}
                  </div>
                  <button
                    type="submit"
                    className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-octa-600 px-6 text-[15px] font-medium text-white transition-colors hover:bg-octa-500 sm:flex-none"
                  >
                    Find businesses <ArrowRight size={16} strokeWidth={2} />
                  </button>
                </div>
              </div>
            </form>
            {error && (
              <p role="alert" className="mt-3 px-2 text-[14px] text-red-600 dark:text-red-400">
                {error}
              </p>
            )}

            <div className="mt-6 flex flex-wrap gap-2">
              {NICHES.map(({ label, icon: Icon }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    setNiche(label);
                    if (location.trim().length >= 2) void run({ niche: label, location, country });
                  }}
                  className={`flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[14px] transition-colors ${
                    niche === label ? "bg-fg text-canvas" : "bg-fg/[.05] text-fg-2 hover:bg-fg/[.09] hover:text-fg"
                  }`}
                >
                  <Icon size={14} strokeWidth={1.5} /> {label}
                </button>
              ))}
            </div>

            {recent.length > 0 && (
              <section className="mt-10">
                <h2 className="flex items-center gap-2 text-[13px] font-medium text-fg-3">
                  <History size={14} strokeWidth={1.5} /> Recent searches
                </h2>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {recent.slice(0, 6).map((s) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setNiche(s.niche);
                          setLocation(s.location);
                          setCountry(s.country);
                          void run(s);
                        }}
                        className="flex h-10 items-center gap-2 rounded-full bg-elevated px-4 text-[14px] ring-1 ring-hairline transition-colors hover:bg-fg/[.04]"
                      >
                        <span className="font-medium">{s.niche}</span>
                        <span className="text-fg-3">in {s.location}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <HowItWorks />
          </motion.div>
        )}

        {phase === "searching" && (
          <motion.div
            key="searching"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            className="flex flex-col items-center py-14 text-center"
            aria-live="polite"
          >
            <Radar className="w-[min(70vw,280px)]" />
            <AnimatePresence mode="wait">
              <motion.p
                key={step}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="mt-8 text-[17px] text-fg-2"
              >
                {STEPS[step]}
              </motion.p>
            </AnimatePresence>
            <p className="mt-1 text-[14px] text-fg-3">
              {niche} in {location}
            </p>
          </motion.div>
        )}

        {phase === "deck" && session && (
          <motion.div key="deck" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="@container">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[13px] font-medium text-fg-3">
                  {session.niche} in {session.location}
                </p>
                <p className="mt-0.5 text-[21px] font-semibold tracking-[-0.015em]">
                  {session.qualified
                    ? `${session.qualified} good fit${session.qualified === 1 ? "" : "s"} so far`
                    : "No good fits yet"}
                  {session.cards.length > 0 && (
                    <span className="ml-2 text-[15px] font-normal text-fg-3 tabular-nums">
                      showing {from}–{from + session.cards.length - 1}
                    </span>
                  )}
                </p>
              </div>
              <div className="flex gap-2">
                {session.cards.length > 1 && (
                  <button
                    type="button"
                    onClick={skipHand}
                    className="flex h-10 items-center gap-1.5 rounded-full px-4 text-[14px] font-medium text-fg-2 hover:bg-fg/[.06] hover:text-fg"
                  >
                    Skip all {session.cards.length}
                  </button>
                )}
                <button
                  type="button"
                  onClick={reset}
                  className="flex h-10 items-center gap-1.5 rounded-full bg-fg/[.06] px-4 text-[14px] font-medium hover:bg-fg/[.1]"
                >
                  <Search size={14} strokeWidth={1.75} /> New search
                </button>
              </div>
            </div>

            <LayoutGroup>
              <div className={`grid items-start gap-4 @xl:grid-cols-2 @4xl:grid-cols-3 ${done ? "" : "min-h-[420px]"}`}>
                <AnimatePresence mode="popLayout">
                  {session.cards.map((card, i) => (
                    <BusinessCard
                      key={card.placeId}
                      card={card}
                      index={i}
                      busy={!!busy[card.placeId]}
                      leaving={leaving[card.placeId]}
                      onDecide={(d, el) => decide(card, d, el)}
                    />
                  ))}
                </AnimatePresence>
                {dealing &&
                  Array.from({ length: 3 }, (_, i) => (
                    <div key={i} className="shimmer h-[420px] rounded-[28px]" style={{ opacity: 1 - i * 0.2 }} aria-hidden />
                  ))}
              </div>
            </LayoutGroup>

            {!session.cards.length && !dealing && !done && (
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => deal(session)}
                  className="flex h-11 items-center gap-2 rounded-full bg-fg/[.06] px-5 text-[15px] font-medium hover:bg-fg/[.1]"
                >
                  <RotateCcw size={16} strokeWidth={1.75} /> Show more businesses
                </button>
              </div>
            )}

            {session.cards.length > 0 && (
              <p className="mt-5 text-center text-[13px] text-fg-3">Tip: drag a card right to add it, or left to skip.</p>
            )}

            {done && (
              <motion.div
                initial={reduce ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center rounded-[28px] bg-elevated px-6 py-14 text-center ring-1 ring-hairline"
              >
                <span className="grid size-14 place-items-center rounded-full bg-octa-600/10 text-octa-600">
                  <Sparkles size={24} strokeWidth={1.5} />
                </span>
                <h3 className="mt-5 text-[24px] font-semibold tracking-[-0.02em]">
                  {session.qualified ? "That's everyone for this search" : "Every business here already has a website"}
                </h3>
                <p className="mt-2 max-w-[440px] text-[15px] text-fg-2">
                  Try a nearby city or a different kind of business. Each search finds new ones.
                </p>
                <button
                  type="button"
                  onClick={reset}
                  className="mt-6 flex h-11 items-center gap-2 rounded-full bg-octa-600 px-6 text-[15px] font-medium text-white hover:bg-octa-500"
                >
                  <RotateCcw size={16} strokeWidth={1.75} /> Search another city
                </button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function HowItWorks() {
  const steps = [
    { n: "1", title: "Search", body: "Pick a kind of business and a city. Octa checks Google Maps for ones with good reviews and no website." },
    { n: "2", title: "Pick", body: "Three at a time. Add the ones worth pitching; Octa finds their email and phone number." },
    { n: "3", title: "Build & pitch", body: "Build them a website from their real reviews in one click, then reach out." },
  ];
  return (
    <ol className="mt-14 grid gap-3 sm:grid-cols-3">
      {steps.map((s) => (
        <li key={s.n} className="rounded-[22px] bg-fg/[.03] p-5">
          <span className="grid size-8 place-items-center rounded-full bg-elevated text-[14px] font-semibold ring-1 ring-hairline">
            {s.n}
          </span>
          <h3 className="mt-4 text-[17px] font-semibold">{s.title}</h3>
          <p className="mt-1 text-[14px] leading-[1.5] text-fg-2">{s.body}</p>
        </li>
      ))}
    </ol>
  );
}
