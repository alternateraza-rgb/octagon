"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, Inbox, MapPin, Plus } from "lucide-react";
import { AgentBadge } from "./agent-badge";
import type { Agent } from "./types";

const spring = { type: "spring" as const, stiffness: 90, damping: 18 };

const STATUS: Record<Agent["status"], string> = { active: "Working", paused: "Paused", auto_paused: "Paused itself" };

// Your agents as a crew: who's out working, what each is doing right now, and how far their leads have got.
export function TeamView({ agents, unread }: { agents: Agent[]; unread: number }) {
  const reduce = useReducedMotion();
  const total = agents.reduce(
    (t, a) => ({
      found: t.found + a.stats.found,
      contacted: t.contacted + a.stats.contacted,
      replies: t.replies + a.stats.replies,
      interested: t.interested + a.stats.interested,
    }),
    { found: 0, contacted: 0, replies: 0, interested: 0 },
  );
  const working = agents.filter((a) => a.status === "active").length;

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-[1120px] px-5 pb-24 pt-12 sm:pt-16">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <motion.h1
              initial={reduce ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={spring}
              className="font-[family-name:var(--font-display)] text-[44px] font-semibold leading-[1] tracking-[-0.045em] sm:text-[56px]"
            >
              Your agents
            </motion.h1>
            <p className="mt-3 max-w-[560px] text-balance text-[17px] leading-[1.47] text-fg-2">
              {agents.length
                ? `${working} of ${agents.length} out working. They find businesses with no website, write to them, and tell you who wants one.`
                : "Agents find businesses with no website, write to them, and tell you who wants one."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/agents/inbox"
              className="relative flex h-11 items-center gap-2 rounded-full bg-fg/[.06] px-4 text-[15px] font-medium hover:bg-fg/10"
            >
              <Inbox size={17} strokeWidth={1.5} />
              Replies
              {unread > 0 && (
                <span className="grid min-w-5 place-items-center rounded-full bg-octa-600 px-1.5 text-[12px] font-semibold tabular-nums text-white">
                  {unread}
                </span>
              )}
            </Link>
            <Link
              href="/dashboard/agents/new"
              className="flex h-11 items-center gap-2 rounded-full bg-octa-600 px-5 text-[15px] font-medium text-white hover:bg-octa-500 active:bg-octa-700"
            >
              <Plus size={17} strokeWidth={2} />
              Hire an agent
            </Link>
          </div>
        </div>

        {agents.length > 0 && (
          <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-[22px] bg-hairline ring-1 ring-hairline sm:grid-cols-4">
            {[
              ["Businesses found", total.found],
              ["Emailed", total.contacted],
              ["Replies", total.replies],
              ["Interested", total.interested],
            ].map(([label, value], i) => (
              <div key={label} className="bg-elevated px-5 py-4">
                <dt className="text-[13px] font-medium text-fg-3">{label}</dt>
                <dd className={`mt-1 text-[32px] font-semibold tabular-nums tracking-[-0.03em] ${i === 3 ? "text-octa-600" : ""}`}>
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        )}

        <ul className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {agents.map((agent, i) => (
            <motion.li
              key={agent.id}
              className="min-w-0"
              initial={reduce ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: 0.05 + i * 0.06 }}
            >
              <AgentTile agent={agent} />
            </motion.li>
          ))}
          <motion.li
            initial={reduce ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: 0.05 + agents.length * 0.06 }}
          >
            <Link
              href="/dashboard/agents/new"
              className="group grid h-full min-h-[320px] place-items-center rounded-[28px] border border-dashed border-fg/15 p-6 text-center transition-colors hover:border-octa-600/40 hover:bg-octa-600/[.03]"
            >
              <span>
                <span className="mx-auto grid size-14 place-items-center rounded-full bg-fg/[.05] text-fg-2 transition-transform duration-300 ease-[var(--ease-spring)] group-hover:scale-110 group-hover:bg-octa-600 group-hover:text-white">
                  <Plus size={24} strokeWidth={1.5} />
                </span>
                <span className="mt-4 block text-[17px] font-semibold tracking-[-0.01em]">
                  {agents.length ? "Hire another agent" : "Hire your first agent"}
                </span>
                <span className="mt-1 block text-[14px] text-fg-2">Pick a trade and a city. It takes a minute.</span>
              </span>
            </Link>
          </motion.li>
        </ul>
      </div>
    </div>
  );
}

function AgentTile({ agent }: { agent: Agent }) {
  const { stats } = agent;
  const active = agent.status === "active";
  // The pipeline as one bar: each segment is the share of found businesses that reached that stage.
  const steps = [stats.found, stats.emails, stats.contacted, stats.replies, stats.interested];
  return (
    <Link
      href={`/dashboard/agents/${agent.id}`}
      className="group relative flex h-full min-h-[320px] flex-col rounded-[28px] bg-elevated p-6 shadow-soft ring-1 ring-hairline transition-[transform,box-shadow] duration-300 ease-[var(--ease-spring)] hover:-translate-y-0.5 hover:shadow-float"
    >
      <div className="flex items-start gap-4">
        <AgentBadge name={agent.name} status={agent.status} size={56} />
        <div className="min-w-0 flex-1 pt-1">
          <p className="flex items-center gap-2 text-[21px] font-semibold tracking-[-0.02em]">
            {agent.name}
            <span
              className={`rounded-full px-2 py-0.5 text-[12px] font-medium tracking-normal ${
                active ? "bg-octa-600/10 text-octa-700 dark:text-octa-400" : "bg-fg/[.06] text-fg-2"
              }`}
            >
              {STATUS[agent.status]}
            </span>
          </p>
          <p className="mt-0.5 flex items-center gap-1 truncate text-[14px] text-fg-2">
            {agent.niche} <span className="text-fg-3">·</span>
            <MapPin size={13} strokeWidth={1.5} className="shrink-0 text-fg-3" />
            <span className="truncate">{agent.locations.map((l) => l.split(",")[0]).join(", ")}</span>
          </p>
        </div>
        <ArrowUpRight
          size={18}
          strokeWidth={1.5}
          className="shrink-0 text-fg-3 transition-transform duration-300 ease-[var(--ease-spring)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-fg"
        />
      </div>

      <p className="mt-6 flex items-center gap-2 text-[15px]">
        {active && (
          <span className="relative flex size-2">
            <span className="absolute inset-0 animate-ping rounded-full bg-octa-500 opacity-60 motion-reduce:hidden" />
            <span className="relative size-2 rounded-full bg-octa-600" />
          </span>
        )}
        <span className={active ? "" : "text-fg-2"}>{agent.now}</span>
      </p>

      <div className="mt-auto pt-8">
        <div className="flex h-2 gap-[3px]" aria-hidden>
          {steps.map((n, i) => (
            <span
              key={i}
              className={`h-full rounded-full ${i === 4 ? "bg-octa-600" : i === 3 ? "bg-octa-400/70" : "bg-fg/[.12]"}`}
              style={{ flexGrow: Math.max(n, stats.found * 0.04) }}
            />
          ))}
        </div>
        <dl className="mt-4 grid grid-cols-4 gap-2">
          {[
            ["Found", stats.found],
            ["Emailed", stats.contacted],
            ["Replied", stats.replies],
            ["Keen", stats.interested],
          ].map(([label, n], i) => (
            <div key={label}>
              <dd className={`text-[24px] font-semibold tabular-nums tracking-[-0.03em] ${i === 3 && Number(n) > 0 ? "text-octa-600" : ""}`}>
                {n}
              </dd>
              <dt className="text-[12px] text-fg-3">{label}</dt>
            </div>
          ))}
        </dl>
        <p className="mt-5 flex items-center justify-between border-t border-hairline pt-4 text-[13px] text-fg-2">
          <span>
            {agent.sentToday} of {agent.dailyCap} emails today
          </span>
          <span className="h-1 w-20 overflow-hidden rounded-full bg-fg/[.08]">
            <span className="block h-full rounded-full bg-fg/40" style={{ width: `${Math.min(100, (agent.sentToday / agent.dailyCap) * 100)}%` }} />
          </span>
        </p>
      </div>
    </Link>
  );
}
