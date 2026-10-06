"use client";

import { motion, useReducedMotion } from "motion/react";
import { Check, Quote, TrendingUp } from "lucide-react";
import type { PracticeCall } from "@/lib/academy/store";
import { ScoreBadge } from "./academy-home";

// The result of a practice call: overall score, the five rubric scores, and what to change.
export function Scorecard({ call, onAgain }: { call: PracticeCall; onAgain: () => void }) {
  const reduce = useReducedMotion();
  const f = call.feedback;
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 120, damping: 20 }}
      className="space-y-3"
    >
      <div className="flex flex-wrap items-center gap-6 rounded-[28px] bg-elevated p-6 shadow-soft ring-1 ring-hairline sm:p-8">
        <ScoreBadge score={call.score} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium text-fg-3">
            {call.prospectName} · {Math.floor(call.durationSec / 60)}:{String(call.durationSec % 60).padStart(2, "0")}
          </p>
          <p className="mt-1 text-balance text-[24px] font-semibold leading-[1.2] tracking-[-0.02em]">{f.summary}</p>
          {f.outcome && <p className="mt-2 text-[15px] text-fg-2">Outcome: {f.outcome}</p>}
        </div>
        <button onClick={onAgain} className="flex h-11 items-center rounded-full bg-octa-600 px-5 text-[15px] font-medium text-white hover:bg-octa-500">
          Call again
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-[1.1fr_1fr]">
        <div className="rounded-[24px] bg-elevated p-6 shadow-soft ring-1 ring-hairline">
          <ul className="space-y-4">
            {f.categories.map((c, i) => (
              <li key={c.id}>
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-[15px] font-semibold">{c.label}</p>
                  <p className="text-[14px] font-medium tabular-nums text-fg-2">{c.score}/10</p>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-fg/[.07]">
                  <motion.div
                    initial={reduce ? false : { width: 0 }}
                    animate={{ width: `${c.score * 10}%` }}
                    transition={{ type: "spring", stiffness: 70, damping: 18, delay: 0.1 + 0.06 * i }}
                    className={`h-full rounded-full ${c.score >= 7 ? "bg-emerald-500" : c.score >= 5 ? "bg-amber-500" : "bg-red-500"}`}
                  />
                </div>
                {c.note && <p className="mt-1.5 text-[14px] text-fg-2">{c.note}</p>}
              </li>
            ))}
            <li>
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-[15px] font-semibold">You talked</p>
                <p className="text-[14px] font-medium tabular-nums text-fg-2">{Math.round(f.talkRatio * 100)}%</p>
              </div>
              <p className="mt-1 text-[14px] text-fg-2">
                {f.talkRatio > 0.6 ? "Too much. Aim for under half, and ask more questions." : "Good balance. Keep letting them talk."}
              </p>
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          {f.wins.length > 0 && (
            <div className="rounded-[24px] bg-emerald-500/[.08] p-6">
              <p className="text-[15px] font-semibold">What worked</p>
              <ul className="mt-3 space-y-2">
                {f.wins.map((w) => (
                  <li key={w} className="flex gap-2.5 text-[15px] leading-[1.45]">
                    <Check size={17} strokeWidth={2} className="mt-0.5 shrink-0 text-emerald-600" /> {w}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {f.fixes.length > 0 && (
            <div className="rounded-[24px] bg-octa-600/[.07] p-6">
              <p className="text-[15px] font-semibold">Work on</p>
              <ul className="mt-3 space-y-2">
                {f.fixes.map((w) => (
                  <li key={w} className="flex gap-2.5 text-[15px] leading-[1.45]">
                    <TrendingUp size={17} strokeWidth={1.75} className="mt-0.5 shrink-0 text-octa-600" /> {w}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {f.betterLine && (
        <div className="rounded-[24px] bg-elevated p-6 shadow-soft ring-1 ring-hairline">
          <p className="flex items-center gap-2 text-[15px] font-semibold">
            <Quote size={16} strokeWidth={1.75} className="text-octa-600" /> Your weakest moment
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div>
              <p className="text-[12px] font-medium uppercase tracking-[0.06em] text-fg-3">They said</p>
              <p className="mt-1 text-[15px]">“{f.betterLine.they}”</p>
            </div>
            <div>
              <p className="text-[12px] font-medium uppercase tracking-[0.06em] text-fg-3">You said</p>
              <p className="mt-1 text-[15px] text-fg-2">“{f.betterLine.you}”</p>
            </div>
            <div className="rounded-[16px] bg-octa-600/[.07] p-3">
              <p className="text-[12px] font-medium uppercase tracking-[0.06em] text-octa-600">Try instead</p>
              <p className="mt-1 text-[15px] font-medium">“{f.betterLine.instead}”</p>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
