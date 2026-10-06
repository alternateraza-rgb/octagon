"use client";

import { motion, useReducedMotion } from "motion/react";

export function ProgressRing({ share, size = 120, stroke = 10, label }: { share: number; size?: number; stroke?: number; label: string }) {
  const reduce = useReducedMotion();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }} role="img" aria-label={label}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-fg/[.08]" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          className="stroke-octa-600"
          strokeDasharray={c}
          initial={reduce ? false : { strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - share) }}
          transition={{ type: "spring", stiffness: 60, damping: 18, delay: 0.15 }}
        />
      </svg>
      <span className="absolute text-[26px] font-semibold tabular-nums tracking-[-0.03em]">{Math.round(share * 100)}%</span>
    </div>
  );
}
