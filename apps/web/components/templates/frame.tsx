"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { TemplateScale } from "./photo";

/** Renders a template at desktop width, scaled down to fit its container — a live, crisp "screenshot". */
export function TemplateFrame({
  children,
  className,
  designWidth = 1280,
}: {
  children: ReactNode;
  className?: string;
  /** Viewport width the template is laid out at: 1280 for desktop, 390 for phone. */
  designWidth?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.25);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setScale(entry.contentRect.width / designWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, [designWidth]);

  return (
    <div ref={ref} className={`relative overflow-hidden ${className ?? ""}`} aria-hidden>
      <div
        className="pointer-events-none absolute left-0 top-0 origin-top-left select-none"
        style={{ width: designWidth, transform: `scale(${scale})` }}
        inert
      >
        <TemplateScale.Provider value={scale}>{children}</TemplateScale.Provider>
      </div>
    </div>
  );
}
