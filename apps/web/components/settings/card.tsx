"use client";

import { motion, useReducedMotion } from "motion/react";

// One settings section.
export function Card({
  id,
  title,
  description,
  children,
  tone,
}: {
  id: string;
  title: string;
  description: string;
  children: React.ReactNode;
  tone?: "danger";
}) {
  const reduce = useReducedMotion();
  return (
    <motion.section
      id={id}
      initial={reduce ? false : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ type: "spring", stiffness: 110, damping: 20 }}
      className={`scroll-mt-6 rounded-[24px] bg-elevated p-6 shadow-soft ring-1 sm:p-8 ${tone === "danger" ? "ring-red-500/25" : "ring-hairline"}`}
    >
      <h2 className={`text-[21px] font-semibold tracking-[-0.02em] ${tone === "danger" ? "text-red-600" : ""}`}>{title}</h2>
      <p className="mt-1 text-[15px] text-fg-2">{description}</p>
      <div className="mt-6">{children}</div>
    </motion.section>
  );
}
