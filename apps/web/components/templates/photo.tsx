"use client";

import Image, { type ImageLoader } from "next/image";
import { createContext, useContext } from "react";

/** Scale a template is rendered at (1 on its own page, ~0.3 inside landing-page thumbnails). */
export const TemplateScale = createContext(1);

const unsplash: ImageLoader = ({ src, width, quality }) =>
  `https://images.unsplash.com/${src}?auto=format&fit=crop&w=${width}&q=${quality ?? 70}`;

/** Unsplash photo sized for where it's shown, so tiny thumbnails don't pull full-size images. */
export function Photo({
  id,
  alt,
  w,
  className,
  priority,
}: {
  id: string;
  alt: string;
  /** Intended display width in template pixels. */
  w: number;
  className?: string;
  priority?: boolean;
}) {
  const scale = useContext(TemplateScale);
  const sizes = scale < 1 ? `${Math.ceil(w * scale)}px` : `(max-width: 768px) 100vw, ${w}px`;
  return (
    <div className={`relative overflow-hidden ${className ?? ""}`}>
      <Image loader={unsplash} src={id} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
    </div>
  );
}
