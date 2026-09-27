"use client";

import { useEffect, useRef, useState } from "react";

// Reveals streamed text at a steady pace instead of in network-sized bursts. The further behind
// it falls, the faster it types, so it never lags much behind the model.
export function useSmoothText(target: string, animate: boolean) {
  const [length, setLength] = useState(animate ? 0 : target.length);
  const shown = useRef(length);

  useEffect(() => {
    if (!animate) {
      shown.current = target.length;
      const id = requestAnimationFrame(() => setLength(target.length));
      return () => cancelAnimationFrame(id);
    }
    let frame = 0;
    const tick = () => {
      const backlog = target.length - shown.current;
      if (backlog <= 0) return;
      shown.current += Math.max(1, Math.ceil(backlog / 14));
      setLength(shown.current);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, animate]);

  return { text: target.slice(0, length), done: length >= target.length };
}
