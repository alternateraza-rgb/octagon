"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion, useSpring, useTransform } from "motion/react";
import { Check, Globe, Loader2, Lock, MessageCircle, Store, Wallet } from "lucide-react";
import { getTemplate } from "@/components/templates";
import { TemplateFrame } from "@/components/templates/frame";
import { fee, money, sellerShare } from "@/lib/sales/money";
import { STEPS } from "@/lib/onboarding/steps";
import { AssemblingMark } from "./mark";

/* ———————————————— Shared state across chapters ———————————————— */

export const BUSINESSES = [
  { id: "gym", label: "Gym", template: "ironside", name: "Ironside", slug: "ironside", prompt: "A bold site for Ironside, a strength gym in Denver, with a class timetable and a free-week signup" },
  { id: "cafe", label: "Café", template: "common-grounds", name: "Common Grounds", slug: "common-grounds", prompt: "A warm site for Common Grounds, a neighbourhood coffee house in Austin, with the menu and opening hours" },
  { id: "salon", label: "Salon", template: "atelier-noir", name: "Atelier Noir", slug: "atelier-noir", prompt: "A moody, editorial site for Atelier Noir, a hair salon in Chicago, with online booking" },
  { id: "dentist", label: "Dentist", template: "harbor-dental", name: "Harbor Dental", slug: "harbor-dental", prompt: "A calm, trustworthy site for Harbor Dental, a family dentist in Portland, with a free consultation form" },
] as const;
export type Business = (typeof BUSINESSES)[number];

export type TourState = {
  name: string;
  business: Business;
  setBusiness: (b: Business) => void;
  warm: boolean;
  setWarm: (v: boolean) => void;
  booking: boolean;
  setBooking: (v: boolean) => void;
  published: boolean;
  setPublished: (v: boolean) => void;
  setup: number;
  setSetup: (v: number) => void;
  hosting: number;
  setHosting: (v: number) => void;
};

const spring = { type: "spring", stiffness: 140, damping: 20 } as const;
const display = "font-[family-name:var(--font-display)] font-semibold";

/* ———————————————— Layout ———————————————— */

function Chapter({
  kicker,
  title,
  body,
  controls,
  stage,
}: {
  kicker: string;
  title: ReactNode;
  body: ReactNode;
  controls?: ReactNode;
  stage: ReactNode;
}) {
  const reduce = useReducedMotion();
  const rise = (delay: number) =>
    reduce ? {} : { initial: { opacity: 0, y: 18, filter: "blur(6px)" }, animate: { opacity: 1, y: 0, filter: "blur(0px)" }, transition: { ...spring, delay } };
  return (
    <div className="grid h-full items-center gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
      <div className="order-2 lg:order-1">
        <motion.p {...rise(0.05)} className="text-[13px] font-medium tracking-[0.08em] text-octa-400 uppercase">
          {kicker}
        </motion.p>
        <motion.h2
          id="tour-title"
          {...rise(0.12)}
          className={`${display} mt-3 text-balance text-[34px] leading-[1.02] tracking-[-0.04em] sm:text-[48px]`}
        >
          {title}
        </motion.h2>
        <motion.div {...rise(0.2)} className="mt-4 max-w-[480px] text-[16px] leading-[1.5] text-fg-2 sm:text-[17px]">
          {body}
        </motion.div>
        {controls && (
          <motion.div {...rise(0.28)} className="mt-7">
            {controls}
          </motion.div>
        )}
      </div>
      <motion.div
        className="order-1 lg:order-2"
        initial={reduce ? false : { opacity: 0, scale: 0.94, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ ...spring, delay: 0.1 }}
      >
        {stage}
      </motion.div>
    </div>
  );
}

// `group` gives single-choice chips a highlight that slides between them; toggles leave it out.
function Chip({ active, onClick, group, children }: { active: boolean; onClick: () => void; group?: string; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`relative h-11 rounded-full px-4 text-[15px] font-medium transition-colors ${
        active ? "text-canvas" : "bg-fg/[.08] text-fg hover:bg-fg/[.13]"
      }`}
    >
      {active && <motion.span layoutId={group && `tour-chip-${group}`} className="absolute inset-0 rounded-full bg-fg" transition={spring} />}
      <span className="relative">{children}</span>
    </button>
  );
}

function Browser({ url, status, children }: { url: string; status?: ReactNode; children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[18px] bg-elevated shadow-[0_40px_100px_-30px_rgb(0_0_0/0.8)] ring-1 ring-hairline">
      <div className="flex h-10 items-center gap-2 border-b border-hairline px-4">
        <span className="size-2.5 rounded-full bg-fg/15" />
        <span className="size-2.5 rounded-full bg-fg/15" />
        <span className="size-2.5 rounded-full bg-fg/15" />
        <span className="ml-3 flex h-7 min-w-0 flex-1 items-center gap-1.5 rounded-full bg-fg/[.06] px-3 text-[12px] text-fg-2">
          <Lock size={11} strokeWidth={2} className="shrink-0" />
          <span className="truncate">{url}</span>
          {status && <span className="ml-auto shrink-0">{status}</span>}
        </span>
      </div>
      {children}
    </div>
  );
}

function Site({ business, className = "aspect-[16/10]" }: { business: Business; className?: string }) {
  const Template = getTemplate(business.template)?.Component;
  return <TemplateFrame className={`bg-white ${className}`}>{Template && <Template preview />}</TemplateFrame>;
}

function AnimatedMoney({ cents }: { cents: number }) {
  const value = useSpring(cents, { stiffness: 140, damping: 22 });
  const text = useTransform(value, (v) => money(Math.round(v / 100) * 100));
  useEffect(() => value.set(cents), [cents, value]);
  return <motion.span className="tabular-nums">{text}</motion.span>;
}

/* ———————————————— 1 · Welcome ———————————————— */

function Welcome({ name }: TourState) {
  const reduce = useReducedMotion();
  return (
    <Chapter
      kicker="Welcome to Octacore"
      title={
        <>
          {name ? `${name}, let's` : "Let's"} get you to your <span className="text-octa-400">first sale.</span>
        </>
      }
      body="Octacore builds websites for local businesses, hosts them, and lets you sell them. This tour takes about two minutes."
      stage={
        <div className="grid place-items-center py-6">
          <AssemblingMark size={240} />
          <motion.p
            initial={reduce ? false : { opacity: 0, letterSpacing: "0.4em" }}
            animate={{ opacity: 1, letterSpacing: "0.18em" }}
            transition={{ delay: 1.4, duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 text-[13px] font-medium text-fg-2 uppercase"
          >
            Build it · Ship it · Sell it
          </motion.p>
        </div>
      }
    />
  );
}

/* ———————————————— 2 · The idea ———————————————— */

const LOOP = [
  { icon: Store, label: "A local business", note: "No website, or a bad one" },
  { icon: Globe, label: "Its new website", note: "Built by Octacore in a minute" },
  { icon: Wallet, label: "You get paid", note: "Setup fee plus monthly hosting" },
];

function Idea() {
  const reduce = useReducedMotion();
  const [lit, setLit] = useState(0);
  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setLit((i) => (i + 1) % LOOP.length), 1400);
    return () => clearInterval(id);
  }, [reduce]);
  return (
    <Chapter
      kicker="The idea"
      title="Every business needs a website. Sell them one."
      body="Plenty of local businesses still have no website, or one that breaks on a phone. You find them, Octacore builds the site, and they pay you for it."
      stage={
        <div className="relative mx-auto flex max-w-[520px] flex-col gap-4">
          {LOOP.map(({ icon: Icon, label, note }, i) => (
            <motion.div
              key={label}
              initial={reduce ? false : { opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...spring, delay: 0.2 + i * 0.12 }}
              className="relative"
            >
              <div
                className={`flex items-center gap-4 rounded-[18px] p-4 ring-1 transition-colors duration-500 sm:p-5 ${
                  lit === i ? "bg-octa-600/15 ring-octa-600/50" : "bg-fg/[.04] ring-hairline"
                }`}
              >
                <span
                  className={`grid size-12 shrink-0 place-items-center rounded-full transition-colors duration-500 ${
                    lit === i ? "bg-octa-600 text-white" : "bg-fg/[.08] text-fg-2"
                  }`}
                >
                  <Icon size={22} strokeWidth={1.5} />
                </span>
                <span>
                  <span className="block text-[17px] font-medium">{label}</span>
                  <span className="block text-[14px] text-fg-3">{note}</span>
                </span>
                <span className="ml-auto font-mono text-[13px] text-fg-3">0{i + 1}</span>
              </div>
              {i < LOOP.length - 1 && <span className="mx-auto block h-4 w-px bg-gradient-to-b from-octa-600/60 to-transparent" />}
            </motion.div>
          ))}
        </div>
      }
    />
  );
}

/* ———————————————— 3 · Build ———————————————— */

function useTyping(text: string, speed = 22) {
  const reduce = useReducedMotion();
  const [count, setCount] = useState(reduce ? text.length : 0);
  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setCount((c) => (c >= text.length ? c : c + 1)), speed);
    return () => clearInterval(id);
  }, [text, speed, reduce]);
  return { typed: text.slice(0, count), done: count >= text.length };
}

function BuildStage({ business }: { business: Business }) {
  const reduce = useReducedMotion();
  const { typed, done } = useTyping(business.prompt);
  return (
    <div className="space-y-3">
      <div className="ml-auto max-w-[88%] rounded-[20px] rounded-br-[6px] bg-octa-600 px-4 py-3 text-[14px] leading-[1.45] text-white sm:text-[15px]">
        {typed}
        {!done && <span className="ml-0.5 inline-block h-[1em] w-px translate-y-[2px] animate-pulse bg-white" />}
      </div>
      <Browser
        url={`${business.slug}.octacore.app/preview`}
        status={
          done ? (
            <span className="flex items-center gap-1 text-[11px] font-medium text-octa-400">
              <Check size={12} strokeWidth={2.5} /> Built
            </span>
          ) : (
            <Loader2 size={12} className="animate-spin text-fg-3" />
          )
        }
      >
        <div className="relative">
          <motion.div
            initial={reduce ? false : { clipPath: "inset(0 0 100% 0)" }}
            animate={done ? { clipPath: "inset(0 0 0% 0)" } : undefined}
            transition={{ duration: 2.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <Site business={business} />
          </motion.div>
          {!done && (
            <div className="absolute inset-0 grid place-items-center text-[13px] text-fg-3">
              <span className="flex items-center gap-2">
                <Loader2 size={14} className="animate-spin" /> Reading your brief…
              </span>
            </div>
          )}
        </div>
      </Browser>
    </div>
  );
}

function Build({ business, setBusiness }: TourState) {
  return (
    <Chapter
      kicker="Step 1 · Build"
      title="Describe it. Octacore builds it."
      body="Name the business, the city and the vibe. Octacore plans the pages, writes the copy and picks the photos."
      controls={
        <>
          <p className="text-[14px] text-fg-3">Try one</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {BUSINESSES.map((b) => (
              <Chip key={b.id} group="business" active={business.id === b.id} onClick={() => setBusiness(b)}>
                {b.label}
              </Chip>
            ))}
          </div>
        </>
      }
      stage={<BuildStage key={business.id} business={business} />}
    />
  );
}

/* ———————————————— 4 · Edit ———————————————— */

function Edit({ business, warm, setWarm, booking, setBooking }: TourState) {
  const reduce = useReducedMotion();
  const asks = [
    { on: warm, set: setWarm, ask: "Make it warmer", reply: "Warmed up the colours and the photography." },
    { on: booking, set: setBooking, ask: "Add a booking section", reply: "Added a booking section with a simple form." },
  ];
  return (
    <Chapter
      kicker="Step 2 · Edit"
      title="Change anything by asking."
      body="Talk to your site like you'd talk to a designer. Every change is a sentence away, and every version is saved."
      controls={
        <>
          <p className="text-[14px] text-fg-3">Ask for a change</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {asks.map((a) => (
              <Chip key={a.ask} active={a.on} onClick={() => a.set(!a.on)}>
                {a.ask}
              </Chip>
            ))}
          </div>
        </>
      }
      stage={
        <div className="space-y-3">
          <Browser url={`${business.slug}.octacore.app/preview`}>
            <div className="relative overflow-hidden">
              <Site business={business} />
              <motion.div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-gradient-to-br from-octa-500/45 via-octa-400/20 to-octa-800/10"
                animate={{ opacity: warm ? 1 : 0 }}
                transition={{ duration: 0.8 }}
              />
              <AnimatePresence>
                {booking && (
                  <motion.div
                    initial={reduce ? false : { y: "100%" }}
                    animate={{ y: 0 }}
                    exit={reduce ? { opacity: 0 } : { y: "100%" }}
                    transition={spring}
                    className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-ink/90 px-4 py-3 text-white backdrop-blur"
                  >
                    <span className="text-[13px] font-semibold">Book a visit</span>
                    <span className="ml-auto h-7 w-20 rounded-md bg-white/15" />
                    <span className="h-7 w-20 rounded-md bg-white/15" />
                    <span className="h-7 rounded-md bg-octa-600 px-3 text-[12px] leading-7 font-medium">Book</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Browser>
          <div className="min-h-[76px] space-y-2">
            <AnimatePresence initial={false}>
              {asks
                .filter((a) => a.on)
                .map((a) => (
                  <motion.div
                    key={a.ask}
                    layout
                    initial={reduce ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={spring}
                    className="flex items-start gap-2 text-[14px]"
                  >
                    <MessageCircle size={16} strokeWidth={1.75} className="mt-0.5 shrink-0 text-octa-400" />
                    <span>
                      <span className="text-fg">{a.ask}.</span> <span className="text-fg-3">{a.reply}</span>
                    </span>
                  </motion.div>
                ))}
            </AnimatePresence>
          </div>
        </div>
      }
    />
  );
}

/* ———————————————— 5 · Ship ———————————————— */

function Ship({ business, published, setPublished }: TourState) {
  const reduce = useReducedMotion();
  const [publishing, setPublishing] = useState(false);
  const publish = () => {
    if (published || publishing) return;
    setPublishing(true);
    setTimeout(() => {
      setPublishing(false);
      setPublished(true);
    }, reduce ? 0 : 1200);
  };
  return (
    <Chapter
      kicker="Step 3 · Ship"
      title="Publish in one click."
      body="Your site goes live on its own address, with hosting and SSL included. Share the link with the owner straight away."
      controls={
        <button
          type="button"
          onClick={publish}
          disabled={published}
          className="flex h-12 items-center gap-2 rounded-full bg-fg px-6 text-[15px] font-medium text-canvas transition-transform active:scale-[.97] disabled:opacity-60"
        >
          {publishing ? <Loader2 size={16} className="animate-spin" /> : published ? <Check size={16} strokeWidth={2.5} /> : <Globe size={16} />}
          {publishing ? "Publishing…" : published ? "Published" : "Publish"}
        </button>
      }
      stage={
        <div className="space-y-4">
          <Browser url={`${business.slug}.octacore.app`}>
            <div className={`transition-[filter] duration-700 ${published ? "" : "grayscale-[60%]"}`}>
              <Site business={business} />
            </div>
          </Browser>
          <div className="flex items-center gap-3 rounded-full bg-elevated px-5 py-3.5 text-[15px] ring-1 ring-hairline">
            <Lock size={14} className="text-fg-3" />
            <span className="truncate font-medium">{business.slug}.octacore.app</span>
            <span className="ml-auto flex items-center gap-2 text-[13px] font-medium">
              {published ? (
                <motion.span initial={reduce ? false : { scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={spring} className="flex items-center gap-2 text-octa-400">
                  <span className="relative flex size-2.5">
                    {!reduce && <span className="absolute inline-flex size-full animate-ping rounded-full bg-octa-400 opacity-60" />}
                    <span className="relative inline-flex size-2.5 rounded-full bg-octa-400" />
                  </span>
                  Live
                </motion.span>
              ) : (
                <span className="text-fg-3">{publishing ? "Going live…" : "Not live yet"}</span>
              )}
            </span>
          </div>
        </div>
      }
    />
  );
}

/* ———————————————— 6 · Playbook ———————————————— */

const PLAYBOOK = [
  { title: "Pick a niche and a city", body: "Gyms in Denver. Dentists in Austin. Going narrow makes every pitch sharper. Octa Agents will soon find these leads for you." },
  { title: "Build the demo first", body: "Show owners their own website, with their name on it, before you ask for anything. It does the selling for you." },
  { title: "Keep it personal", body: "Walk in, call, or email with the link. Tell them what you noticed about their current site and what the new one fixes." },
  { title: "Follow up", body: "Owners are busy. A friendly nudge a few days later often gets the reply the first message didn't." },
];

function Playbook() {
  const reduce = useReducedMotion();
  return (
    <Chapter
      kicker="Step 4 · Sell"
      title="How to land your first client."
      body="Octacore does the building. Winning the client is about who you pick and how you show up."
      stage={
        <div className="grid gap-3 sm:grid-cols-2">
          {PLAYBOOK.map((p, i) => (
            <motion.div
              key={p.title}
              initial={reduce ? false : { opacity: 0, y: 30, rotateX: -20 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ ...spring, delay: 0.15 + i * 0.1 }}
              className="rounded-[18px] bg-fg/[.05] p-5 ring-1 ring-hairline"
            >
              <span className="font-mono text-[13px] text-octa-400">0{i + 1}</span>
              <p className="mt-2 text-[17px] font-semibold tracking-[-0.01em]">{p.title}</p>
              <p className="mt-1.5 text-[14px] leading-[1.5] text-fg-2">{p.body}</p>
            </motion.div>
          ))}
        </div>
      }
    />
  );
}

/* ———————————————— 7 · Price ———————————————— */

const HOSTING = [4900, 7900, 9900];

function Price({ setup, setSetup, hosting, setHosting }: TourState) {
  return (
    <Chapter
      kicker="Step 5 · Get paid"
      title="Price it. Get paid directly."
      body={
        <>
          Most sellers charge <span className="text-fg">$1,500–$3,000</span> to build a site, plus{" "}
          <span className="text-fg">$49–$99 a month</span> to host it. Clients pay you through a secure checkout link, and
          Octacore keeps 10%.
        </>
      }
      controls={
        <div className="max-w-[420px] space-y-6">
          <label className="block">
            <span className="flex items-baseline justify-between text-[14px] text-fg-3">
              Setup price <span className="text-[17px] font-medium text-fg tabular-nums">{money(setup)}</span>
            </span>
            <input
              type="range"
              min={50000}
              max={500000}
              step={10000}
              value={setup}
              onChange={(e) => setSetup(Number(e.target.value))}
              className="mt-3 w-full accent-octa-600"
            />
          </label>
          <div>
            <p className="text-[14px] text-fg-3">Monthly hosting</p>
            <div className="mt-3 flex gap-2">
              {HOSTING.map((h) => (
                <Chip key={h} group="hosting" active={hosting === h} onClick={() => setHosting(h)}>
                  {money(h)}/mo
                </Chip>
              ))}
            </div>
          </div>
        </div>
      }
      stage={
        <div className="mx-auto max-w-[460px] rounded-[28px] bg-elevated p-6 ring-1 ring-hairline sm:p-8">
          <p className="text-[14px] text-fg-3">One website sale</p>
          <dl className="mt-4 space-y-3 text-[16px]">
            <div className="flex justify-between">
              <dt className="text-fg-2">Client pays</dt>
              <dd><AnimatedMoney cents={setup} /></dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-fg-2">Octacore (10%)</dt>
              <dd className="text-fg-3">
                −<AnimatedMoney cents={fee(setup)} />
              </dd>
            </div>
            <div className="flex justify-between border-t border-hairline pt-3 text-[18px] font-semibold">
              <dt>You keep</dt>
              <dd className="text-octa-400">
                <AnimatedMoney cents={sellerShare(setup)} />
              </dd>
            </div>
          </dl>
          <div className="mt-6 rounded-[18px] bg-octa-600/10 p-4 ring-1 ring-octa-600/25">
            <p className="text-[14px] text-fg-2">With ten clients on hosting</p>
            <p className={`${display} mt-1 text-[32px] tracking-[-0.03em]`}>
              <AnimatedMoney cents={sellerShare(hosting) * 10} />
              <span className="text-[16px] font-normal text-fg-3"> a month, every month</span>
            </p>
          </div>
        </div>
      }
    />
  );
}

/* ———————————————— 8 · Ready ———————————————— */

function Ready() {
  const reduce = useReducedMotion();
  return (
    <Chapter
      kicker="You're ready"
      title="Your first five moves."
      body="Your Getting started checklist lives on the Websites page and ticks itself off as you go. You can replay this tour from your account menu any time."
      stage={
        <ol className="mx-auto max-w-[480px] space-y-2">
          {STEPS.map((s, i) => (
            <motion.li
              key={s.id}
              initial={reduce ? false : { opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...spring, delay: 0.15 + i * 0.08 }}
              className="flex items-center gap-4 rounded-[18px] bg-fg/[.04] p-4 ring-1 ring-hairline"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-octa-600/15 font-mono text-[13px] text-octa-400">{i + 1}</span>
              <span>
                <span className="block text-[16px] font-medium">{s.title}</span>
                <span className="block text-[13px] text-fg-3">{s.why}</span>
              </span>
            </motion.li>
          ))}
        </ol>
      }
    />
  );
}

export const CHAPTERS = [Welcome, Idea, Build, Edit, Ship, Playbook, Price, Ready];
