"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, Check, Clock, Phone } from "lucide-react";
import { ProgressRing } from "./progress-ring";

export type HomeModule = {
  id: string;
  title: string;
  tagline: string;
  lessons: { id: string; title: string; summary: string; minutes: number; done: boolean }[];
};

const when = new Intl.DateTimeFormat("en", { month: "short", day: "numeric" });

// The Academy's front page: overall progress, where to pick up, the six modules and practice calls.
export function AcademyHome({
  modules,
  calls,
}: {
  modules: HomeModule[];
  calls: { id: string; prospectName: string; score: number; createdAt: number }[];
}) {
  const reduce = useReducedMotion();
  const lessons = modules.flatMap((m, i) => m.lessons.map((l) => ({ ...l, module: m, index: i })));
  const done = lessons.filter((l) => l.done).length;
  const next = lessons.find((l) => !l.done);
  const best = calls.reduce((n, c) => Math.max(n, c.score), 0);
  const appear = (i: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 16 },
          animate: { opacity: 1, y: 0 },
          transition: { type: "spring" as const, stiffness: 120, damping: 20, delay: 0.05 * i },
        };

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-[1120px] px-5 pb-24 pt-12 sm:pt-16">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <div className="max-w-[640px]">
            <p className="text-[15px] font-medium text-octa-600">Octacore Academy</p>
            <motion.h1
              initial={reduce ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 90, damping: 18 }}
              className="mt-2 text-balance font-[family-name:var(--font-display)] text-[44px] font-semibold leading-[1] tracking-[-0.045em] sm:text-[56px]"
            >
              From first site to first sale.
            </motion.h1>
            <p className="mt-4 text-[17px] leading-[1.47] text-fg-2">
              Build sites owners want, find the businesses that need them, and learn exactly what to say on the phone. Coach talks you
              through every lesson.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <ProgressRing share={lessons.length ? done / lessons.length : 0} label={`${done} of ${lessons.length} lessons done`} />
            <p className="text-[14px] leading-snug text-fg-2">
              <span className="block text-[17px] font-semibold text-fg tabular-nums">
                {done} of {lessons.length}
              </span>
              lessons done
            </p>
          </div>
        </div>

        <div className="mt-10 grid gap-3 lg:grid-cols-[1.6fr_1fr]">
          {next ? (
            <motion.div {...appear(0)}>
              <Link
                href={`/dashboard/academy/${next.id}`}
                className="group flex h-full flex-col justify-between gap-8 rounded-[28px] bg-octa-600 p-7 text-white shadow-soft sm:p-8"
              >
                <div>
                  <p className="text-[14px] font-medium text-white/75">
                    {done ? "Continue where you left off" : "Start here"} · Module {String(next.index + 1).padStart(2, "0")}
                  </p>
                  <p className="mt-3 text-balance text-[30px] font-semibold leading-[1.1] tracking-[-0.03em] sm:text-[36px]">{next.title}</p>
                  <p className="mt-3 max-w-[520px] text-[16px] leading-[1.5] text-white/80">{next.summary}</p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[14px] text-white/75">
                    <Clock size={15} strokeWidth={1.75} /> {next.minutes} min
                  </span>
                  <span className="grid size-12 place-items-center rounded-full bg-white text-octa-700 transition-transform group-hover:translate-x-1">
                    <ArrowRight size={20} strokeWidth={1.75} />
                  </span>
                </div>
              </Link>
            </motion.div>
          ) : (
            <motion.div {...appear(0)} className="rounded-[28px] bg-octa-600 p-8 text-white shadow-soft">
              <p className="text-[14px] font-medium text-white/75">All lessons done</p>
              <p className="mt-3 text-[32px] font-semibold leading-[1.1] tracking-[-0.03em]">You&apos;ve finished the Academy.</p>
              <p className="mt-3 text-[16px] text-white/80">Keep your calls sharp with practice, and go back to any lesson whenever you need it.</p>
            </motion.div>
          )}

          <motion.div {...appear(1)}>
            <Link
              href="/dashboard/academy/practice"
              className="group flex h-full flex-col justify-between gap-8 rounded-[28px] bg-ink p-7 text-white shadow-soft ring-1 ring-hairline dark:bg-elevated sm:p-8"
            >
              <div>
                <span className="grid size-12 place-items-center rounded-full bg-white/10">
                  <Phone size={20} strokeWidth={1.5} />
                </span>
                <p className="mt-5 text-[24px] font-semibold leading-[1.15] tracking-[-0.02em]">Practise a cold call</p>
                <p className="mt-2 text-[15px] leading-[1.5] text-white/70">
                  Call an AI business owner who pushes back, then get scored on how you handled it.
                </p>
              </div>
              <div className="flex items-center justify-between text-[14px] text-white/70">
                <span>{calls.length ? `Best score ${best}` : "No calls yet"}</span>
                <span className="flex items-center gap-1 font-medium text-white">
                  Start a call <ArrowRight size={16} strokeWidth={1.75} className="transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          </motion.div>
        </div>

        <h2 className="mt-16 text-[28px] font-semibold tracking-[-0.025em]">The course</h2>
        <ol className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((m, i) => {
            const count = m.lessons.filter((l) => l.done).length;
            const first = m.lessons.find((l) => !l.done) ?? m.lessons[0];
            const complete = count === m.lessons.length;
            return (
              <motion.li key={m.id} {...appear(i + 2)} className="flex flex-col rounded-[24px] bg-elevated p-6 shadow-soft ring-1 ring-hairline">
                <div className="flex items-start justify-between">
                  <span className="font-[family-name:var(--font-display)] text-[40px] font-semibold leading-none tracking-[-0.05em] text-fg/15">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {complete && (
                    <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[12px] font-medium text-emerald-700 dark:text-emerald-300">
                      <Check size={13} strokeWidth={2} /> Done
                    </span>
                  )}
                </div>
                <Link href={`/dashboard/academy/${first.id}`} className="mt-4 text-[21px] font-semibold tracking-[-0.02em] hover:text-octa-600">
                  {m.title}
                </Link>
                <p className="mt-1.5 text-[15px] leading-[1.45] text-fg-2">{m.tagline}</p>
                <ul className="mt-5 flex-1 space-y-0.5">
                  {m.lessons.map((l) => (
                    <li key={l.id}>
                      <Link
                        href={`/dashboard/academy/${l.id}`}
                        className="-mx-2 flex min-h-11 items-center gap-2.5 rounded-[10px] px-2 text-[14px] text-fg-2 hover:bg-fg/[.04] hover:text-fg"
                      >
                        <span
                          className={`grid size-5 shrink-0 place-items-center rounded-full ${
                            l.done ? "bg-octa-600 text-white" : "ring-[1.5px] ring-inset ring-fg/20"
                          }`}
                        >
                          {l.done && <Check size={12} strokeWidth={2.5} />}
                        </span>
                        <span className="flex-1">{l.title}</span>
                        <span className="text-[12px] tabular-nums text-fg-3">{l.minutes} min</span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-fg/[.07]">
                  <div className="h-full rounded-full bg-octa-600 transition-[width] duration-700" style={{ width: `${(count / m.lessons.length) * 100}%` }} />
                </div>
              </motion.li>
            );
          })}
        </ol>

        {calls.length > 0 && (
          <>
            <h2 className="mt-16 text-[28px] font-semibold tracking-[-0.025em]">Recent practice calls</h2>
            <ul className="mt-5 overflow-hidden rounded-[24px] bg-elevated shadow-soft ring-1 ring-hairline">
              {calls.slice(0, 5).map((c) => (
                <li key={c.id} className="flex items-center gap-4 border-b border-hairline px-5 py-4 last:border-b-0">
                  <ScoreBadge score={c.score} />
                  <p className="min-w-0 flex-1 truncate text-[16px] font-medium">{c.prospectName}</p>
                  <span className="text-[13px] text-fg-3">{when.format(c.createdAt)}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

export function ScoreBadge({ score, size = "sm" }: { score: number; size?: "sm" | "lg" }) {
  const tone =
    score >= 75
      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
      : score >= 50
        ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
        : "bg-red-500/12 text-red-700 dark:text-red-300";
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full font-semibold tabular-nums ${tone} ${
        size === "lg" ? "size-24 text-[34px] tracking-[-0.03em]" : "size-11 text-[15px]"
      }`}
    >
      {score}
    </span>
  );
}
