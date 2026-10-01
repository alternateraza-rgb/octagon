"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, Clock, ExternalLink, Mail, MapPin, Pencil, Phone, RotateCcw, Sparkles, Star, Trash2, X } from "lucide-react";
import type { Lead } from "@/lib/agents/store";
import { Compose } from "./compose";
import { BusinessPhoto, CopyButton, ScoreRing, Stars } from "./parts";

type Review = { author: string; authorUrl: string | null; photo: string | null; rating: number | null; text: string; when: string | null; url: string | null };
type Details = { lead: Lead; address: string | null; hours: string[]; reviews: Review[] };

const host = (url: string) => url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

// Everything about one business: contacts (editable), reviews, hours, notes, and the way into the builder.
export function BusinessSheet({
  lead,
  onClose,
  onChange,
  onBuild,
  onRemove,
  building,
  outreachReady,
  onSetupOutreach,
}: {
  lead: Lead | null;
  onClose: () => void;
  onChange: (lead: Lead) => void;
  onBuild: (lead: Lead) => void;
  onRemove: (lead: Lead) => void;
  building: boolean;
  outreachReady: boolean;
  onSetupOutreach: () => void;
}) {
  const reduce = useReducedMotion();
  const id = lead?.id;
  // Keyed by lead, so opening another one starts clean without resetting state in an effect.
  const [loaded, setLoaded] = useState<{ id: string; details?: Details; error?: string } | null>(null);
  const details = loaded && loaded.id === id ? loaded.details : undefined;
  const loadError = loaded && loaded.id === id ? loaded.error : undefined;
  const [editing, setEditing] = useState<{ id: string; field: "email" | "phone"; value: string; error?: string } | null>(null);
  const [hunting, setHunting] = useState(false);
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
        if (res.ok && body?.lead) setLoaded({ id, details: body });
        else setLoaded({ id, error: body?.error ?? "Couldn't load the reviews." });
      })
      .catch(() => !stale && setLoaded({ id, error: "Couldn't load the reviews." }));
    return () => {
      stale = true;
    };
  }, [id]);

  useEffect(() => {
    if (!lead) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !editing && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lead, onClose, editing]);

  async function patch(change: Record<string, unknown>) {
    if (!lead) return null;
    const res = await fetch(`/api/agents/leads/${lead.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(change),
    }).catch(() => null);
    const body = (await res?.json().catch(() => null)) as { lead?: Lead; error?: string } | null;
    if (res?.ok && body?.lead) onChangeRef.current(body.lead);
    return res?.ok ? null : (body?.error ?? "Couldn't save that.");
  }

  async function saveEdit() {
    if (!editing) return;
    const error = await patch({ [editing.field]: editing.value });
    if (error) setEditing({ ...editing, error });
    else setEditing(null);
  }

  async function huntAgain() {
    if (!lead || hunting) return;
    setHunting(true);
    const res = await fetch(`/api/agents/leads/${lead.id}/hunt`, { method: "POST" }).catch(() => null);
    const body = (await res?.json().catch(() => null)) as { lead?: Lead } | null;
    setHunting(false);
    if (body?.lead) onChangeRef.current(body.lead);
  }

  const edit = editing?.id === id ? editing : null;

  return (
    <AnimatePresence>
      {lead && (
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
            aria-labelledby="business-title"
            initial={reduce ? { opacity: 0 } : { x: "100%" }}
            animate={reduce ? { opacity: 1 } : { x: 0 }}
            exit={reduce ? { opacity: 0 } : { x: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
            className="relative flex h-full w-full max-w-[540px] flex-col bg-elevated shadow-float ring-1 ring-hairline"
          >
            <div className="relative h-36 shrink-0 overflow-hidden">
              <BusinessPhoto src={lead.photoUrl} name={lead.name} className="size-full text-[64px]" />
              <div className="absolute inset-0 bg-gradient-to-t from-elevated via-elevated/30 to-transparent" />
              <button
                onClick={onClose}
                aria-label="Close"
                autoFocus
                className="absolute right-4 top-4 grid size-11 place-items-center rounded-full bg-black/35 text-white backdrop-blur-md hover:bg-black/50"
              >
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>

            <div className="-mt-10 flex items-end gap-4 px-6">
              <div className="min-w-0 flex-1">
                <h2 id="business-title" className="text-[26px] font-semibold leading-tight tracking-[-0.02em] text-balance">
                  {lead.name}
                </h2>
                <p className="mt-1 flex items-center gap-2 text-[15px] text-fg-2">
                  {lead.rating ? (
                    <>
                      <Stars rating={lead.rating} />
                      <span className="tabular-nums">
                        {lead.rating.toFixed(1)} · {lead.reviewCount.toLocaleString("en-US")} reviews
                      </span>
                    </>
                  ) : (
                    (lead.category ?? "Local business")
                  )}
                </p>
              </div>
              <ScoreRing score={lead.score} />
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-8 pt-5">
              <div className="flex flex-wrap gap-1.5 text-[12px]">
                {lead.category && <span className="rounded-full bg-fg/[.06] px-2.5 py-1 text-fg-2">{lead.category}</span>}
                {lead.reasons
                  .filter((r) => !/★/.test(r))
                  .map((r) => (
                    <span key={r} className="rounded-full bg-fg/[.06] px-2.5 py-1 text-fg-2">
                      {r}
                    </span>
                  ))}
              </div>

              <section className="mt-6 rounded-[22px] bg-canvas p-2 ring-1 ring-hairline">
                <h3 className="px-3 pb-1 pt-2 text-[13px] font-medium text-fg-3">How to reach them</h3>
                {(["email", "phone"] as const).map((field) =>
                  edit?.field === field ? (
                    <form
                      key={field}
                      onSubmit={(e) => {
                        e.preventDefault();
                        void saveEdit();
                      }}
                      className="flex items-center gap-2 px-2 py-1.5"
                    >
                      <input
                        autoFocus
                        type={field === "email" ? "email" : "tel"}
                        value={edit.value}
                        onChange={(e) => setEditing({ ...edit, value: e.target.value, error: undefined })}
                        onKeyDown={(e) => e.key === "Escape" && setEditing(null)}
                        placeholder={field === "email" ? "name@business.com" : "(555) 555-0123"}
                        aria-label={field === "email" ? "Email" : "Phone"}
                        className="h-11 min-w-0 flex-1 rounded-[12px] bg-elevated px-3 text-[15px] ring-1 ring-hairline outline-none focus:ring-4 focus:ring-octa-600/15"
                      />
                      <button type="submit" className="h-11 rounded-full bg-fg px-4 text-[14px] font-medium text-canvas">
                        Save
                      </button>
                      {edit.error && <span className="sr-only" role="alert">{edit.error}</span>}
                    </form>
                  ) : (
                    <ContactLine
                      key={field}
                      field={field}
                      lead={lead}
                      hunting={hunting}
                      onEdit={() => setEditing({ id: lead.id, field, value: (field === "email" ? lead.email : lead.phone) ?? "" })}
                      onHunt={huntAgain}
                    />
                  ),
                )}
                {edit?.error && <p className="px-3 pb-2 text-[13px] text-red-600 dark:text-red-400">{edit.error}</p>}
                {lead.emailSource && !lead.emailEdited && (
                  <p className="px-3 pb-2 text-[12px] text-fg-3">
                    Email found on{" "}
                    <a href={lead.emailSource} target="_blank" rel="noopener noreferrer" className="underline">
                      {host(lead.emailSource).split("/")[0]}
                    </a>
                    . Double-check it before you send anything.
                  </p>
                )}
              </section>

              <Compose lead={lead} ready={outreachReady} onSetup={onSetupOutreach} onChange={(l) => onChangeRef.current(l)} />

              <ul className="mt-7 space-y-1">
                {(details?.address ?? lead.address) && (
                  <Detail icon={MapPin}>
                    {details?.address ?? lead.address}
                    {lead.mapsUrl && (
                      <a href={lead.mapsUrl} target="_blank" rel="noopener noreferrer" className="ml-2 text-octa-600 hover:underline">
                        Google Maps ›
                      </a>
                    )}
                  </Detail>
                )}
                {lead.socialUrl && (
                  <Detail icon={ExternalLink}>
                    <a href={lead.socialUrl} target="_blank" rel="noopener noreferrer" className="break-all hover:underline">
                      {host(lead.socialUrl)}
                    </a>
                  </Detail>
                )}
              </ul>

              <section className="mt-7">
                <label htmlFor="business-notes" className="text-[15px] font-semibold">
                  Notes
                </label>
                <textarea
                  id="business-notes"
                  key={lead.id}
                  defaultValue={lead.notes ?? ""}
                  onBlur={(e) => e.target.value !== (lead.notes ?? "") && void patch({ notes: e.target.value })}
                  placeholder="Called Tuesday, owner is Maria, call back after 4…"
                  rows={3}
                  className="mt-2 w-full resize-none rounded-[12px] bg-canvas px-3 py-2.5 text-[15px] ring-1 ring-hairline outline-none placeholder:text-fg-3 focus:ring-4 focus:ring-octa-600/15"
                />
              </section>

              {!details && !loadError && <DetailsSkeleton />}
              {loadError && (
                <p role="alert" className="mt-6 rounded-[16px] bg-red-500/10 px-4 py-3 text-[14px] text-red-700 dark:text-red-300">
                  {loadError}
                </p>
              )}

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
                  <h3 className="text-[15px] font-semibold">What customers say</h3>
                  {details.reviews.length ? (
                    <ul className="mt-3 space-y-3">
                      {details.reviews.map((r, i) => (
                        <ReviewCard key={i} review={r} />
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-[14px] text-fg-3">No written reviews yet. The website will leave that section out.</p>
                  )}
                  <p className="mt-4 text-[12px] text-fg-3">
                    Reviews from Google Maps. They appear on the website word for word, credited to each reviewer.
                  </p>
                </section>
              )}
            </div>

            <div className="flex items-center gap-2 border-t border-hairline px-6 py-4">
              <button
                onClick={() => onRemove(lead)}
                className="flex h-11 items-center gap-2 rounded-full px-4 text-[15px] font-medium text-fg-2 hover:bg-fg/[.06] hover:text-fg"
              >
                <Trash2 size={16} strokeWidth={1.5} /> Remove
              </button>
              <button
                onClick={() => onBuild(lead)}
                disabled={building}
                className="ml-auto flex h-11 items-center gap-2 rounded-full bg-octa-600 px-5 text-[15px] font-medium text-white transition-colors hover:bg-octa-500 disabled:opacity-60"
              >
                {lead.siteId ? <ArrowUpRight size={17} strokeWidth={2} /> : <Sparkles size={17} strokeWidth={1.75} />}
                {building ? "Starting…" : lead.siteId ? "Open website" : "Build their website"}
              </button>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}

function ContactLine({
  field,
  lead,
  hunting,
  onEdit,
  onHunt,
}: {
  field: "email" | "phone";
  lead: Lead;
  hunting: boolean;
  onEdit: () => void;
  onHunt: () => void;
}) {
  const value = field === "email" ? lead.email : lead.phone;
  const Icon = field === "email" ? Mail : Phone;
  const searching = field === "email" && (lead.contactStatus === "pending" || hunting);
  return (
    <div className="flex min-h-12 items-center gap-3 rounded-[14px] px-3 hover:bg-fg/[.03]">
      <Icon size={17} strokeWidth={1.5} className="shrink-0 text-fg-3" />
      <div className="min-w-0 flex-1 text-[15px]">
        {searching ? (
          <span className="shimmer-text">Octa is finding their email…</span>
        ) : value ? (
          <a
            href={field === "email" ? `mailto:${value}` : `tel:${value.replace(/[^\d+]/g, "")}`}
            className="block truncate tabular-nums hover:underline"
          >
            {value}
          </a>
        ) : (
          <span className="text-fg-3">{field === "email" ? "No public email found" : "No phone number"}</span>
        )}
      </div>
      {value && !searching && <CopyButton value={value} label={field} />}
      {field === "email" && !value && !searching && lead.contactStatus === "none" && (
        <button
          onClick={onHunt}
          aria-label="Look again"
          title="Look again"
          className="grid size-8 place-items-center rounded-full text-fg-3 hover:bg-fg/[.06] hover:text-fg"
        >
          <RotateCcw size={14} strokeWidth={1.5} />
        </button>
      )}
      <button
        onClick={onEdit}
        aria-label={value ? `Edit ${field}` : `Add ${field}`}
        className="flex h-8 items-center gap-1 rounded-full px-2.5 text-[13px] font-medium text-fg-2 hover:bg-fg/[.06] hover:text-fg"
      >
        <Pencil size={13} strokeWidth={1.5} /> {value ? "Edit" : "Add"}
      </button>
    </div>
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
    <div className="mt-7 space-y-3" aria-hidden>
      <div className="shimmer h-4 w-1/3 rounded-full" />
      <div className="shimmer h-24 rounded-[18px]" />
      <div className="shimmer h-24 rounded-[18px]" />
    </div>
  );
}
