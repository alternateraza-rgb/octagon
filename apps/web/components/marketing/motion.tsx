"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

const spring = { type: "spring" as const, stiffness: 70, damping: 18 };

/** Fade + rise on first scroll into view. */
export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ ...spring, delay }}
    >
      {children}
    </motion.div>
  );
}

/** Headline that rises line-by-line out of a mask. Split lines with "\n". */
export function RevealText({
  text,
  as = "h2",
  className,
  delay = 0,
  once = true,
}: {
  text: string;
  as?: "h1" | "h2" | "h3" | "p";
  className?: string;
  delay?: number;
  once?: boolean;
}) {
  const reduce = useReducedMotion();
  const Tag = motion[as];
  const lines = text.split("\n");
  // The trigger lives on the heading itself: the masked lines start clipped, so observing them never fires.
  return (
    <Tag
      className={className}
      aria-label={text.replace(/\n/g, " ")}
      initial={reduce ? false : "hidden"}
      whileInView="show"
      viewport={{ once, margin: "-40px" }}
    >
      {lines.map((line, i) => (
        <span key={i} className="block overflow-hidden pb-[0.08em] -mb-[0.08em]" aria-hidden>
          <motion.span
            className="block"
            variants={{ hidden: { y: "105%" }, show: { y: 0 } }}
            transition={{ type: "spring", stiffness: 60, damping: 16, delay: delay + i * 0.08 }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}

/** Wipes content in from the bottom edge — the "cut-in" used for template thumbnails. */
export function CutIn({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { clipPath: "inset(100% 0% 0% 0%)", y: 24 }}
      whileInView={{ clipPath: "inset(0% 0% 0% 0%)", y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

/** Tiny square registration marks on the corners of a frame (Base44's "crop marks"). */
export function CropMarks({ className = "bg-[#0f0f0f]" }: { className?: string }) {
  const c = `absolute size-[5px] ${className}`;
  return (
    <>
      <span className={`${c} -left-[3px] -top-[3px]`} />
      <span className={`${c} -right-[3px] -top-[3px]`} />
      <span className={`${c} -bottom-[3px] -left-[3px]`} />
      <span className={`${c} -bottom-[3px] -right-[3px]`} />
    </>
  );
}
