"use client";

import { motion, useReducedMotion } from "motion/react";

// The voice indicator: a soft orange orb that breathes while listening and pulses while speaking.
export function VoiceOrb({ size = 120, active, speaking }: { size?: number; active: boolean; speaking: boolean }) {
  const reduce = useReducedMotion();
  return (
    <span className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }} aria-hidden>
      {active && !reduce && (
        <motion.span
          className="absolute inset-0 rounded-full bg-octa-500/25"
          animate={speaking ? { scale: [1, 1.22, 1], opacity: [0.7, 0.2, 0.7] } : { scale: [1, 1.08, 1], opacity: [0.5, 0.3, 0.5] }}
          transition={{ duration: speaking ? 0.9 : 2.6, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      <motion.span
        className="relative rounded-full"
        style={{
          width: size * 0.78,
          height: size * 0.78,
          background: "radial-gradient(circle at 35% 30%, var(--color-octa-400), var(--color-octa-600) 55%, var(--color-octa-800))",
        }}
        animate={reduce || !active ? {} : speaking ? { scale: [1, 1.06, 0.98, 1.04, 1] } : { scale: [1, 1.02, 1] }}
        transition={{ duration: speaking ? 0.7 : 2.6, repeat: Infinity, ease: "easeInOut" }}
      />
    </span>
  );
}
