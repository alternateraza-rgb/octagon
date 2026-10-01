"use client";

import { forwardRef } from "react";
import { motion, useReducedMotion, type PanInfo } from "motion/react";
import { Check, Mail, MapPin, Phone, Plus, X } from "lucide-react";
import type { Card } from "@/lib/agents/deck";
import { BusinessPhoto, ScoreRing, Stars, placeLine } from "./parts";

export type Decision = "add" | "skip";

// How far a card has to be dragged to count as a choice.
const SWIPE = 110;

// One business in a search, with what makes it worth pitching. Drag right to add, left to skip.
export const BusinessCard = forwardRef<
  HTMLDivElement,
  {
    card: Card;
    index: number;
    busy: boolean;
    // Set just before the card is removed, so it leaves the way it was chosen.
    leaving?: Decision;
    onDecide: (decision: Decision, el: HTMLElement | null) => void;
  }
>(function BusinessCard({ card, index, busy, leaving, onDecide }, ref) {
  const reduce = useReducedMotion();
  const where = placeLine(card.city, card.region);
  const reasons = card.reasons.filter((r) => !/★/.test(r));

  function onDragEnd(e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    if (busy) return;
    const el = (e.target as HTMLElement | null)?.closest("article") ?? null;
    if (info.offset.x > SWIPE || info.velocity.x > 700) onDecide("add", el);
    else if (info.offset.x < -SWIPE || info.velocity.x < -700) onDecide("skip", el);
  }

  return (
    <motion.article
      ref={ref}
      layout
      custom={index}
      variants={{
        hidden: { opacity: 0, y: 36, scale: 0.96 },
        shown: (i: number) => ({ opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 160, damping: 20, delay: i * 0.08 } }),
      }}
      initial={reduce ? false : "hidden"}
      animate="shown"
      exit={
        reduce
          ? { opacity: 0 }
          : leaving === "add"
            ? { opacity: 0, scale: 0.85, y: -24, transition: { duration: 0.25 } }
            : { opacity: 0, y: 48, rotate: -3, transition: { duration: 0.3 } }
      }
      drag={busy || reduce ? false : "x"}
      dragSnapToOrigin
      dragElastic={0.5}
      onDragEnd={onDragEnd}
      whileDrag={{ rotate: 0, cursor: "grabbing" }}
      className="group relative flex cursor-grab flex-col overflow-hidden rounded-[28px] bg-elevated shadow-soft ring-1 ring-hairline active:cursor-grabbing dark:shadow-none"
      aria-label={card.name}
    >
      <div className="relative h-40 shrink-0 overflow-hidden">
        <BusinessPhoto src={card.photoUrl} name={card.name} className="pointer-events-none size-full text-[56px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" />
        <div className="absolute inset-x-4 bottom-3 flex items-end justify-between gap-3 text-white">
          {card.rating ? (
            <span className="flex items-center gap-1.5 whitespace-nowrap rounded-full bg-black/35 px-2.5 py-1 text-[13px] font-medium backdrop-blur-md">
              <Stars rating={card.rating} size={12} />
              <span className="tabular-nums">
                {card.rating.toFixed(1)} · {card.reviewCount.toLocaleString("en-US")}
              </span>
            </span>
          ) : (
            <span />
          )}
          <span className="whitespace-nowrap rounded-full bg-white/90 px-2.5 py-1 text-[12px] font-semibold text-octa-700">
            {card.webPresence === "none" ? "No website" : "Social page only"}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-[19px] font-semibold leading-tight tracking-[-0.015em] text-balance">{card.name}</h3>
            <p className="mt-1 truncate text-[14px] text-fg-2">
              {card.category ?? "Local business"}
              {where && (
                <>
                  {" · "}
                  <MapPin size={12} strokeWidth={1.75} className="mb-0.5 inline" /> {where}
                </>
              )}
            </p>
          </div>
          <ScoreRing score={card.score} size={48} />
        </div>

        {card.snippet && (
          <blockquote className="mt-4 line-clamp-3 border-l-2 border-octa-600/40 pl-3 text-[14px] leading-[1.5] text-fg-2">
            &ldquo;{card.snippet}&rdquo;
          </blockquote>
        )}

        <div className="mt-4 flex flex-wrap gap-1.5">
          {reasons.map((r) => (
            <span key={r} className="rounded-full bg-fg/[.06] px-2.5 py-1 text-[12px] text-fg-2">
              {r}
            </span>
          ))}
        </div>

        <ul className="mt-4 space-y-1.5 text-[14px]">
          {card.phone && (
            <li className="flex items-center gap-2 text-fg-2">
              <Phone size={14} strokeWidth={1.5} className="text-fg-3" />
              <span className="tabular-nums">{card.phone}</span>
            </li>
          )}
          <li className="flex items-center gap-2 text-fg-2">
            <Mail size={14} strokeWidth={1.5} className="text-fg-3" />
            {card.email ? (
              <span className="truncate">{card.email}</span>
            ) : (
              <span className="text-fg-3">{card.contactStatus === "none" ? "No public email" : "Octa finds this when you add it"}</span>
            )}
          </li>
        </ul>

        <div className="mt-auto flex gap-2 pt-5">
          <button
            type="button"
            disabled={busy}
            onClick={(e) => onDecide("skip", e.currentTarget.closest("article"))}
            className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-fg/[.06] text-[15px] font-medium text-fg-2 transition-colors hover:bg-fg/[.1] hover:text-fg disabled:opacity-50"
          >
            <X size={16} strokeWidth={1.75} /> Skip
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={(e) => onDecide("add", e.currentTarget.closest("article"))}
            className="flex h-11 flex-[1.4] items-center justify-center gap-1.5 rounded-full bg-octa-600 text-[15px] font-medium text-white transition-colors hover:bg-octa-500 disabled:opacity-50"
          >
            {busy ? <Check size={16} strokeWidth={2} /> : <Plus size={16} strokeWidth={2} />} Add to businesses
          </button>
        </div>
      </div>
    </motion.article>
  );
});
