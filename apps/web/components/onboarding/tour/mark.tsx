"use client";

import { motion, useReducedMotion } from "motion/react";
import { BRAND_ORANGE } from "@octacore/ui/logo";

// The Octacore mark (see packages/ui/src/logo.tsx) cut into its eight sides, so it can fly together.
// 128-unit box, outer apothem 60, inner 38, and a 12-unit slot through the top-right side.
const C = 64;
const OUT = 60 / Math.cos(Math.PI / 8);
const IN = 38 / Math.cos(Math.PI / 8);
type Pt = [number, number];
const at = (r: number, deg: number): Pt => [C + r * Math.cos((deg * Math.PI) / 180), C + r * Math.sin((deg * Math.PI) / 180)];

function pieces(): Pt[][] {
  const out: Pt[][] = [];
  for (let k = 0; k < 8; k++) {
    const a0 = 45 * k - 22.5, a1 = 45 * k + 22.5;
    const quad: Pt[] = [at(OUT, a0), at(OUT, a1), at(IN, a1), at(IN, a0)];
    if (k !== 7) {
      out.push(quad);
      continue;
    }
    // The slot runs along -45° (up and to the right), 6 units either side of its centre line.
    const d: Pt = [Math.SQRT1_2, -Math.SQRT1_2];
    const n: Pt = [Math.SQRT1_2, Math.SQRT1_2];
    const slot = (apothem: number, side: number): Pt => [C + apothem * d[0] + side * 6 * n[0], C + apothem * d[1] + side * 6 * n[1]];
    const s0 = Math.sign((quad[0][0] - C) * n[0] + (quad[0][1] - C) * n[1]);
    out.push([quad[0], slot(60, s0), slot(38, s0), quad[3]]);
    out.push([slot(60, -s0), quad[1], quad[2], slot(38, -s0)]);
  }
  return out;
}

const PIECES = pieces();
const points = (p: Pt[]) => p.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
const outline = Array.from({ length: 8 }, (_, k) => at(OUT, 45 * k + 22.5));

export function AssemblingMark({ size = 220 }: { size?: number }) {
  const reduce = useReducedMotion();
  return (
    <svg width={size} height={size} viewBox="-24 -24 176 176" role="img" aria-label="Octacore" className="overflow-visible">
      {/* A shockwave once the pieces lock together. */}
      {!reduce && (
        <motion.polygon
          points={points(outline)}
          fill="none"
          stroke={BRAND_ORANGE}
          strokeWidth={1.5}
          style={{ transformBox: "fill-box", transformOrigin: "center" }}
          initial={{ scale: 1, opacity: 0 }}
          animate={{ scale: [1, 1.7], opacity: [0.9, 0] }}
          transition={{ delay: 1.35, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        />
      )}
      {PIECES.map((poly, i) => {
        const [cx, cy] = poly.reduce<Pt>((s, [x, y]) => [s[0] + x / poly.length, s[1] + y / poly.length], [0, 0]);
        const dx = cx - C, dy = cy - C, len = Math.hypot(dx, dy) || 1;
        return (
          <motion.polygon
            key={i}
            points={points(poly)}
            fill={BRAND_ORANGE}
            // A hairline of the same colour closes anti-aliasing seams where the pieces meet.
            stroke={BRAND_ORANGE}
            strokeWidth={0.6}
            strokeLinejoin="round"
            style={{ transformBox: "fill-box", transformOrigin: "center" }}
            initial={reduce ? false : { x: (dx / len) * 150, y: (dy / len) * 150, rotate: (i % 2 ? 1 : -1) * (90 + i * 25), opacity: 0 }}
            animate={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 90, damping: 14, delay: 0.15 + i * 0.07 }}
          />
        );
      })}
    </svg>
  );
}
