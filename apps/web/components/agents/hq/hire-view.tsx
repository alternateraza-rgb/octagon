"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowLeft,
  Car,
  ChevronDown,
  Dog,
  Droplets,
  Flower2,
  Hammer,
  HeartPulse,
  Home,
  Paintbrush,
  Scissors,
  Sparkles,
  Utensils,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { AgentBadge } from "./agent-badge";

type Slot = "niche" | "places" | "offer" | "cap" | "sender";

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

const CITIES = [
  "Hamilton, ON",
  "Toronto, ON",
  "Burlington, ON",
  "Mississauga, ON",
  "Ottawa, ON",
  "Calgary, AB",
  "Vancouver, BC",
  "Austin, TX",
  "Dallas, TX",
  "Phoenix, AZ",
  "Denver, CO",
  "Tampa, FL",
  "Charlotte, NC",
  "Columbus, OH",
];

const OFFERS = [
  "a $499 site in 48 hours",
  "a free preview of their new site",
  "a site that books appointments",
  "a site that brings in quote requests",
];

const NAMES = ["Scout", "Nova", "Atlas", "Ranger", "Pilot", "Echo", "Juno", "Rook"];

const spring = { type: "spring" as const, stiffness: 120, damping: 20 };

// Hiring an agent is filling in one sentence. Each underlined part opens its controls in the tray below,
// and the email on the right is what the agent would send with those choices.
export function HireView({ me }: { me: { name: string; email: string } }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [niche, setNiche] = useState("Plumbers");
  const [places, setPlaces] = useState<string[]>(["Hamilton, ON"]);
  const [offer, setOffer] = useState(OFFERS[0]);
  const [cap, setCap] = useState(20);
  const [sender, setSender] = useState(`${me.name.split(" ")[0]} from Octa Studio`);
  const [open, setOpen] = useState<Slot | null>(null);
  const [step, setStep] = useState<"brief" | "details" | "hiring">("brief");
  const [address, setAddress] = useState("");
  const [name, setName] = useState(NAMES[0]);

  const hire = () => {
    setStep("hiring");
    // The prototype has nowhere to save yet: show the badge, then go back to the team.
    setTimeout(() => router.push("/dashboard/agents"), reduce ? 600 : 2600);
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-[1180px] px-5 pb-24 pt-8 sm:pt-12">
        <Link href="/dashboard/agents" className="inline-flex h-11 items-center gap-1.5 text-[15px] text-fg-2 hover:text-fg">
          <ArrowLeft size={16} strokeWidth={1.5} /> Agents
        </Link>

        <div className="mt-6 grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-14">
          <div>
            <p className="text-[13px] font-medium uppercase tracking-[0.08em] text-octa-600">
              {step === "details" ? "Step 2 of 2" : "Hire an agent"}
            </p>

            <AnimatePresence mode="wait" initial={false}>
              {step !== "details" ? (
                <motion.div
                  key="brief"
                  initial={reduce ? false : { opacity: 0, x: -24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={reduce ? undefined : { opacity: 0, x: -24 }}
                  transition={spring}
                >
                  <p className="mt-4 font-[family-name:var(--font-display)] text-[32px] font-semibold leading-[1.28] tracking-[-0.035em] sm:text-[44px] sm:leading-[1.24]">
                    Find <Blank slot="niche" open={open} onOpen={setOpen} text={niche.toLowerCase()} /> in{" "}
                    <Blank
                      slot="places"
                      open={open}
                      onOpen={setOpen}
                      text={places.length ? listOf(places.map((p) => p.split(",")[0])) : "a city"}
                    />{" "}
                    <span className="text-fg-3">with no website,</span> and offer them{" "}
                    <Blank slot="offer" open={open} onOpen={setOpen} text={offer} tail="." /> Send up to{" "}
                    <Blank slot="cap" open={open} onOpen={setOpen} text={`${cap} emails`} /> a day, signed{" "}
                    <Blank slot="sender" open={open} onOpen={setOpen} text={sender || "your name"} tail="." />
                  </p>

                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div
                        key="tray"
                        initial={reduce ? false : { opacity: 0, y: -8, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={reduce ? undefined : { opacity: 0, y: -8, height: 0 }}
                        transition={spring}
                        className="overflow-hidden"
                      >
                        <div className="mb-3 mt-8 rounded-[24px] bg-elevated p-5 shadow-soft ring-1 ring-hairline">
                          <div className="mb-4 flex items-center justify-between">
                            <p className="text-[13px] font-medium text-fg-3">{TRAY_TITLES[open]}</p>
                            <button
                              onClick={() => setOpen(null)}
                              aria-label="Done"
                              className="grid size-9 place-items-center rounded-full text-fg-2 hover:bg-fg/5 hover:text-fg"
                            >
                              <X size={16} strokeWidth={1.5} />
                            </button>
                          </div>
                          <AnimatePresence mode="wait" initial={false}>
                            <motion.div
                              key={open}
                              initial={reduce ? false : { opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={reduce ? undefined : { opacity: 0, y: -6 }}
                              transition={{ duration: 0.15 }}
                            >
                              {open === "niche" && <NichePicker value={niche} onChange={(v) => { setNiche(v); setOpen("places"); }} />}
                              {open === "places" && <PlacePicker value={places} onChange={setPlaces} />}
                              {open === "offer" && <OfferPicker value={offer} onChange={setOffer} />}
                              {open === "cap" && <CapPicker value={cap} onChange={setCap} />}
                              {open === "sender" && (
                                <input
                                  autoFocus
                                  value={sender}
                                  onChange={(e) => setSender(e.target.value.slice(0, 60))}
                                  onKeyDown={(e) => e.key === "Enter" && setOpen(null)}
                                  placeholder="Raza from Octa Studio"
                                  className="h-12 w-full rounded-[12px] bg-canvas px-4 text-[17px] ring-1 ring-hairline outline-none focus:ring-4 focus:ring-octa-600/15"
                                />
                              )}
                            </motion.div>
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="mt-10 flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => {
                        setOpen(null);
                        setStep("details");
                      }}
                      disabled={!places.length || !sender.trim()}
                      className="flex h-12 items-center rounded-full bg-octa-600 px-6 text-[17px] font-medium text-white hover:bg-octa-500 active:bg-octa-700 disabled:opacity-40"
                    >
                      Continue
                    </button>
                    <p className="text-[14px] text-fg-3">Tap any underlined part to change it.</p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="details"
                  initial={reduce ? false : { opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={reduce ? undefined : { opacity: 0, x: 24 }}
                  transition={spring}
                  className="max-w-[560px]"
                >
                  <h1 className="mt-4 font-[family-name:var(--font-display)] text-[32px] font-semibold leading-[1.1] tracking-[-0.035em] sm:text-[44px]">
                    Before it writes to anyone
                  </h1>
                  <p className="mt-3 text-[17px] leading-[1.47] text-fg-2">
                    The law in the US and Canada asks every business email to say who sent it and where they can be reached.
                  </p>

                  <div className="mt-8 space-y-5">
                    <Field label="Your agent's name" hint="Only you see this.">
                      <div className="flex flex-wrap gap-2">
                        {NAMES.slice(0, 6).map((n) => (
                          <button
                            key={n}
                            onClick={() => setName(n)}
                            className={`h-11 rounded-full px-4 text-[15px] font-medium transition-colors ${
                              name === n ? "bg-fg text-canvas" : "bg-fg/[.06] hover:bg-fg/10"
                            }`}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    </Field>
                    <Field label="Mailing address" hint="Goes in the footer of every email, as the law requires.">
                      <input
                        value={address}
                        onChange={(e) => setAddress(e.target.value.slice(0, 160))}
                        placeholder="123 King St W, Hamilton, ON L8P 1A1"
                        className="h-12 w-full rounded-[12px] bg-elevated px-4 text-[17px] ring-1 ring-hairline outline-none focus:ring-4 focus:ring-octa-600/15"
                      />
                    </Field>
                    <Field label="Replies go to" hint="We also keep every reply in your Agents inbox.">
                      <p className="flex h-12 items-center rounded-[12px] bg-fg/[.04] px-4 text-[17px] text-fg-2">{me.email}</p>
                    </Field>
                  </div>

                  <ul className="mt-8 space-y-2 text-[14px] text-fg-2">
                    <li>· Only writes to emails a business publishes itself, and keeps where it found them.</li>
                    <li>· Every email has a one-click unsubscribe, and nobody is written to twice after saying no.</li>
                    <li>· Sends on weekdays during business hours, and pauses itself if emails start bouncing.</li>
                  </ul>

                  <div className="mt-10 flex flex-wrap items-center gap-3">
                    <button
                      onClick={hire}
                      disabled={address.trim().length < 8}
                      className="flex h-12 items-center rounded-full bg-octa-600 px-6 text-[17px] font-medium text-white shadow-glow hover:bg-octa-500 active:bg-octa-700 disabled:opacity-40 disabled:shadow-none"
                    >
                      Hire {name}
                    </button>
                    <button onClick={() => setStep("brief")} className="h-12 rounded-full px-4 text-[15px] text-fg-2 hover:text-fg">
                      Back
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="lg:sticky lg:top-8">
            <EmailPreview niche={niche} place={places[0]?.split(",")[0] ?? "your city"} offer={offer} sender={sender} address={address} />
          </div>
        </div>
      </div>

      <AnimatePresence>{step === "hiring" && <Hired name={name} niche={niche} places={places} />}</AnimatePresence>
    </div>
  );
}

const TRAY_TITLES: Record<Slot, string> = {
  niche: "What kind of business?",
  places: "Where should it look?",
  offer: "What are you offering?",
  cap: "How many emails a day?",
  sender: "Who should the emails be from?",
};

function listOf(items: string[]) {
  if (items.length <= 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;
}

// One fill-in-the-blank part of the sentence. The last word, the chevron and any punctuation that follows
// stay on one line, so a wrap never strands them.
function Blank({
  slot,
  open,
  onOpen,
  text,
  tail = "",
}: {
  slot: Slot;
  open: Slot | null;
  onOpen: (s: Slot | null) => void;
  text: string;
  tail?: string;
}) {
  const active = open === slot;
  const cut = text.lastIndexOf(" ");
  return (
    <button
      type="button"
      onClick={() => onOpen(active ? null : slot)}
      aria-expanded={active}
      className={`inline rounded-[12px] px-1 text-left underline decoration-2 underline-offset-[0.18em] transition-colors [box-decoration-break:clone] ${
        active
          ? "bg-octa-600/10 text-octa-700 decoration-octa-600 dark:text-octa-400"
          : "decoration-fg/20 hover:bg-fg/[.05] hover:decoration-octa-600"
      }`}
    >
      {cut > 0 && text.slice(0, cut + 1)}
      <span className="whitespace-nowrap">
        {text.slice(cut + 1)}
        <ChevronDown
          strokeWidth={2}
          className={`ml-0.5 inline size-[0.5em] align-middle text-fg-3 transition-transform duration-300 ${active ? "rotate-180 text-octa-600" : ""}`}
        />
        {/* An inline-block keeps the underline off the punctuation. */}
        {tail && <span className="inline-block text-fg">{tail}</span>}
      </span>
    </button>
  );
}

function NichePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [custom, setCustom] = useState(NICHES.some((n) => n.label === value) ? "" : value);
  return (
    <div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {NICHES.map(({ label, icon: Icon }) => (
          <button
            key={label}
            onClick={() => onChange(label)}
            className={`flex h-12 items-center gap-2.5 rounded-[14px] px-3.5 text-left text-[15px] font-medium transition-colors ${
              value === label ? "bg-octa-600 text-white" : "bg-canvas ring-1 ring-hairline hover:bg-fg/[.04]"
            }`}
          >
            <Icon size={17} strokeWidth={1.5} className={value === label ? "" : "text-fg-2"} />
            {label}
          </button>
        ))}
      </div>
      <input
        value={custom}
        onChange={(e) => setCustom(e.target.value.slice(0, 40))}
        onKeyDown={(e) => e.key === "Enter" && custom.trim().length > 1 && onChange(custom.trim())}
        placeholder="Something else? Type it and press Enter"
        className="mt-3 h-12 w-full rounded-[12px] bg-canvas px-4 text-[15px] ring-1 ring-hairline outline-none focus:ring-4 focus:ring-octa-600/15"
      />
    </div>
  );
}

function PlacePicker({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [q, setQ] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const matches = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return CITIES.filter((c) => !value.includes(c) && (!needle || c.toLowerCase().includes(needle))).slice(0, 6);
  }, [q, value]);
  const add = (city: string) => {
    if (value.length >= 5 || value.includes(city)) return;
    onChange([...value, city]);
    setQ("");
    input.current?.focus();
  };
  return (
    <div>
      <div className="flex min-h-12 flex-wrap items-center gap-2 rounded-[12px] bg-canvas p-2 ring-1 ring-hairline focus-within:ring-4 focus-within:ring-octa-600/15">
        <AnimatePresence initial={false}>
          {value.map((city) => (
            <motion.span
              key={city}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex h-8 items-center gap-1 rounded-full bg-fg py-0 pl-3 pr-1 text-[14px] font-medium text-canvas"
            >
              {city}
              <button onClick={() => onChange(value.filter((c) => c !== city))} aria-label={`Remove ${city}`} className="grid size-6 place-items-center rounded-full hover:bg-canvas/20">
                <X size={13} strokeWidth={2} />
              </button>
            </motion.span>
          ))}
        </AnimatePresence>
        <input
          ref={input}
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value.slice(0, 60))}
          onKeyDown={(e) => {
            if (e.key === "Enter" && q.trim().length > 2) add(matches[0] ?? q.trim());
            if (e.key === "Backspace" && !q && value.length) onChange(value.slice(0, -1));
          }}
          placeholder={value.length ? "Add another city" : "Type a city in the US or Canada"}
          className="h-8 min-w-[160px] flex-1 bg-transparent px-2 text-[15px] outline-none"
        />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {matches.map((city) => (
          <button key={city} onClick={() => add(city)} className="h-9 rounded-full bg-fg/[.05] px-3.5 text-[14px] text-fg-2 hover:bg-fg/10 hover:text-fg">
            + {city}
          </button>
        ))}
      </div>
      <p className="mt-3 text-[13px] text-fg-3">Up to five. The agent works through them one a day.</p>
    </div>
  );
}

function OfferPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {OFFERS.map((o) => (
          <button
            key={o}
            onClick={() => onChange(o)}
            className={`h-11 rounded-full px-4 text-[15px] transition-colors ${value === o ? "bg-fg text-canvas" : "bg-fg/[.05] hover:bg-fg/10"}`}
          >
            {o}
          </button>
        ))}
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, 80))}
        className="mt-3 h-12 w-full rounded-[12px] bg-canvas px-4 text-[15px] ring-1 ring-hairline outline-none focus:ring-4 focus:ring-octa-600/15"
      />
    </div>
  );
}

function CapPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const tone = value <= 20 ? "Gentle: best for a new domain." : value <= 35 ? "Steady." : "Brisk: watch your replies and bounces.";
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <p className="text-[40px] font-semibold tabular-nums tracking-[-0.03em]">{value}</p>
        <p className="text-[14px] text-fg-2">{tone}</p>
      </div>
      <input
        type="range"
        min={5}
        max={50}
        step={5}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label="Emails a day"
        className="mt-2 h-11 w-full accent-octa-600"
      />
      <p className="text-[13px] text-fg-3">Follow-ups count toward the limit. New agents start at half speed for their first week.</p>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[15px] font-medium">{label}</span>
      <span className="mb-2 block text-[13px] text-fg-3">{hint}</span>
      {children}
    </label>
  );
}

const sharedPrefix = (a: string, b: string) => {
  let n = 0;
  while (n < a.length && n < b.length && a[n] === b[n]) n++;
  return n;
};

// Reveals new text a few characters at a time, like someone typing it, keeping what the old and new
// text share. Instant with reduced motion.
function useTyped(text: string) {
  const reduce = useReducedMotion();
  const [typed, setTyped] = useState({ text, n: text.length });
  const from = useRef(text);
  useEffect(() => {
    if (reduce) return;
    let n = sharedPrefix(from.current, text);
    from.current = text;
    const id = setInterval(() => {
      n = Math.min(text.length, n + 4);
      setTyped({ text, n });
      if (n >= text.length) clearInterval(id);
    }, 16);
    return () => clearInterval(id);
  }, [text, reduce]);
  if (reduce) return text;
  return typed.text === text ? text.slice(0, typed.n) : text.slice(0, sharedPrefix(typed.text, text));
}

function EmailPreview({ niche, place, offer, sender, address }: { niche: string; place: string; offer: string; sender: string; address: string }) {
  const trade = niche.toLowerCase().replace(/s$/, "");
  const business = `Joe's ${niche.replace(/s$/, "")} Co.`;
  const first = sender.split(" ")[0] || "Raza";
  const body = `Hi Joe,\n\nI came across ${business} on Facebook: 4.9 stars from 112 reviews is a great reputation. When people search “${trade} ${place}”, though, there's no site to land on, so those calls go to someone else.\n\nI'd like to offer you ${offer}. I'll show you a preview before you pay anything.\n\nWant me to put one together?\n\n${first}`;
  const typed = useTyped(body);
  return (
    <figure className="overflow-hidden rounded-[28px] bg-elevated shadow-float ring-1 ring-hairline">
      <figcaption className="flex items-center justify-between border-b border-hairline px-5 py-3">
        <span className="flex items-center gap-2 text-[13px] font-medium text-fg-2">
          <Sparkles size={14} strokeWidth={1.5} className="text-octa-600" /> What your agent would send
        </span>
        <span className="flex gap-1.5" aria-hidden>
          <span className="size-2.5 rounded-full bg-fg/10" />
          <span className="size-2.5 rounded-full bg-fg/10" />
          <span className="size-2.5 rounded-full bg-fg/10" />
        </span>
      </figcaption>
      <dl className="space-y-1.5 border-b border-hairline px-5 py-4 text-[14px]">
        <div className="flex gap-3">
          <dt className="w-14 shrink-0 text-fg-3">From</dt>
          <dd className="truncate">{sender || "You"} via Octacore</dd>
        </div>
        <div className="flex gap-3">
          <dt className="w-14 shrink-0 text-fg-3">To</dt>
          <dd className="truncate">joe@{business.toLowerCase().replace(/[^a-z]/g, "").slice(0, 14)}.ca</dd>
        </div>
        <div className="flex gap-3">
          <dt className="w-14 shrink-0 text-fg-3">Subject</dt>
          <dd className="truncate font-medium">A website for {business}?</dd>
        </div>
      </dl>
      <div className="min-h-[300px] whitespace-pre-line px-5 py-5 text-[15px] leading-[1.55]">
        {typed}
        <span className="ml-0.5 inline-block h-[1.1em] w-[2px] translate-y-[3px] animate-pulse bg-octa-600 motion-reduce:hidden" aria-hidden />
      </div>
      <p className="border-t border-hairline px-5 py-3 text-[12px] leading-[1.5] text-fg-3">
        {address || "Your mailing address"} · <span className="underline">Unsubscribe</span>
        <br />
        Each email is written for that business from what the agent finds. This is an example.
      </p>
    </figure>
  );
}

// The moment of hiring: the octagon draws itself, the name lands, and the agent heads out.
function Hired({ name, niche, places }: { name: string; niche: string; places: string[] }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 grid place-items-center bg-canvas/90 px-6 text-center backdrop-blur-2xl"
      role="status"
    >
      <div>
        <motion.div
          initial={reduce ? false : { scale: 0.4, rotate: -45, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 140, damping: 14 }}
          className="mx-auto w-fit"
        >
          <AgentBadge name={name} status="active" size={128} />
        </motion.div>
        <motion.p
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.35 }}
          className="mt-8 font-[family-name:var(--font-display)] text-[40px] font-semibold tracking-[-0.04em] sm:text-[56px]"
        >
          {name} is on it
        </motion.p>
        <motion.p
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.55 }}
          className="mt-2 text-[17px] text-fg-2"
        >
          Heading to {listOf(places.map((p) => p.split(",")[0]))} to look for {niche.toLowerCase()}.
        </motion.p>
      </div>
    </motion.div>
  );
}
