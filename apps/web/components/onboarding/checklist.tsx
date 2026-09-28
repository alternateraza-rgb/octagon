"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight, Check, Compass, X } from "lucide-react";
import { useWorkspace } from "@/components/app/workspace";
import { STEPS, doneCount } from "@/lib/onboarding/steps";

const spring = { type: "spring", stiffness: 260, damping: 26 } as const;

// "Getting started": five real steps from first build to first sale. Ticks come from what the
// account has actually done, so it can't be checked off by hand.
export function Checklist({ className = "" }: { className?: string }) {
  const reduce = useReducedMotion();
  const { onboarding, dismissChecklist, openTour } = useWorkspace();
  const done = doneCount(onboarding);
  const next = STEPS.find((s) => !onboarding.steps[s.id]);
  const complete = !next;

  return (
    <AnimatePresence initial={false}>
      {!onboarding.checklistDismissed && (
        <motion.section
          id="getting-started"
          aria-labelledby="getting-started-title"
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0, marginTop: 0 }}
          transition={spring}
          className={`scroll-mt-6 overflow-hidden rounded-[28px] bg-elevated p-5 shadow-soft ring-1 ring-hairline sm:p-7 ${className}`}
        >
          <div className="flex items-start gap-4">
            <Ring share={done / STEPS.length} />
            <div className="min-w-0 flex-1">
              <h2 id="getting-started-title" className="text-[21px] font-semibold tracking-[-0.02em]">
                {complete ? "You made your first sale" : "Getting started"}
              </h2>
              <p className="mt-0.5 text-[14px] text-fg-3">
                {complete ? "That's the whole loop. Now do it again." : `${done} of ${STEPS.length} done`}
              </p>
            </div>
            <button
              type="button"
              onClick={openTour}
              className="hidden h-11 items-center gap-1.5 rounded-full px-3 text-[14px] text-fg-2 hover:bg-fg/5 hover:text-fg sm:flex"
            >
              <Compass size={16} strokeWidth={1.5} /> Replay tour
            </button>
            <button
              type="button"
              onClick={dismissChecklist}
              aria-label="Hide Getting started"
              title="Hide"
              className="grid size-11 shrink-0 place-items-center rounded-full text-fg-3 hover:bg-fg/5 hover:text-fg"
            >
              <X size={18} strokeWidth={1.5} />
            </button>
          </div>

          <ol className="mt-5 space-y-1">
            {STEPS.map((s, i) => {
              const ticked = onboarding.steps[s.id];
              const current = s.id === next?.id;
              return (
                <li
                  key={s.id}
                  className={`flex items-center gap-4 rounded-[18px] px-3 py-3 transition-colors ${current ? "bg-octa-600/[.07]" : ""}`}
                >
                  <span className="relative grid size-8 shrink-0 place-items-center">
                    <span className={`absolute inset-0 rounded-full ring-[1.5px] ${ticked ? "ring-transparent" : current ? "ring-octa-600" : "ring-fg/20"}`} />
                    <AnimatePresence>
                      {ticked && (
                        <motion.span
                          initial={reduce ? false : { scale: 0.3, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: "spring", stiffness: 500, damping: 20 }}
                          className="absolute inset-0 grid place-items-center rounded-full bg-octa-600 text-white"
                        >
                          <Check size={16} strokeWidth={2.5} />
                        </motion.span>
                      )}
                    </AnimatePresence>
                    {!ticked && <span className="text-[13px] text-fg-3 tabular-nums">{i + 1}</span>}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block text-[16px] ${ticked ? "text-fg-3 line-through decoration-fg/20" : "font-medium"}`}>{s.title}</span>
                    {current && <span className="block text-[14px] text-fg-2">{s.why}</span>}
                  </span>
                  {current && (
                    <Link
                      href={s.href}
                      className="flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-octa-600 px-4 text-[14px] font-medium text-white transition-colors hover:bg-octa-500"
                    >
                      <span className="hidden sm:inline">{s.cta}</span>
                      <ArrowRight size={16} strokeWidth={2} />
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
        </motion.section>
      )}
    </AnimatePresence>
  );
}

function Ring({ share }: { share: number }) {
  const r = 19;
  const c = 2 * Math.PI * r;
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" className="shrink-0 -rotate-90" aria-hidden>
      <circle cx="24" cy="24" r={r} fill="none" strokeWidth="4" className="stroke-fg/10" />
      <motion.circle
        cx="24"
        cy="24"
        r={r}
        fill="none"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={c}
        initial={false}
        animate={{ strokeDashoffset: c * (1 - share) }}
        transition={{ type: "spring", stiffness: 80, damping: 18 }}
        className="stroke-octa-600"
      />
    </svg>
  );
}
