"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { noticeUpgrade } from "@/lib/billing/client";
import type { Card } from "@/lib/agents/deck";
import type { Lead } from "@/lib/agents/store";
import type { OutreachState } from "@/lib/outreach/state";
import { useToast } from "@/components/ui/toast";
import { BusinessSheet } from "./business-sheet";
import { Businesses } from "./businesses";
import { Finder, type RecentSearch } from "./finder";
import { Outreach } from "./outreach";
import { BusinessPhoto } from "./parts";

export type Tab = "find" | "businesses" | "outreach";
type Ghost = { id: string; card: Card; from: DOMRect; to: DOMRect };

// How long the list keeps asking about emails still being hunted.
const POLL_MS = 2500;
const POLL_FOR = 90_000;

// Octa Agents: find local businesses with great reviews and no website, pick the ones worth
// pitching, and build them a site.
export function AgentsView({
  initialLeads,
  recent: initialRecent,
  outreach: initialOutreach,
  initialTab,
  notice,
}: {
  initialLeads: Lead[];
  recent: RecentSearch[];
  outreach: OutreachState;
  initialTab: Tab | null;
  // Set when Microsoft sends the user back after connecting Outlook.
  notice: string | null;
}) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>(initialTab ?? (initialLeads.length ? "businesses" : "find"));
  const [outreach, setOutreach] = useState(initialOutreach);
  const outreachReady = outreach.mailbox?.status === "connected" && !!outreach.settings;

  // The ?tab=…&mailbox=… Microsoft sends the user back with has done its job once read.
  // Without a navigation, so the page doesn't re-animate.
  useEffect(() => {
    if (initialTab || notice) window.history.replaceState(null, "", "/dashboard/agents");
  }, [initialTab, notice]);

  function goTo(next: Tab) {
    setTab(next);
    // Fresh numbers whenever the Outreach tab opens.
    if (next === "outreach") {
      void fetch("/api/agents/outreach", { cache: "no-store" })
        .then((r) => (r.ok ? (r.json() as Promise<OutreachState>) : null))
        .then((s) => s && setOutreach(s))
        .catch(() => {});
    }
  }
  const [leads, setLeads] = useState(initialLeads);
  const [recent, setRecent] = useState(initialRecent);
  const [openId, setOpenId] = useState<string | null>(null);
  const [building, setBuilding] = useState<string | null>(null);
  const [ghosts, setGhosts] = useState<Ghost[]>([]);
  const [bump, setBump] = useState(0);
  const badgeRef = useRef<HTMLSpanElement>(null);
  const pollStarted = useRef<number | null>(null);

  const replace = useCallback((lead: Lead) => setLeads((all) => all.map((l) => (l.id === lead.id ? lead : l))), []);

  // Emails are hunted after a business is added; the list checks back until they're all in.
  const pending = leads.filter((l) => l.contactStatus === "pending").map((l) => l.id);
  const pendingKey = pending.join(",");
  useEffect(() => {
    if (!pendingKey) {
      pollStarted.current = null;
      return;
    }
    pollStarted.current ??= Date.now();
    if (Date.now() - pollStarted.current > POLL_FOR) return;
    const t = setTimeout(async () => {
      const res = await fetch(`/api/agents/leads?ids=${pendingKey}`, { cache: "no-store" }).catch(() => null);
      const body = (await res?.json().catch(() => null)) as { leads?: Lead[] } | null;
      if (!body?.leads) return;
      const fresh = new Map(body.leads.map((l) => [l.id, l]));
      setLeads((all) => all.map((l) => fresh.get(l.id) ?? l));
    }, POLL_MS);
    return () => clearTimeout(t);
  }, [pendingKey, leads]);

  function added(lead: Lead, from: HTMLElement | null, card: Card) {
    setLeads((all) => [lead, ...all.filter((l) => l.id !== lead.id)]);
    const to = badgeRef.current?.getBoundingClientRect();
    if (reduce || !from || !to) return setBump((b) => b + 1);
    setGhosts((g) => [...g, { id: `${lead.id}-${Date.now()}`, card, from: from.getBoundingClientRect(), to }]);
  }

  async function build(lead: Lead) {
    if (lead.siteId) return router.push(`/dashboard/sites/${lead.siteId}`);
    if (building) return;
    setBuilding(lead.id);
    const res = await fetch(`/api/agents/leads/${lead.id}/build`, { method: "POST" }).catch(() => null);
    const body = (await res?.json().catch(() => null)) as { id?: string; existing?: boolean; error?: string } | null;
    if (res?.ok && body?.id) {
      replace({ ...lead, siteId: body.id, status: "built", stage: lead.stage === "added" ? "built" : lead.stage });
      router.push(body.existing ? `/dashboard/sites/${body.id}` : `/dashboard/sites/${body.id}?new=1`);
      return;
    }
    setBuilding(null);
    if (!noticeUpgrade(res?.status, body)) toast.error(body?.error ?? "Couldn't start the website. Try again.");
  }

  async function remove(lead: Lead) {
    setOpenId(null);
    setLeads((all) => all.filter((l) => l.id !== lead.id));
    const res = await fetch(`/api/agents/leads/${lead.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ removed: true }),
    }).catch(() => null);
    if (res?.ok) toast.success(`Removed ${lead.name}`);
    else {
      setLeads((all) => [lead, ...all]);
      toast.error("Couldn't remove that business");
    }
  }

  const open = leads.find((l) => l.id === openId) ?? null;

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-[1120px] px-5 pb-24 pt-12 sm:pt-16">
        <motion.h1
          initial={reduce ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 90, damping: 18 }}
          className="font-[family-name:var(--font-display)] text-[44px] font-semibold leading-[1] tracking-[-0.045em] sm:text-[56px]"
        >
          Octa Agents
        </motion.h1>
        <p className="mt-3 max-w-[620px] text-[17px] text-fg-2">
          Find local businesses with great reviews and no website. Octa finds how to reach them, and builds their site in one click.
        </p>

        <div role="tablist" aria-label="Octa Agents" className="mt-8 inline-flex rounded-full bg-fg/[.05] p-1">
          {(
            [
              { id: "find", label: "Find" },
              { id: "businesses", label: "Businesses" },
              { id: "outreach", label: "Outreach" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => goTo(t.id)}
              className="relative flex h-10 items-center gap-2 rounded-full px-4 text-[15px] font-medium sm:px-5"
            >
              {tab === t.id && (
                <motion.span
                  layoutId="agents-tab"
                  className="absolute inset-0 rounded-full bg-elevated shadow-soft ring-1 ring-hairline dark:shadow-none"
                  transition={{ type: "spring", stiffness: 500, damping: 38 }}
                />
              )}
              <span className={`relative ${tab === t.id ? "text-fg" : "text-fg-2"}`}>{t.label}</span>
              {t.id === "businesses" && (
                <motion.span
                  ref={badgeRef}
                  key={bump}
                  initial={reduce || !bump ? false : { scale: 1.45 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 14 }}
                  className={`relative grid h-6 min-w-6 place-items-center rounded-full px-1.5 text-[12px] font-semibold tabular-nums ${
                    leads.length ? "bg-octa-600 text-white" : "bg-fg/[.08] text-fg-2"
                  }`}
                >
                  {leads.length}
                </motion.span>
              )}
            </button>
          ))}
        </div>

        <div className="mt-8">
          {/* Finder stays mounted, so switching tabs doesn't lose the deck. */}
          <div hidden={tab !== "find"}>
            <Finder
              recent={recent}
              onAdded={added}
              onSearched={(s) => setRecent((r) => [s, ...r.filter((x) => !(x.niche === s.niche && x.location === s.location))])}
            />
          </div>
          {tab === "businesses" && (
            <motion.div initial={reduce ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Businesses leads={leads} onOpen={(l) => setOpenId(l.id)} onBuild={build} building={building} onFind={() => goTo("find")} />
            </motion.div>
          )}
          {tab === "outreach" && (
            <motion.div initial={reduce ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Outreach state={outreach} onState={setOutreach} notice={notice} onOpenLead={setOpenId} />
            </motion.div>
          )}
        </div>
      </div>

      {/* An added card's photo flies into the Businesses count. */}
      <AnimatePresence>
        {ghosts.map((g) => (
          <motion.div
            key={g.id}
            className="pointer-events-none fixed left-0 top-0 z-[100] overflow-hidden rounded-[28px] shadow-float"
            initial={{ x: g.from.left, y: g.from.top, width: g.from.width, height: Math.min(g.from.height, 160), opacity: 1 }}
            animate={{
              x: g.to.left + g.to.width / 2 - 14,
              y: g.to.top + g.to.height / 2 - 14,
              width: 28,
              height: 28,
              opacity: 0.6,
              borderRadius: 14,
            }}
            transition={{ type: "spring", stiffness: 140, damping: 22, mass: 0.9 }}
            onAnimationComplete={() => {
              setGhosts((all) => all.filter((x) => x.id !== g.id));
              setBump((b) => b + 1);
            }}
          >
            <BusinessPhoto src={g.card.photoUrl} name={g.card.name} className="size-full text-[40px]" />
          </motion.div>
        ))}
      </AnimatePresence>

      <BusinessSheet
        lead={open}
        onClose={() => setOpenId(null)}
        onChange={replace}
        onBuild={build}
        onRemove={remove}
        building={building === open?.id}
        outreachReady={outreachReady}
        onSetupOutreach={() => {
          setOpenId(null);
          goTo("outreach");
        }}
      />
    </div>
  );
}
