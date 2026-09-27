"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, Bookmark, BookmarkCheck, Clock, ExternalLink, MapPin, Phone, Sparkles, Star, X } from "lucide-react";
import { noticeUpgrade } from "@/lib/billing/client";
import type { Lead } from "@/lib/agents/store";
import { ScoreBadge } from "./score-badge";

type Review = { author: string; authorUrl: string | null; photo: string | null; rating: number | null; text: string; when: string | null; url: string | null };
type Details = { lead: Lead; stillQualifies: boolean; website: string | null; summary: string | null; hours: string[]; reviews: Review[] };

// Fresh details for one lead, from Google, and the way into the builder.
export function LeadSheet({
  lead,
  onClose,
  onChange,
  onSave,
}: {
  lead: Lead | null;
  onClose: () => void;
  onChange: (lead: Lead) => void;
  onSave: (lead: Lead) => void;
}) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const id = lead?.id;
  // Keyed by lead, so opening another lead starts clean without resetting state in an effect.
  const [loaded, setLoaded] = useState<{ id: string; details?: Details; error?: string } | null>(null);
  const [buildState, setBuildState] = useState<{ id: string; building: boolean; error?: string } | null>(null);
  const mine = <T extends { id: string }>(s: T | null) => (s && s.id === id ? s : null);
  const details = mine(loaded)?.details ?? null;
  const building = !!mine(buildState)?.building;
  const error = mine(buildState)?.error || mine(loaded)?.error || "";
  // Kept in a ref so a new callback identity doesn't refetch (each fetch is a billed Google call).
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    if (!id) return;
    let stale = false;
    fetch(`/api/agents/leads/${id}`)
      .then(async (res) => {
        const body = (await res.json().catch(() => null)) as (Details & { error?: string }) | null;
        if (stale) return;
        if (res.ok && body?.lead) {
          setLoaded({ id, details: body });
          onChangeRef.current(body.lead);
        } else setLoaded({ id, error: body?.error ?? "Couldn't load this business." });
      })
      .catch(() => !stale && setLoaded({ id, error: "Couldn't load this business." }));
    return () => {
      stale = true;
    };
  }, [id]);

  useEffect(() => {
    if (!lead) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lead, onClose]);

  async function build() {
    if (!lead || building) return;
    setBuildState({ id: lead.id, building: true });
    const res = await fetch(`/api/agents/leads/${lead.id}/build`, { method: "POST" }).catch(() => null);
    const body = (await res?.json().catch(() => null)) as { id?: string; existing?: boolean; error?: string } | null;
    if (res?.ok && body?.id) {
      onChange({ ...lead, siteId: body.id, status: "built" });
      router.push(body.existing ? `/dashboard/sites/${body.id}` : `/dashboard/sites/${body.id}?new=1`);
      return;
    }
    const shown = noticeUpgrade(res?.status, body);
    setBuildState({ id: lead.id, building: false, error: shown ? undefined : (body?.error ?? "Couldn't start the site. Try again.") });
  }

  const current = details?.lead ?? lead;

  return (
    <AnimatePresence>
      {lead && current && (
        <div className="fixed inset-0 z-[90] flex justify-end">
          <motion.div
            className="absolute inset-0 bg-black/30 backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            role="dialog"
            aria-modal
            aria-labelledby="lead-title"
            initial={reduce ? { opacity: 0 } : { x: "100%" }}
            animate={reduce ? { opacity: 1 } : { x: 0 }}
            exit={reduce ? { opacity: 0 } : { x: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
            className="relative flex h-full w-full max-w-[520px] flex-col bg-elevated shadow-float ring-1 ring-hairline"
          >
            <div className="flex items-start gap-4 px-6 pb-5 pt-6">
              <ScoreBadge score={current.score} />
              <div className="min-w-0 flex-1">
                <h2 id="lead-title" className="text-[24px] font-semibold leading-tight tracking-[-0.02em] text-balance">
                  {current.name}
                </h2>
                <p className="mt-1 text-[15px] text-fg-2">{current.category ?? "Local business"}</p>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                autoFocus
                className="-mr-2 grid size-11 shrink-0 place-items-center rounded-full text-fg-2 hover:bg-fg/5 hover:text-fg"
              >
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-8">
              <div className="flex flex-wrap gap-1.5 text-[12px]">
                {current.reasons.map((r) => (
                  <span key={r} className="rounded-full bg-fg/[.06] px-2.5 py-1 text-fg-2">
                    {r}
                  </span>
                ))}
              </div>

              {details && !details.stillQualifies && (
                <p className="mt-5 rounded-[16px] bg-amber-500/10 px-4 py-3 text-[14px] text-amber-800 dark:text-amber-200">
                  {details.website ? (
                    <>
                      This business has a website now:{" "}
                      <a href={details.website} target="_blank" rel="noopener noreferrer" className="underline">
                        {details.website.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
                      </a>
                    </>
                  ) : (
                    "Google no longer lists this business as open."
                  )}
                </p>
              )}

              <ul className="mt-6 space-y-1">
                {current.phone && (
                  <Detail icon={Phone}>
                    <a href={`tel:${current.phone.replace(/[^\d+]/g, "")}`} className="tabular-nums hover:underline">
                      {current.phone}
                    </a>
                  </Detail>
                )}
                {current.address && (
                  <Detail icon={MapPin}>
                    {current.address}
                    {current.mapsUrl && (
                      <a href={current.mapsUrl} target="_blank" rel="noopener noreferrer" className="ml-2 text-octa-600 hover:underline">
                        Google Maps ›
                      </a>
                    )}
                  </Detail>
                )}
                {current.socialUrl && (
                  <Detail icon={ExternalLink}>
                    <a href={current.socialUrl} target="_blank" rel="noopener noreferrer" className="break-all hover:underline">
                      {current.socialUrl.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
                    </a>
                  </Detail>
                )}
              </ul>

              {!details && !mine(loaded)?.error && <DetailsSkeleton />}
              {error && (
                <p role="alert" className="mt-6 rounded-[16px] bg-red-500/10 px-4 py-3 text-[14px] text-red-700 dark:text-red-300">
                  {error}
                </p>
              )}

              {details?.summary && <p className="mt-6 text-[15px] leading-[1.47] text-fg-2">{details.summary}</p>}

              {!!details?.hours.length && (
                <section className="mt-7">
                  <h3 className="flex items-center gap-2 text-[15px] font-semibold">
                    <Clock size={16} strokeWidth={1.75} className="text-fg-3" /> Opening hours
                  </h3>
                  <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-[14px]">
                    {details.hours.map((line) => {
                      const [day, ...rest] = line.split(": ");
                      return (
                        <div key={day} className="contents">
                          <dt className="text-fg-2">{day}</dt>
                          <dd className="tabular-nums">{rest.join(": ")}</dd>
                        </div>
                      );
                    })}
                  </dl>
                </section>
              )}

              {details && (
                <section className="mt-8">
                  <h3 className="text-[15px] font-semibold">Reviews</h3>
                  {details.reviews.length ? (
                    <ul className="mt-3 space-y-3">
                      {details.reviews.map((r, i) => (
                        <ReviewCard key={i} review={r} />
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-[14px] text-fg-3">No reviews on Google yet — the site will leave that section out.</p>
                  )}
                  <p className="mt-4 text-[12px] text-fg-3">
                    Reviews from{" "}
                    {current.mapsUrl ? (
                      <a href={current.mapsUrl} target="_blank" rel="noopener noreferrer" className="underline">
                        Google Maps
                      </a>
                    ) : (
                      "Google Maps"
                    )}
                    . They appear on the site word for word, credited to each reviewer.
                  </p>
                </section>
              )}
            </div>

            <div className="flex items-center gap-2 border-t border-hairline px-6 py-4">
              <button
                onClick={() => onSave(current)}
                className="flex h-11 items-center gap-2 rounded-full bg-fg/[.06] px-4 text-[15px] font-medium hover:bg-fg/[.1]"
              >
                {current.status === "saved" ? <BookmarkCheck size={17} strokeWidth={1.75} className="text-octa-600" /> : <Bookmark size={17} strokeWidth={1.5} />}
                {current.status === "saved" ? "Saved" : "Save"}
              </button>
              <button
                onClick={build}
                disabled={building}
                className="ml-auto flex h-11 items-center gap-2 rounded-full bg-octa-600 px-5 text-[15px] font-medium text-white transition-colors hover:bg-octa-500 disabled:opacity-60"
              >
                {current.siteId ? <ArrowUpRight size={17} strokeWidth={2} /> : <Sparkles size={17} strokeWidth={1.75} />}
                {building ? "Starting…" : current.siteId ? "Open in builder" : "Build site"}
              </button>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}

function Detail({ icon: Icon, children }: { icon: typeof Phone; children: React.ReactNode }) {
  return (
    <li className="flex gap-3 py-1.5 text-[15px]">
      <Icon size={17} strokeWidth={1.5} className="mt-0.5 shrink-0 text-fg-3" />
      <span className="min-w-0">{children}</span>
    </li>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const stars = Math.round(review.rating ?? 0);
  const name = review.authorUrl ? (
    <a href={review.authorUrl} target="_blank" rel="noopener noreferrer nofollow" className="font-medium hover:underline">
      {review.author}
    </a>
  ) : (
    <span className="font-medium">{review.author}</span>
  );
  return (
    <li className="rounded-[18px] bg-canvas p-4 ring-1 ring-hairline">
      <div className="flex items-center gap-3">
        {review.photo ? (
          // Google's own avatar URL, required for attribution; not worth routing through next/image.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={review.photo} alt="" referrerPolicy="no-referrer" className="size-9 rounded-full object-cover" />
        ) : (
          <span className="grid size-9 place-items-center rounded-full bg-fg/[.08] text-[14px] font-medium">{review.author.slice(0, 1)}</span>
        )}
        <div className="min-w-0 text-[14px]">
          {name}
          <p className="flex items-center gap-2 text-[12px] text-fg-3">
            {stars > 0 && (
              <span className="flex text-amber-500" aria-label={`${stars} out of 5 stars`}>
                {Array.from({ length: stars }, (_, i) => (
                  <Star key={i} size={11} strokeWidth={0} fill="currentColor" />
                ))}
              </span>
            )}
            {review.when}
          </p>
        </div>
      </div>
      {review.text && <p className="mt-3 whitespace-pre-line text-[14px] leading-[1.5]">{review.text}</p>}
      {review.url && (
        <a href={review.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-[12px] text-fg-3 hover:underline">
          View on Google Maps
        </a>
      )}
    </li>
  );
}

function DetailsSkeleton() {
  return (
    <div className="mt-6 animate-pulse space-y-3" aria-hidden>
      <div className="h-4 w-3/4 rounded-full bg-fg/[.07]" />
      <div className="h-4 w-1/2 rounded-full bg-fg/[.07]" />
      <div className="mt-6 h-24 rounded-[18px] bg-fg/[.05]" />
      <div className="h-24 rounded-[18px] bg-fg/[.05]" />
    </div>
  );
}
