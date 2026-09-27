"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check } from "lucide-react";
import { OctacoreMark } from "@octacore/ui/logo";
import { STAGES, type BuildProgress } from "@/lib/sites/build-progress";

const spring = { type: "spring" as const, stiffness: 140, damping: 20 };

// Section shapes the wireframe cycles through as sections are written.
const SHAPES = ["cards", "split", "quote", "split-reverse", "grid"] as const;

export function StageLine({ progress }: { progress: BuildProgress }) {
  const reduce = useReducedMotion();
  return (
    <div className="w-full">
      <div className="flex h-6 items-center gap-2.5 overflow-hidden text-[14px] font-medium">
        <motion.span
          animate={reduce ? undefined : { rotate: 360 }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
        >
          <OctacoreMark size={16} />
        </motion.span>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={progress.stage}
            initial={reduce ? false : { y: 14, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -14, opacity: 0 }}
            transition={spring}
            className="shimmer-text"
          >
            {STAGES[progress.stage]}…
          </motion.span>
        </AnimatePresence>
      </div>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-fg/[.08]">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-octa-500 to-octa-700"
          animate={{ width: `${Math.round(progress.progress * 100)}%` }}
          transition={{ type: "spring", stiffness: 60, damping: 20 }}
        />
      </div>
    </div>
  );
}

// First build: a page that assembles itself from what the model has written so far.
export function BuildStage({ progress, siteName }: { progress: BuildProgress; siteName: string }) {
  const reduce = useReducedMotion();
  const [primary = "#c2410c", accent = "#0f0f0f", soft = "#eeeceb"] = progress.colors;
  const block = "shimmer rounded-[10px]";

  return (
    <div className="flex h-full flex-col items-center justify-center gap-8 overflow-hidden px-6 py-8">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 90, damping: 18 }}
        className="relative w-full max-w-[720px] overflow-hidden rounded-[20px] bg-elevated shadow-float ring-1 ring-hairline"
      >
        <div className="flex h-10 items-center gap-2 border-b border-hairline px-4">
          <span className="size-2.5 rounded-full bg-fg/10" />
          <span className="size-2.5 rounded-full bg-fg/10" />
          <span className="size-2.5 rounded-full bg-fg/10" />
          <span className="mx-auto truncate rounded-full bg-fg/[.05] px-4 py-1 text-[11px] text-fg-3">{siteName}</span>
        </div>
        <div className="h-[min(56vh,460px)] space-y-4 overflow-hidden p-5 [mask-image:linear-gradient(to_bottom,black_80%,transparent)]">
          <AnimatePresence>
            {progress.hasNav && (
              <motion.div
                key="nav"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={spring}
                className="flex items-center gap-3"
              >
                <span className="size-5 rounded-[6px]" style={{ background: primary }} />
                <span className={`${block} h-3 w-20`} />
                <span className="ml-auto flex gap-2">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className={`${block} h-2.5 w-10`} />
                  ))}
                </span>
                <span className="h-6 w-16 rounded-full" style={{ background: accent }} />
              </motion.div>
            )}
            {progress.stage >= 2 && (
              <motion.div
                key="hero"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={spring}
                className="grid grid-cols-[1.2fr_1fr] gap-4 rounded-[14px] p-4"
                style={{ background: `${soft}` }}
              >
                <div className="space-y-2.5 py-2">
                  <span className="block h-2 w-16 rounded-full" style={{ background: primary, opacity: 0.8 }} />
                  <span className={`${block} block h-6 w-11/12`} />
                  <span className={`${block} block h-6 w-3/4`} />
                  <span className={`${block} block h-2.5 w-4/5`} />
                  <span className="mt-3 block h-7 w-24 rounded-full" style={{ background: primary }} />
                </div>
                <Photo lit={progress.photos > 0} tint={primary} className="h-full min-h-[120px]" />
              </motion.div>
            )}
            {Array.from({ length: Math.min(progress.sections, 6) }, (_, i) => (
              <motion.div key={`s${i}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={spring}>
                <Section shape={SHAPES[i % SHAPES.length]} lit={progress.photos > i + 1} tint={i % 2 ? accent : primary} />
              </motion.div>
            ))}
            {progress.hasFooter && (
              <motion.div
                key="footer"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-6 rounded-[12px] p-4"
                style={{ background: accent }}
              >
                {[0, 1, 2].map((i) => (
                  <span key={i} className="h-2.5 w-16 rounded-full bg-white/25" />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <div className="flex w-full max-w-[720px] flex-col gap-5 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <StageLine progress={progress} />
        </div>
        <div className="flex shrink-0 items-center gap-4 text-[12px] text-fg-3">
          {progress.colors.length > 0 && (
            <span className="flex items-center gap-1.5">
              {progress.colors.slice(0, 4).map((c) => (
                <motion.span
                  key={c}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={spring}
                  className="size-4 rounded-full ring-1 ring-hairline"
                  style={{ background: c }}
                />
              ))}
            </span>
          )}
          {progress.fonts.map((f) => (
            <motion.span
              key={f}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-full bg-fg/[.06] px-2.5 py-1 font-medium text-fg-2"
            >
              {f}
            </motion.span>
          ))}
        </div>
      </div>
      <ol className="hidden w-full max-w-[720px] grid-cols-6 gap-2 sm:grid" aria-label="Build steps">
        {STAGES.map((s, i) => (
          <li key={s} className={`flex items-center gap-1.5 text-[11px] ${i <= progress.stage ? "text-fg-2" : "text-fg-3/60"}`}>
            <span
              className={`grid size-4 shrink-0 place-items-center rounded-full ${i < progress.stage ? "bg-octa-600 text-white" : i === progress.stage ? "ring-2 ring-octa-600" : "ring-1 ring-hairline"}`}
            >
              {i < progress.stage && <Check size={10} strokeWidth={3} />}
            </span>
            <span className="truncate">{s}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

// Edits: the current page stays in view, softly dimmed, with a light sweep passing over it.
export function EditOverlay({ progress, note }: { progress: BuildProgress; note: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-10 overflow-hidden"
    >
      <div className="absolute inset-0 bg-canvas-2/55 backdrop-blur-[3px]" />
      {!reduce && (
        <motion.div
          className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/30 to-transparent"
          animate={{ x: ["-120%", "320%"] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 160, damping: 20 }}
        className="absolute inset-x-4 bottom-6 mx-auto max-w-[520px] rounded-[20px] bg-elevated p-5 shadow-float ring-1 ring-hairline"
      >
        <StageLine progress={progress} />
        {note && <p className="mt-3 line-clamp-3 text-[14px] leading-[1.5] text-fg-2">{note}</p>}
      </motion.div>
    </motion.div>
  );
}

function Photo({ lit, tint, className = "" }: { lit: boolean; tint: string; className?: string }) {
  return (
    <span
      className={`block overflow-hidden rounded-[10px] transition-[background] duration-700 ${lit ? "" : "shimmer"} ${className}`}
      style={lit ? { background: `linear-gradient(135deg, ${tint}55, ${tint}15 60%, #0000)` } : undefined}
    />
  );
}

function Section({ shape, lit, tint }: { shape: (typeof SHAPES)[number]; lit: boolean; tint: string }) {
  const line = "shimmer block rounded-full";
  if (shape === "cards" || shape === "grid")
    return (
      <div className="space-y-3 px-1">
        <span className={`${line} h-4 w-1/3`} />
        <div className={`grid gap-3 ${shape === "grid" ? "grid-cols-4" : "grid-cols-3"}`}>
          {Array.from({ length: shape === "grid" ? 4 : 3 }, (_, i) => (
            <div key={i} className="space-y-2">
              <Photo lit={lit} tint={tint} className="h-14" />
              <span className={`${line} h-2.5 w-3/4`} />
              <span className={`${line} h-2 w-1/2`} />
            </div>
          ))}
        </div>
      </div>
    );
  if (shape === "quote")
    return (
      <div className="space-y-2 rounded-[12px] px-8 py-5 text-center" style={{ background: `${tint}14` }}>
        <span className={`${line} mx-auto h-3.5 w-4/5`} />
        <span className={`${line} mx-auto h-3.5 w-3/5`} />
        <span className={`${line} mx-auto mt-3 h-2 w-24`} />
      </div>
    );
  return (
    <div className={`grid grid-cols-2 items-center gap-4 px-1 ${shape === "split-reverse" ? "[direction:rtl]" : ""}`}>
      <Photo lit={lit} tint={tint} className="h-24" />
      <div className="space-y-2 [direction:ltr]">
        <span className={`${line} h-4 w-2/3`} />
        <span className={`${line} h-2.5 w-full`} />
        <span className={`${line} h-2.5 w-5/6`} />
        <span className={`${line} h-2.5 w-3/5`} />
      </div>
    </div>
  );
}
