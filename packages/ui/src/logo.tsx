import { useId } from "react";

/** Octacore brand orange, sampled from the master logo. */
export const BRAND_ORANGE = "#B44B23";

/** Points of a regular octagon with flat sides, centred in the 128-unit logo grid. */
export function octagon(apothem: number, c = 64) {
  const r = apothem / Math.cos(Math.PI / 8);
  return Array.from({ length: 8 }, (_, k) => {
    const a = ((22.5 + 45 * k) * Math.PI) / 180;
    return `${(c + r * Math.cos(a)).toFixed(2)},${(c + r * Math.sin(a)).toFixed(2)}`;
  }).join(" ");
}

export const OUTER = octagon(60);
export const INNER = octagon(38);
/** The Octa Agents core: a solid octagon inside the Octacore ring. */
export const CORE = octagon(17);

/** The Octacore mark: a flat-sided octagonal ring with a 45° slot through its top-right corner. */
export function OctacoreMark({
  size = 28,
  className,
  color = BRAND_ORANGE,
}: {
  size?: number;
  className?: string;
  color?: string;
}) {
  const mask = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 128 128" className={className} role="img" aria-label="Octacore">
      <defs>
        <mask id={mask}>
          <polygon points={OUTER} fill="#fff" />
          <polygon points={INNER} fill="#000" />
          <rect x="0" y="-1" width="80" height="12" fill="#000" transform="translate(64 64) rotate(-45)" />
        </mask>
      </defs>
      <rect width="128" height="128" fill={color} mask={`url(#${mask})`} />
    </svg>
  );
}

/** The Octa Agents mark: the Octacore ring with a solid octagonal core, the agent at work inside it. */
export function OctaAgentsMark({
  size = 28,
  className,
  color = BRAND_ORANGE,
}: {
  size?: number;
  className?: string;
  color?: string;
}) {
  const mask = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 128 128" className={className} role="img" aria-label="Octa Agents">
      <defs>
        <mask id={mask}>
          <polygon points={OUTER} fill="#fff" />
          <polygon points={INNER} fill="#000" />
          <rect x="0" y="-1" width="80" height="12" fill="#000" transform="translate(64 64) rotate(-45)" />
          <polygon points={CORE} fill="#fff" />
        </mask>
      </defs>
      <rect width="128" height="128" fill={color} mask={`url(#${mask})`} />
    </svg>
  );
}

export function OctacoreLogo({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <span className={`inline-flex items-center ${className ?? ""}`} style={{ gap: size * 0.42 }}>
      <OctacoreMark size={size} />
      <span style={{ fontSize: size * 0.82, letterSpacing: "-0.035em" }} className="font-semibold leading-none">
        octacore
      </span>
    </span>
  );
}
