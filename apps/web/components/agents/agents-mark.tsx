"use client";

import { useId, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { BRAND_ORANGE, CORE, INNER, OUTER, OctaAgentsMark } from "@octacore/ui/logo";

const SPIN = { type: "spring", stiffness: 90, damping: 14, mass: 0.9 } as const;
// Rotations and scales in SVG need their origin set in the 128-unit grid, not the element's box.
const CENTER = { transformOrigin: "64px 64px", transformBox: "view-box" } as const;

// The Octa Agents mark, arriving: the ring turns into place, the core pops in, and a ping goes out,
// like Octa finding something. Plays each time the page opens, and again on click.
export function AgentsMark({ size = 56 }: { size?: number }) {
  const reduce = useReducedMotion();
  const mask = useId();
  const [play, setPlay] = useState(0);
  if (reduce) return <OctaAgentsMark size={size} />;
  return (
    <button
      type="button"
      onClick={() => setPlay((p) => p + 1)}
      aria-label="Octa Agents"
      className="shrink-0 rounded-[14px] outline-offset-4"
    >
      <svg key={play} width={size} height={size} viewBox="0 0 128 128" overflow="visible" aria-hidden>
        <defs>
          <mask id={mask}>
            <polygon points={OUTER} fill="#fff" />
            <polygon points={INNER} fill="#000" />
            <rect x="0" y="-1" width="80" height="12" fill="#000" transform="translate(64 64) rotate(-45)" />
          </mask>
        </defs>
        {/* The ping: an octagon outline that grows out of the ring and fades. */}
        <motion.polygon
          points={OUTER}
          fill="none"
          stroke={BRAND_ORANGE}
          strokeWidth={4}
          style={CENTER}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: [0.6, 1.45], opacity: [0, 0.55, 0] }}
          transition={{ duration: 1.1, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
        />
        <motion.g
          style={CENTER}
          initial={{ rotate: -135, scale: 0.7, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          transition={{ ...SPIN, opacity: { duration: 0.2 } }}
        >
          <rect width="128" height="128" fill={BRAND_ORANGE} mask={`url(#${mask})`} />
        </motion.g>
        <motion.polygon
          points={CORE}
          fill={BRAND_ORANGE}
          style={CENTER}
          initial={{ scale: 0, rotate: 45 }}
          animate={{ scale: [0, 1.25, 1], rotate: 0 }}
          transition={{ duration: 0.55, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
    </button>
  );
}
