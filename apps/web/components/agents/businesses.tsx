"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, ChevronRight, Mail, Phone, Search, Sparkles } from "lucide-react";
import type { Lead } from "@/lib/agents/store";
import { SEQUENCE_STATUS } from "./outreach";
import { BusinessPhoto, CopyButton, Stars, placeLine } from "./parts";

type Filter = "all" | "hunting" | "ready" | "built" | "emailed";

const FILTERS: { id: Filter; label: string; test: (l: Lead) => boolean }[] = [
  { id: "all", label: "All", test: () => true },
  { id: "hunting", label: "Finding contacts", test: (l) => l.contactStatus === "pending" },
  { id: "ready", label: "Ready to pitch", test: (l) => !!l.email || !!l.phone },
  { id: "built", label: "Website built", test: (l) => !!l.siteId },
  { id: "emailed", label: "Emailed", test: (l) => !!l.outreach },
];

// The businesses the user picked: who they are, how to reach them, and a way to build their site.
export function Businesses({
  leads,
  onOpen,
  onBuild,
  building,
  onFind,
}: {
  leads: Lead[];
  onOpen: (lead: Lead) => void;
  onBuild: (lead: Lead) => void;
  building: string | null;
  onFind: () => void;
}) {
  const reduce = useReducedMotion();
  const [filter, setFilter] = useState<Filter>("all");
  const counts = useMemo(() => Object.fromEntries(FILTERS.map((f) => [f.id, leads.filter(f.test).length])), [leads]);
  const shown = leads.filter(FILTERS.find((f) => f.id === filter)!.test);

  if (!leads.length) {
    return (
      <div className="flex flex-col items-center rounded-[28px] bg-elevated px-6 py-16 text-center ring-1 ring-hairline">
        <span className="grid size-14 place-items-center rounded-full bg-octa-600/10 text-octa-600">
          <Search size={22} strokeWidth={1.5} />
        </span>
        <h2 className="mt-5 text-[24px] font-semibold tracking-[-0.02em]">No businesses yet</h2>
        <p className="mt-2 max-w-[420px] text-[15px] text-fg-2">
          Search a city, add the businesses worth pitching, and they&apos;ll show up here with their email and phone.
        </p>
        <button
          type="button"
          onClick={onFind}
          className="mt-6 flex h-11 items-center gap-2 rounded-full bg-octa-600 px-6 text-[15px] font-medium text-white hover:bg-octa-500"
        >
          Find businesses
        </button>
      </div>
    );
  }

  return (
    <div>
      <div role="tablist" aria-label="Filter businesses" className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            role="tab"
            aria-selected={filter === f.id}
            onClick={() => setFilter(f.id)}
            className="relative flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[14px] font-medium"
          >
            {filter === f.id && (
              <motion.span
                layoutId="businesses-filter"
                className="absolute inset-0 rounded-full bg-fg"
                transition={{ type: "spring", stiffness: 500, damping: 38 }}
              />
            )}
            <span className={`relative ${filter === f.id ? "text-canvas" : "text-fg-2"}`}>
              {f.label} <span className="tabular-nums opacity-60">{counts[f.id]}</span>
            </span>
          </button>
        ))}
      </div>

      <ul className="mt-5 overflow-hidden rounded-[24px] bg-elevated shadow-soft ring-1 ring-hairline dark:shadow-none">
        <AnimatePresence initial={false}>
          {shown.map((lead) => (
            <motion.li
              key={lead.id}
              layout={!reduce}
              initial={reduce ? false : { opacity: 0, backgroundColor: "color-mix(in oklab, var(--color-octa-500) 12%, transparent)" }}
              animate={{ opacity: 1, backgroundColor: "rgba(0,0,0,0)" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 30, backgroundColor: { duration: 1.6 } }}
              className="border-b border-hairline last:border-b-0"
            >
              <Row lead={lead} onOpen={onOpen} onBuild={onBuild} building={building === lead.id} />
            </motion.li>
          ))}
        </AnimatePresence>
        {!shown.length && <li className="px-5 py-10 text-center text-[15px] text-fg-3">Nothing here yet.</li>}
      </ul>
    </div>
  );
}

function Row({ lead, onOpen, onBuild, building }: { lead: Lead; onOpen: (l: Lead) => void; onBuild: (l: Lead) => void; building: boolean }) {
  const where = placeLine(lead.city);
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(lead)}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onOpen(lead))}
      className="group grid cursor-pointer grid-cols-[auto_1fr_auto] items-center gap-x-4 gap-y-3 px-4 py-4 transition-colors hover:bg-fg/[.025] sm:px-5 lg:grid-cols-[48px_minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1.3fr)_172px]"
    >
      <BusinessPhoto src={lead.photoUrl} name={lead.name} className="size-12 rounded-[14px] text-[20px]" />

      <div className="min-w-0">
        <p className="flex items-center gap-2">
          <span className="truncate text-[16px] font-semibold tracking-[-0.01em]">{lead.name}</span>
          {lead.outreach && (
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${SEQUENCE_STATUS[lead.outreach].tone}`}>
              {SEQUENCE_STATUS[lead.outreach].label}
            </span>
          )}
        </p>
        <p className="mt-0.5 flex items-center gap-2 truncate text-[13px] text-fg-2">
          {lead.rating ? (
            <>
              <Stars rating={lead.rating} size={11} />
              <span className="tabular-nums">{lead.reviewCount}</span>
            </>
          ) : null}
          <span className="truncate">{[lead.category, where].filter(Boolean).join(" · ")}</span>
        </p>
      </div>

      {/* Contacts sit under the name on small screens, in their own columns on large ones. */}
      <div className="col-span-3 col-start-1 row-start-2 flex min-w-0 flex-col gap-1 sm:pl-16 lg:col-span-1 lg:col-start-3 lg:row-start-1 lg:pl-0">
        {lead.phone ? (
          <span className="flex min-w-0 items-center gap-1 text-[14px]">
            <Phone size={14} strokeWidth={1.5} className="shrink-0 text-fg-3" />
            <a href={`tel:${lead.phone.replace(/[^\d+]/g, "")}`} onClick={(e) => e.stopPropagation()} className="truncate tabular-nums hover:underline">
              {lead.phone}
            </a>
            <CopyButton value={lead.phone} label="phone number" />
          </span>
        ) : (
          <span className="text-[14px] text-fg-3">No phone</span>
        )}
      </div>

      <div className="col-span-3 col-start-1 row-start-3 min-w-0 sm:pl-16 lg:col-span-1 lg:col-start-4 lg:row-start-1 lg:pl-0">
        <EmailCell lead={lead} />
      </div>

      <div className="col-start-3 row-start-1 flex items-center justify-end gap-1 lg:col-start-5">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onBuild(lead);
          }}
          disabled={building}
          className="hidden h-10 items-center gap-1.5 rounded-full bg-fg/[.06] px-4 text-[14px] font-medium transition-colors hover:bg-fg/[.1] disabled:opacity-60 sm:flex"
        >
          {lead.siteId ? <ArrowUpRight size={15} strokeWidth={1.75} /> : <Sparkles size={15} strokeWidth={1.5} className="text-octa-600" />}
          {building ? "Starting…" : lead.siteId ? "Open site" : "Build website"}
        </button>
        <ChevronRight size={18} strokeWidth={1.5} className="text-fg-3 transition-transform group-hover:translate-x-0.5" />
      </div>
    </div>
  );
}

const CONFIDENCE = {
  high: { label: "Strong match", tone: "bg-emerald-500" },
  medium: { label: "Likely match", tone: "bg-amber-500" },
  low: { label: "Check before using", tone: "bg-fg-3" },
};

function EmailCell({ lead }: { lead: Lead }) {
  const reduce = useReducedMotion();
  return (
    <AnimatePresence mode="wait" initial={false}>
      {lead.contactStatus === "pending" ? (
        <motion.span key="hunting" exit={{ opacity: 0 }} className="flex items-center gap-2 text-[14px]">
          <Mail size={14} strokeWidth={1.5} className="shrink-0 text-fg-3" />
          <span className="shimmer-text">Octa is finding their email…</span>
        </motion.span>
      ) : lead.email ? (
        <motion.span
          key="found"
          initial={reduce ? false : { opacity: 0, y: 6, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          className="flex min-w-0 items-center gap-1 text-[14px]"
        >
          <Mail size={14} strokeWidth={1.5} className="shrink-0 text-fg-3" />
          {lead.emailConfidence && (
            <span
              title={CONFIDENCE[lead.emailConfidence].label}
              className={`ml-0.5 size-1.5 shrink-0 rounded-full ${CONFIDENCE[lead.emailConfidence].tone}`}
            />
          )}
          <a href={`mailto:${lead.email}`} onClick={(e) => e.stopPropagation()} className="ml-1 truncate hover:underline">
            {lead.email}
          </a>
          <CopyButton value={lead.email} label="email" />
        </motion.span>
      ) : (
        <motion.span key="none" initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-[14px] text-fg-3">
          <Mail size={14} strokeWidth={1.5} className="shrink-0" />
          No public email · call them
        </motion.span>
      )}
    </AnimatePresence>
  );
}
