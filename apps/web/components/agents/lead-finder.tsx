"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Bookmark, BookmarkCheck, Briefcase, ChevronRight, MapPin, Phone, Search, Star, X } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { noticeUpgrade } from "@/lib/billing/client";
import type { Lead, LeadStatus } from "@/lib/agents/store";
import { LeadSheet } from "./lead-sheet";
import { ScoreBadge } from "./score-badge";

type Filter = "active" | "saved" | "built" | "dismissed";
const FILTERS: { id: Filter; label: string }[] = [
  { id: "active", label: "All" },
  { id: "saved", label: "Saved" },
  { id: "built", label: "Built" },
  { id: "dismissed", label: "Dismissed" },
];

// Local trades and services that often have a Google listing but no website.
const NICHES = [
  "Plumbers",
  "Roofers",
  "Landscapers",
  "House cleaners",
  "Barbers",
  "Nail salons",
  "Auto repair",
  "Contractors",
  "Movers",
  "Dog groomers",
  "Painters",
  "Food trucks",
];

type Result = { found: number; qualified: number; added: number; alreadyHad: number; overLimit: number; query: string };

export function LeadFinder({ initialLeads, usage: initialUsage }: { initialLeads: Lead[]; usage: { used: number; limit: number } | null }) {
  const toast = useToast();
  const reduce = useReducedMotion();
  const [leads, setLeads] = useState(initialLeads);
  const [usage, setUsage] = useState(initialUsage);
  const [niche, setNiche] = useState("");
  const [location, setLocation] = useState("");
  const [country, setCountry] = useState<"US" | "CA">("US");
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [filter, setFilter] = useState<Filter>("active");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return leads
      .filter((l) => (filter === "active" ? l.status !== "dismissed" : l.status === filter))
      .filter((l) => !q || `${l.name} ${l.category ?? ""} ${l.address ?? ""}`.toLowerCase().includes(q))
      .sort((a, b) => b.score - a.score || b.createdAt - a.createdAt);
  }, [leads, filter, query]);
  const open = leads.find((l) => l.id === openId) ?? null;

  const upsert = (next: Lead[]) =>
    setLeads((all) => {
      const byId = new Map(all.map((l) => [l.id, l]));
      for (const l of next) byId.set(l.id, l);
      return [...byId.values()];
    });

  async function search(e?: React.FormEvent) {
    e?.preventDefault();
    if (searching) return;
    if (niche.trim().length < 2) return setError("What kind of business are you looking for?");
    if (location.trim().length < 2) return setError("Which city or area should we search?");
    setSearching(true);
    setError("");
    const res = await fetch("/api/agents/search", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ niche, location, country }),
    }).catch(() => null);
    const body = (await res?.json().catch(() => null)) as (Omit<Result, "query"> & { leads?: Lead[]; error?: string }) | null;
    setSearching(false);
    if (!res?.ok || !body?.leads) {
      if (!noticeUpgrade(res?.status, body)) setError(body?.error ?? "Something went wrong. Try again.");
      return;
    }
    upsert(body.leads);
    setResult({ ...body, query: `${niche.trim()} in ${location.trim()}` });
    setFilter("active");
    setQuery("");
    if (usage) setUsage({ ...usage, used: usage.used + body.added });
  }

  async function setStatus(lead: Lead, status: Exclude<LeadStatus, "built">) {
    const previous = lead.status;
    const next: LeadStatus = lead.siteId && status !== "dismissed" ? "built" : status;
    setLeads((all) => all.map((l) => (l.id === lead.id ? { ...l, status: next } : l)));
    const res = await fetch(`/api/agents/leads/${lead.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status }),
    }).catch(() => null);
    if (!res?.ok) {
      setLeads((all) => all.map((l) => (l.id === lead.id ? { ...l, status: previous } : l)));
      toast.error("Couldn't update that lead");
    }
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-[1120px] px-5 pb-24 pt-12 sm:pt-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <motion.h1
              initial={reduce ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 90, damping: 18 }}
              className="font-[family-name:var(--font-display)] text-[44px] font-semibold leading-[1] tracking-[-0.045em] sm:text-[56px]"
            >
              Lead Finder
            </motion.h1>
            <motion.p
              initial={reduce ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 90, damping: 18, delay: 0.06 }}
              className="mt-3 max-w-[560px] text-[17px] leading-[1.47] text-fg-2"
            >
              Local businesses on Google with no website yet, ranked by how likely they are to buy one.
            </motion.p>
          </div>
          {usage && (
            <p className="rounded-full bg-fg/[.06] px-3.5 py-1.5 text-[13px] tabular-nums text-fg-2">
              {usage.used.toLocaleString("en-US")} of {usage.limit.toLocaleString("en-US")} leads this month
            </p>
          )}
        </div>

        <motion.form
          onSubmit={search}
          initial={reduce ? false : { opacity: 0, y: 16, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 80, damping: 18, delay: 0.12 }}
          className="mt-9 flex flex-col gap-2 rounded-[24px] bg-elevated p-2 shadow-soft ring-1 ring-hairline md:flex-row md:items-center"
        >
          <Field icon={Briefcase} label="Kind of business" value={niche} onChange={setNiche} placeholder="Plumbers, barbers, bakeries…" />
          <span className="hidden h-7 w-px bg-hairline md:block" />
          <Field
            icon={MapPin}
            label="City or area"
            value={location}
            onChange={setLocation}
            placeholder={country === "US" ? "Austin, TX" : "Calgary, AB"}
          />
          <div className="flex items-center gap-2">
            <div role="radiogroup" aria-label="Country" className="flex rounded-full bg-fg/[.06] p-1">
              {(["US", "CA"] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  role="radio"
                  aria-checked={country === c}
                  onClick={() => setCountry(c)}
                  className={`relative h-9 rounded-full px-3.5 text-[14px] font-medium ${country === c ? "text-fg" : "text-fg-2 hover:text-fg"}`}
                >
                  {country === c && (
                    <motion.span
                      layoutId="lead-country"
                      className="absolute inset-0 rounded-full bg-elevated shadow-soft"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    />
                  )}
                  <span className="relative">{c === "US" ? "USA" : "Canada"}</span>
                </button>
              ))}
            </div>
            <button
              type="submit"
              disabled={searching}
              className="ml-auto flex h-11 items-center gap-2 rounded-full bg-octa-600 px-5 text-[15px] font-medium text-white transition-colors hover:bg-octa-500 disabled:opacity-60"
            >
              <Search size={16} strokeWidth={2} />
              {searching ? "Searching…" : "Find leads"}
            </button>
          </div>
        </motion.form>

        <div className="mt-4 flex flex-wrap gap-2">
          {NICHES.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setNiche(n)}
              className={`h-9 rounded-full px-3.5 text-[14px] transition-colors ${
                niche === n ? "bg-fg text-canvas" : "bg-fg/[.06] text-fg-2 hover:bg-fg/[.1] hover:text-fg"
              }`}
            >
              {n}
            </button>
          ))}
        </div>

        <AnimatePresence>
          {(error || result) && (
            <motion.p
              key={error || result?.query}
              initial={reduce ? false : { opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              role={error ? "alert" : "status"}
              className={`mt-5 rounded-[16px] px-4 py-3 text-[15px] ${error ? "bg-red-500/10 text-red-700 dark:text-red-300" : "bg-fg/[.05] text-fg-2"}`}
            >
              {error || (result && summarize(result))}
            </motion.p>
          )}
        </AnimatePresence>

        {leads.length > 0 ? (
          <>
            <div className="mt-12 flex flex-wrap items-center gap-3">
              <h2 className="mr-auto text-[21px] font-semibold tracking-[-0.02em]">
                Your leads <span className="ml-1 text-[15px] font-normal text-fg-3">{leads.filter((l) => l.status !== "dismissed").length}</span>
              </h2>
              <label className="flex h-11 w-full items-center gap-2 rounded-full bg-elevated px-4 ring-1 ring-hairline focus-within:ring-2 focus-within:ring-octa-600 sm:w-[220px]">
                <Search size={16} strokeWidth={1.75} className="text-fg-3" />
                <span className="sr-only">Search leads</span>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search"
                  className="min-w-0 flex-1 bg-transparent text-[15px] placeholder:text-fg-3 focus:outline-none"
                />
              </label>
              <div role="radiogroup" aria-label="Filter" className="flex rounded-full bg-fg/[.06] p-1">
                {FILTERS.map((f) => (
                  <button
                    key={f.id}
                    role="radio"
                    aria-checked={filter === f.id}
                    onClick={() => setFilter(f.id)}
                    className={`relative h-9 rounded-full px-3.5 text-[14px] font-medium ${filter === f.id ? "text-fg" : "text-fg-2 hover:text-fg"}`}
                  >
                    {filter === f.id && (
                      <motion.span
                        layoutId="leads-filter"
                        className="absolute inset-0 rounded-full bg-elevated shadow-soft"
                        transition={{ type: "spring", stiffness: 420, damping: 34 }}
                      />
                    )}
                    <span className="relative">{f.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <ul className="mt-5 overflow-hidden rounded-[24px] bg-elevated shadow-soft ring-1 ring-hairline">
              <AnimatePresence initial={false}>
                {visible.map((lead) => (
                  <LeadRow
                    key={lead.id}
                    lead={lead}
                    onOpen={() => setOpenId(lead.id)}
                    onSave={() => setStatus(lead, lead.status === "saved" ? "new" : "saved")}
                    onDismiss={() => setStatus(lead, lead.status === "dismissed" ? "new" : "dismissed")}
                  />
                ))}
              </AnimatePresence>
            </ul>
            {visible.length === 0 && (
              <p className="mt-10 text-center text-[15px] text-fg-3">
                {query ? `No leads match “${query}”.` : `No ${FILTERS.find((f) => f.id === filter)?.label.toLowerCase()} leads yet.`}
              </p>
            )}
            <p className="mt-4 text-[12px] text-fg-3">Business details and reviews from Google Maps.</p>
          </>
        ) : (
          !result && (
            <p className="mt-16 max-w-[520px] text-[15px] leading-[1.47] text-fg-3">
              Pick a kind of business and a city. Lead Finder searches Google, skips everyone who already has a website, and ranks the
              rest by reviews, rating and niche.
            </p>
          )
        )}
      </div>

      <LeadSheet
        lead={open}
        onClose={() => setOpenId(null)}
        onChange={(lead) => upsert([lead])}
        onSave={(lead) => setStatus(lead, lead.status === "saved" ? "new" : "saved")}
      />
    </div>
  );
}

function summarize(r: Result) {
  const parts = [`${r.qualified} of ${r.found} ${r.query.toLowerCase()} have no website.`];
  if (r.added) parts.push(`${r.added} new lead${r.added === 1 ? "" : "s"} added.`);
  if (r.alreadyHad) parts.push(`${r.alreadyHad} you already had.`);
  if (r.overLimit) parts.push(`${r.overLimit} more left out — you've reached this month's leads.`);
  if (!r.qualified) return `Every ${r.query.toLowerCase()} we found already has a website. Try a nearby town or another niche.`;
  return parts.join(" ");
}

function Field({
  icon: Icon,
  label,
  value,
  onChange,
  placeholder,
}: {
  icon: typeof Search;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="flex h-12 flex-1 items-center gap-3 rounded-[16px] px-4 focus-within:bg-fg/[.04]">
      <Icon size={18} strokeWidth={1.5} className="shrink-0 text-fg-3" />
      <span className="sr-only">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={80}
        className="min-w-0 flex-1 bg-transparent text-[16px] placeholder:text-fg-3 focus:outline-none"
      />
    </label>
  );
}

function LeadRow({ lead, onOpen, onSave, onDismiss }: { lead: Lead; onOpen: () => void; onSave: () => void; onDismiss: () => void }) {
  const reduce = useReducedMotion();
  const city = lead.address?.split(",").slice(-3, -1).join(",").trim();
  return (
    <motion.li
      layout
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
      className={`group flex items-center gap-4 border-b border-hairline px-4 py-4 last:border-b-0 sm:px-5 ${lead.status === "dismissed" ? "opacity-60" : ""}`}
    >
      <ScoreBadge score={lead.score} />
      <button onClick={onOpen} className="min-w-0 flex-1 text-left">
        <p className="flex items-center gap-2 truncate text-[17px] font-semibold tracking-[-0.01em]">
          <span className="truncate">{lead.name}</span>
          {lead.status === "built" && (
            <span className="shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
              Site built
            </span>
          )}
        </p>
        <p className="mt-0.5 truncate text-[14px] text-fg-2">{[lead.category, city].filter(Boolean).join(" · ")}</p>
        <p className="mt-2 flex flex-wrap items-center gap-1.5 text-[12px]">
          {lead.reasons.map((r) => (
            <span key={r} className="rounded-full bg-fg/[.06] px-2 py-0.5 text-fg-2">
              {r.includes("★") && <Star size={11} strokeWidth={2} className="-mt-px mr-1 inline text-amber-500" />}
              {r.replace("★", "")}
            </span>
          ))}
        </p>
      </button>
      {lead.phone && (
        <a
          href={`tel:${lead.phone.replace(/[^\d+]/g, "")}`}
          className="hidden h-11 items-center gap-2 rounded-full px-3 text-[14px] tabular-nums text-fg-2 hover:bg-fg/5 hover:text-fg md:flex"
        >
          <Phone size={15} strokeWidth={1.75} />
          {lead.phone}
        </a>
      )}
      <div className="flex shrink-0 items-center">
        <IconButton label={lead.status === "saved" ? "Unsave" : "Save"} onClick={onSave}>
          {lead.status === "saved" ? <BookmarkCheck size={18} strokeWidth={1.75} className="text-octa-600" /> : <Bookmark size={18} strokeWidth={1.5} />}
        </IconButton>
        <IconButton label={lead.status === "dismissed" ? "Restore" : "Dismiss"} onClick={onDismiss}>
          <X size={18} strokeWidth={1.5} />
        </IconButton>
        <IconButton label="Details" onClick={onOpen}>
          <ChevronRight size={18} strokeWidth={1.5} />
        </IconButton>
      </div>
    </motion.li>
  );
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className="grid size-11 place-items-center rounded-full text-fg-2 transition-colors hover:bg-fg/5 hover:text-fg"
    >
      {children}
    </button>
  );
}
