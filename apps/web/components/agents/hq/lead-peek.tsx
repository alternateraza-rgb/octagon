"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, ExternalLink, MapPin, MessageCircle, Sparkles, X } from "lucide-react";
import { ScoreBadge } from "@/components/agents/score-badge";
import { STAGES, type Agent, type FieldLead } from "./types";
import { ago } from "./time";

// One business, from the map or the pipeline: where it is, how the agent found it, and what happens next.
export function LeadPeek({ lead, agent, now, onClose }: { lead: FieldLead | null; agent: Agent; now: number; onClose: () => void }) {
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!lead) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lead, onClose]);

  const reached = lead ? STAGES.findIndex((s) => s.id === lead.stage) : -1;
  const talking = lead?.stage === "replied" || lead?.stage === "interested";

  return (
    <AnimatePresence>
      {lead && (
        <motion.aside
          key="peek"
          role="dialog"
          aria-label={lead.name}
          initial={reduce ? { opacity: 0 } : { x: "105%" }}
          animate={reduce ? { opacity: 1 } : { x: 0 }}
          exit={reduce ? { opacity: 0 } : { x: "105%" }}
          transition={{ type: "spring", stiffness: 260, damping: 30 }}
          className="fixed inset-y-2 right-2 z-40 bg-elevated flex w-[min(420px,calc(100vw-16px))] flex-col overflow-hidden rounded-[28px] shadow-float ring-1 ring-hairline"
        >
          <div className="flex items-start gap-4 p-6 pb-4">
            <ScoreBadge score={lead.score} />
            <div className="min-w-0 flex-1">
              <p className="text-[21px] font-semibold leading-[1.2] tracking-[-0.02em]">{lead.name}</p>
              <p className="mt-1 flex items-center gap-1 text-[14px] text-fg-2">
                <MapPin size={13} strokeWidth={1.5} className="shrink-0" />
                <span className="truncate">{lead.address}</span>
              </p>
            </div>
            <button onClick={onClose} aria-label="Close" className="grid size-11 shrink-0 place-items-center rounded-full text-fg-2 hover:bg-fg/5 hover:text-fg">
              <X size={18} strokeWidth={1.5} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-6">
            <ol className="relative mt-2 space-y-4 border-l border-hairline pl-6">
              {STAGES.map((s, i) => {
                const done = i <= reached;
                return (
                  <li key={s.id} className="relative">
                    <span
                      className={`absolute -left-[33px] top-0.5 grid size-[18px] place-items-center rounded-full ring-4 ring-elevated ${
                        done ? (i === reached ? "bg-octa-600 text-white" : "bg-fg text-canvas") : "bg-fg/10"
                      }`}
                    >
                      {done && <Check size={11} strokeWidth={3} />}
                    </span>
                    <p className={`text-[15px] font-medium ${done ? "" : "text-fg-3"}`}>
                      {s.label}
                      {i === reached && <span className="ml-2 text-[13px] font-normal text-fg-3">{ago(lead.at, now)} ago</span>}
                    </p>
                    {i === 0 && <p className="text-[13px] text-fg-2">No website of their own · scored {lead.score}</p>}
                    {i === 1 && done && lead.email && (
                      <>
                        <p className="truncate text-[13px] text-fg-2">{lead.email}</p>
                        <p className="text-[13px] text-fg-3">
                          Listed on{" "}
                          <a
                            href={`https://${lead.emailSource}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-0.5 text-octa-600 hover:underline"
                          >
                            {lead.emailSource} <ExternalLink size={11} strokeWidth={1.5} />
                          </a>
                        </p>
                      </>
                    )}
                    {i === 2 && done && <p className="text-[13px] text-fg-2">First email sent · 2 follow-ups if there&apos;s no reply</p>}
                  </li>
                );
              })}
            </ol>

            {reached >= 2 && (
              <figure className="mt-8 rounded-[18px] bg-elevated p-4 ring-1 ring-hairline">
                <figcaption className="text-[12px] font-medium text-fg-3">
                  {agent.name} wrote · Subject: A website for {lead.name}?
                </figcaption>
                <p className="mt-2 line-clamp-5 whitespace-pre-line text-[14px] leading-[1.5] text-fg-2">
                  Hi there,{"\n\n"}I came across {lead.name} and noticed there&apos;s no website to land on when people search for a{" "}
                  {lead.category.toLowerCase()} nearby. {agent.pitch}
                  {"\n\n"}Want me to put one together?
                </p>
              </figure>
            )}
          </div>

          <div className="flex flex-col gap-2 border-t border-hairline p-4">
            <Link
              href={`/dashboard/sites?prompt=${encodeURIComponent(`A website for ${lead.name}, a ${lead.category.toLowerCase()} at ${lead.address}.`)}`}
              className="flex h-12 items-center justify-center gap-2 rounded-full bg-octa-600 text-[15px] font-medium text-white hover:bg-octa-500 active:bg-octa-700"
            >
              <Sparkles size={16} strokeWidth={1.5} /> Build their site
            </Link>
            {talking && (
              <Link href="/dashboard/agents/inbox" className="flex h-12 items-center justify-center gap-2 rounded-full bg-fg/[.06] text-[15px] font-medium hover:bg-fg/10">
                <MessageCircle size={16} strokeWidth={1.5} /> Open the conversation
              </Link>
            )}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
