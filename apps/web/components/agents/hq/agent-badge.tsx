"use client";

import { motion, useReducedMotion } from "motion/react";
import type { AgentStatus } from "./types";

// A regular octagon inscribed in a 100×100 box, `inset` in from the edges.
function octagon(inset: number) {
  const r = 50 - inset;
  return Array.from({ length: 8 }, (_, i) => {
    const a = Math.PI / 8 + (i * Math.PI) / 4;
    return `${(50 + r * Math.cos(a)).toFixed(2)},${(50 + r * Math.sin(a)).toFixed(2)}`;
  }).join(" ");
}

const OUTER = octagon(3);
const INNER = octagon(14);

// An agent's face: its initial inside the Octacore octagon, with a ring that breathes while it's working,
// sits still when paused, and breaks into dashes when it paused itself.
export function AgentBadge({ name, status, size = 56 }: { name: string; status: AgentStatus; size?: number }) {
  const reduce = useReducedMotion();
  const active = status === "active";
  return (
    <span className="relative inline-grid shrink-0 place-items-center" style={{ width: size, height: size }} aria-hidden>
      {active && !reduce && (
        <motion.svg
          viewBox="0 0 100 100"
          className="absolute inset-0 text-octa-500"
          initial={{ opacity: 0.55, scale: 1 }}
          animate={{ opacity: 0, scale: 1.28 }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut" }}
        >
          <polygon points={OUTER} fill="none" stroke="currentColor" strokeWidth={3} />
        </motion.svg>
      )}
      <svg viewBox="0 0 100 100" className="absolute inset-0">
        <polygon
          points={OUTER}
          fill="none"
          strokeWidth={3.5}
          strokeLinejoin="round"
          strokeDasharray={status === "auto_paused" ? "7 6" : undefined}
          className={active ? "stroke-octa-600" : status === "auto_paused" ? "stroke-octa-400" : "stroke-fg-3/50"}
        />
        <polygon
          points={INNER}
          strokeLinejoin="round"
          className={active ? "fill-octa-600" : "fill-fg/[.08]"}
        />
      </svg>
      <span
        className={`relative font-[family-name:var(--font-display)] font-semibold tracking-[-0.04em] ${active ? "text-white" : "text-fg-2"}`}
        style={{ fontSize: size * 0.36 }}
      >
        {name.slice(0, 1)}
      </span>
    </span>
  );
}
