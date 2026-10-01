"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Check, Copy, Star } from "lucide-react";

// A business's photo from Google Maps, or its initial on a warm gradient.
export function BusinessPhoto({ src, name, className = "" }: { src: string | null; name: string; className?: string }) {
  const [broken, setBroken] = useState(false);
  if (src && !broken) {
    return (
      // Google's own image host; not worth routing through next/image.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        referrerPolicy="no-referrer"
        loading="lazy"
        onError={() => setBroken(true)}
        className={`object-cover ${className}`}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={`grid place-items-center bg-gradient-to-br from-octa-400 to-octa-700 font-[family-name:var(--font-display)] font-semibold text-white ${className}`}
    >
      {name.replace(/[^a-z0-9]/gi, "").slice(0, 1).toUpperCase() || "·"}
    </span>
  );
}

export function Stars({ rating, size = 13 }: { rating: number; size?: number }) {
  const full = Math.round(rating);
  return (
    <span className="flex text-amber-500" role="img" aria-label={`${rating.toFixed(1)} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={size} strokeWidth={i < full ? 0 : 1.5} fill={i < full ? "currentColor" : "none"} className={i < full ? "" : "opacity-40"} />
      ))}
    </span>
  );
}

// How likely the business is to buy a website (lib/agents/score.ts), as a ring that fills in.
export function ScoreRing({ score, size = 52 }: { score: number; size?: number }) {
  const reduce = useReducedMotion();
  const r = size / 2 - 4;
  const c = 2 * Math.PI * r;
  const tone = score >= 75 ? "text-octa-600" : score >= 50 ? "text-amber-500" : "text-fg-3";
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} title="Potential: how likely this business is to want a website">
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={4} className="stroke-fg/[.08]" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={4}
          strokeLinecap="round"
          stroke="currentColor"
          className={tone}
          strokeDasharray={c}
          initial={reduce ? false : { strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - score / 100) }}
          transition={{ type: "spring", stiffness: 60, damping: 18, delay: 0.15 }}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-[15px] font-semibold tabular-nums">{score}</span>
      <span className="sr-only">Potential {score} out of 100</span>
    </div>
  );
}

// The searching animation: a radar sweep over concentric rings.
export function Radar({ className = "" }: { className?: string }) {
  const reduce = useReducedMotion();
  return (
    <div className={`relative aspect-square rounded-full ${className}`} aria-hidden>
      {[0.33, 0.66, 1].map((s) => (
        <span
          key={s}
          className="absolute inset-0 m-auto rounded-full border border-octa-600/25"
          style={{ width: `${s * 100}%`, height: `${s * 100}%` }}
        />
      ))}
      {!reduce && (
        <motion.span
          className="absolute inset-0 rounded-full"
          style={{
            background: "conic-gradient(from 0deg, transparent 0deg 290deg, color-mix(in oklab, var(--color-octa-500) 38%, transparent) 360deg)",
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
        />
      )}
      <span className="absolute inset-0 m-auto size-3 rounded-full bg-octa-600 shadow-glow" />
    </div>
  );
}

export function CopyButton({ value, label }: { value: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        navigator.clipboard?.writeText(value).then(() => {
          setDone(true);
          setTimeout(() => setDone(false), 1400);
        });
      }}
      aria-label={done ? "Copied" : `Copy ${label}`}
      className="grid size-8 shrink-0 place-items-center rounded-full text-fg-3 transition-colors hover:bg-fg/[.06] hover:text-fg"
    >
      {done ? <Check size={15} strokeWidth={2} className="text-emerald-600" /> : <Copy size={14} strokeWidth={1.5} />}
    </button>
  );
}

export const placeLine = (city: string | null, region?: string | null) => [city, region].filter(Boolean).join(", ");
