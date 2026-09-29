"use client";

// The Field: every business an agent has found, pinned on a real map and coloured by how far it has got.
// MapLibre with OpenFreeMap's vector tiles, which need no key. Loaded only in the browser (see agent-hq.tsx).
import "maplibre-gl/dist/maplibre-gl.css";
import maplibregl from "maplibre-gl";
import { useEffect, useRef, useState } from "react";
import { STAGE_DOT, type FieldLead, type Stage } from "./types";

const STYLES = {
  light: "https://tiles.openfreemap.org/styles/positron",
  dark: "https://tiles.openfreemap.org/styles/dark",
};

function pinElement(lead: FieldLead, index: number, animate: boolean) {
  const el = document.createElement("button");
  el.type = "button";
  el.setAttribute("aria-label", lead.name);
  el.className = "agent-pin group grid size-7 place-items-center";
  const dot = document.createElement("span");
  dot.className = `agent-pin-dot block size-3 rounded-full ring-[3px] ring-elevated shadow-soft transition-transform duration-300 ease-[var(--ease-spring)] group-hover:scale-150 ${STAGE_DOT[lead.stage]}`;
  if (animate) {
    dot.style.animation = `agent-pin-drop 600ms var(--ease-spring) both`;
    dot.style.animationDelay = `${Math.min(index, 30) * 35}ms`;
  }
  if (lead.stage === "interested") {
    const halo = document.createElement("span");
    halo.className = "absolute size-3 animate-ping rounded-full bg-octa-500/60 motion-reduce:hidden";
    el.appendChild(halo);
  }
  el.appendChild(dot);
  return el;
}

export default function FieldMap({
  leads,
  center,
  dark,
  selected,
  onSelect,
  reduceMotion,
}: {
  leads: FieldLead[];
  center: [number, number];
  dark: boolean;
  selected: string | null;
  onSelect: (id: string) => void;
  reduceMotion: boolean;
}) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef(new Map<string, { marker: maplibregl.Marker; stage: Stage }>());
  const [ready, setReady] = useState(false);
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    onSelectRef.current = onSelect;
  });

  useEffect(() => {
    if (!box.current) return;
    const m = new maplibregl.Map({
      container: box.current,
      style: dark ? STYLES.dark : STYLES.light,
      center,
      zoom: 11.2,
      attributionControl: { compact: true },
      dragRotate: false,
      pitchWithRotate: false,
      cooperativeGestures: true,
    });
    m.touchZoomRotate.disableRotation();
    // Keep the city clear of the stage filter above and, on wide screens, the Live panel on the right.
    m.setPadding({ top: 56, right: window.matchMedia("(min-width: 1024px)").matches ? 356 : 0, bottom: 0, left: 0 });
    m.on("load", () => {
      // Start the credits folded into their ⓘ button so they don't cover the controls on small screens.
      box.current?.querySelector(".maplibregl-ctrl-attrib")?.classList.remove("maplibregl-compact-show");
      setReady(true);
    });
    map.current = m;
    const pins = markers.current;
    return () => {
      pins.forEach(({ marker }) => marker.remove());
      pins.clear();
      m.remove();
      map.current = null;
    };
    // The map is made once; center and theme changes are applied below without rebuilding it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    map.current?.setStyle(dark ? STYLES.dark : STYLES.light);
  }, [dark]);

  useEffect(() => {
    if (!ready) return;
    map.current?.flyTo({ center, zoom: 11.2, duration: reduceMotion ? 0 : 1200 });
  }, [center, ready, reduceMotion]);

  // Add pins for new leads (they drop in), repaint pins whose stage changed, and drop the rest.
  useEffect(() => {
    const m = map.current;
    if (!m || !ready) return;
    const pins = markers.current;
    const seen = new Set<string>();
    leads.forEach((lead, i) => {
      seen.add(lead.id);
      const had = pins.get(lead.id);
      if (had && had.stage === lead.stage) return;
      had?.marker.remove();
      const el = pinElement(lead, i, !reduceMotion);
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        onSelectRef.current(lead.id);
      });
      const marker = new maplibregl.Marker({ element: el }).setLngLat([lead.lng, lead.lat]).addTo(m);
      pins.set(lead.id, { marker, stage: lead.stage });
    });
    for (const [id, { marker }] of pins) {
      if (!seen.has(id)) {
        marker.remove();
        pins.delete(id);
      }
    }
  }, [leads, ready, reduceMotion]);

  useEffect(() => {
    for (const [id, { marker }] of markers.current) {
      marker.getElement().toggleAttribute("data-selected", id === selected);
    }
    const lead = leads.find((l) => l.id === selected);
    if (lead && map.current) map.current.easeTo({ center: [lead.lng, lead.lat], duration: reduceMotion ? 0 : 600 });
  }, [selected, leads, reduceMotion]);

  return (
    <>
      {/* MapLibre makes its container position: relative, so it fills a positioned wrapper. */}
      <div className="absolute inset-0">
        <div ref={box} className="size-full" />
      </div>
      <style>{`
        @keyframes agent-pin-drop {
          0% { transform: translateY(-18px) scale(.4); opacity: 0; }
          100% { transform: none; opacity: 1; }
        }
        .agent-pin[data-selected] .agent-pin-dot { transform: scale(1.8); box-shadow: var(--shadow-glow); }
        .maplibregl-ctrl-attrib { font-size: 11px; background: var(--material) !important; border-radius: 999px !important; }
        .maplibregl-ctrl-attrib a { color: var(--fg-2) !important; }
      `}</style>
    </>
  );
}
