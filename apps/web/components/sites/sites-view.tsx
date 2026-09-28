"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, Copy, ExternalLink, MoreHorizontal, Pencil, Search, Trash2 } from "lucide-react";
import { NewSiteForm } from "@/components/builder/new-site-form";
import { Checklist } from "@/components/onboarding/checklist";
import { ConfirmDialog } from "@/components/ui/confirm";
import { useToast } from "@/components/ui/toast";
import type { SiteSummary } from "@/lib/sites/store";

type Filter = "all" | "live" | "drafts";
const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "live", label: "Live" },
  { id: "drafts", label: "Drafts" },
];

const relative = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
function ago(ms: number, now: number) {
  const minutes = Math.round((ms - now) / 60000);
  if (Math.abs(minutes) < 60) return relative.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return relative.format(hours, "hour");
  return relative.format(Math.round(hours / 24), "day");
}

export function SitesView({
  sites: initialSites,
  domain,
  initialPrompt,
  now,
}: {
  sites: SiteSummary[];
  domain: string;
  initialPrompt?: string;
  now: number;
}) {
  const reduce = useReducedMotion();
  const [sites, setSites] = useState(initialSites);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sites.filter(
      (s) =>
        (filter === "all" || (filter === "live" ? !!s.deployedVersionId : !s.deployedVersionId)) &&
        (!q || `${s.title ?? ""} ${s.prompt} ${s.slug ?? ""}`.toLowerCase().includes(q)),
    );
  }, [sites, query, filter]);

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-[1120px] px-5 pb-24 pt-12 sm:pt-16">
        <motion.h1
          initial={reduce ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 90, damping: 18 }}
          className="font-[family-name:var(--font-display)] text-[44px] font-semibold leading-[1] tracking-[-0.045em] sm:text-[56px]"
        >
          Websites
        </motion.h1>
        <motion.p
          initial={reduce ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 90, damping: 18, delay: 0.06 }}
          className="mt-3 text-[17px] text-fg-2"
        >
          Describe a business. Octacore designs, builds and hosts the site.
        </motion.p>
        <motion.div
          id="new"
          initial={reduce ? false : { opacity: 0, y: 16, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 80, damping: 18, delay: 0.12 }}
          className="relative mt-9 max-w-[760px] sm:pb-28"
        >
          <NewSiteForm initialPrompt={initialPrompt} autoFocus={!sites.length || !!initialPrompt} />
        </motion.div>

        <Checklist className="mb-10 max-w-[760px]" />

        {sites.length > 0 && (
          <>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <h2 className="mr-auto text-[21px] font-semibold tracking-[-0.02em]">
                Your sites <span className="ml-1 text-[15px] font-normal text-fg-3">{sites.length}</span>
              </h2>
              <label className="flex h-11 w-full items-center gap-2 rounded-full bg-elevated px-4 ring-1 ring-hairline focus-within:ring-2 focus-within:ring-octa-600 sm:w-[240px]">
                <Search size={16} strokeWidth={1.75} className="text-fg-3" />
                <span className="sr-only">Search websites</span>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search"
                  className="min-w-0 flex-1 bg-transparent text-[15px] placeholder:text-fg-3 focus:outline-none"
                />
              </label>
              <div role="radiogroup" aria-label="Filter" className="flex rounded-full bg-fg/[.06] p-1">
                {FILTERS.map((f) => (
                  <button
                    key={f.id}
                    role="radio"
                    aria-checked={filter === f.id}
                    onClick={() => setFilter(f.id)}
                    className={`relative h-9 rounded-full px-4 text-[14px] font-medium ${filter === f.id ? "text-fg" : "text-fg-2 hover:text-fg"}`}
                  >
                    {filter === f.id && (
                      <motion.span
                        layoutId="sites-filter"
                        className="absolute inset-0 rounded-full bg-elevated shadow-soft"
                        transition={{ type: "spring", stiffness: 420, damping: 34 }}
                      />
                    )}
                    <span className="relative">{f.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <motion.ul layout className="mt-6 grid gap-x-6 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {visible.map((site, i) => (
                  <SiteCard
                    key={site.id}
                    site={site}
                    index={i}
                    domain={domain}
                    now={now}
                    onRenamed={(title) => setSites((all) => all.map((s) => (s.id === site.id ? { ...s, title } : s)))}
                    onDeleted={() => setSites((all) => all.filter((s) => s.id !== site.id))}
                  />
                ))}
              </AnimatePresence>
            </motion.ul>
            {visible.length === 0 && (
              <p className="mt-10 text-center text-[15px] text-fg-3">No websites match “{query || filter}”.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function SiteCard({
  site,
  index,
  domain,
  now,
  onRenamed,
  onDeleted,
}: {
  site: SiteSummary;
  index: number;
  domain: string;
  now: number;
  onRenamed: (title: string) => void;
  onDeleted: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const reduce = useReducedMotion();
  const [menu, setMenu] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [title, setTitle] = useState(site.title ?? "");
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const live = !!site.deployedVersionId && !!site.slug;
  const url = live ? `https://${site.slug}.${domain}` : null;

  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent) => !menuRef.current?.contains(e.target as Node) && setMenu(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menu]);

  async function rename() {
    setRenaming(false);
    const value = title.trim();
    if (!value || value === site.title) return setTitle(site.title ?? "");
    const res = await fetch(`/api/sites/${site.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: value }),
    }).catch(() => null);
    if (res?.ok) {
      onRenamed(value);
      toast.success("Renamed");
    } else toast.error("Couldn't rename that site");
  }

  async function remove() {
    setDeleting(true);
    const res = await fetch(`/api/sites/${site.id}`, { method: "DELETE" }).catch(() => null);
    setDeleting(false);
    setConfirm(false);
    if (res?.ok) {
      onDeleted();
      toast.success("Website deleted");
    } else toast.error("Couldn't delete that site");
  }

  return (
    <motion.li
      layout
      initial={reduce ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 160, damping: 22, delay: Math.min(index, 8) * 0.04 }}
      className="group relative"
    >
      <Link href={`/dashboard/sites/${site.id}`} className="block" aria-label={`Open ${site.title ?? "website"}`}>
        <div className="relative aspect-[16/10] overflow-hidden rounded-[20px] bg-canvas-2 shadow-soft ring-1 ring-hairline transition-all duration-500 ease-[var(--ease-spring)] group-hover:-translate-y-1 group-hover:shadow-float">
          {site.latestVersionId ? (
            <iframe
              src={`/preview/${site.latestVersionId}`}
              title=""
              aria-hidden
              tabIndex={-1}
              loading="lazy"
              sandbox=""
              className="pointer-events-none absolute left-0 top-0 h-[400%] w-[400%] origin-top-left scale-25 bg-white transition-transform duration-700 ease-[var(--ease-spring)] group-hover:scale-[.26]"
            />
          ) : (
            <div className="grid h-full place-items-center">
              <p className="flex items-center gap-2 text-[14px] text-fg-3">
                {site.status === "failed" ? (
                  "Build didn’t finish"
                ) : (
                  <>
                    <span className="size-2 animate-pulse rounded-full bg-octa-600" /> Building…
                  </>
                )}
              </p>
            </div>
          )}
          <div className="absolute inset-0 flex items-end justify-end bg-gradient-to-t from-black/35 via-transparent to-transparent p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <span className="material flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium text-fg shadow-soft">
              Open builder <ArrowUpRight size={14} />
            </span>
          </div>
          {live && (
            <span className="material absolute left-3 top-3 flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-medium text-fg shadow-soft">
              <span className="relative flex size-2">
                <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500/60" />
                <span className="relative size-2 rounded-full bg-emerald-500" />
              </span>
              Live
            </span>
          )}
        </div>
      </Link>

      <div className="mt-3 flex items-start gap-2 px-1">
        <div className="min-w-0 flex-1">
          {renaming ? (
            <input
              autoFocus
              value={title}
              aria-label="Website name"
              onChange={(e) => setTitle(e.target.value)}
              onBlur={rename}
              onKeyDown={(e) => {
                if (e.key === "Enter") rename();
                if (e.key === "Escape") {
                  setTitle(site.title ?? "");
                  setRenaming(false);
                }
              }}
              className="h-8 w-full rounded-[8px] bg-elevated px-2 text-[15px] font-medium ring-2 ring-octa-600 focus:outline-none"
            />
          ) : (
            <p className="truncate text-[15px] font-medium">{title || "New website"}</p>
          )}
          <p className="mt-0.5 truncate text-[13px] text-fg-3">
            {live ? `${site.slug}.${domain}` : site.prompt} · {ago(site.updatedAt, now)}
          </p>
        </div>
        <div ref={menuRef} className="relative">
          <button
            aria-label="More actions"
            aria-haspopup="menu"
            aria-expanded={menu}
            onClick={() => setMenu((m) => !m)}
            className="grid size-9 place-items-center rounded-full text-fg-3 hover:bg-fg/5 hover:text-fg"
          >
            <MoreHorizontal size={18} />
          </button>
          <AnimatePresence>
            {menu && (
              <motion.div
                role="menu"
                initial={reduce ? false : { opacity: 0, scale: 0.95, y: 4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ type: "spring", stiffness: 480, damping: 34 }}
                className="absolute bottom-full right-0 z-30 mb-1 w-[210px] origin-bottom-right bg-elevated rounded-[16px] p-1.5 shadow-float ring-1 ring-hairline"
              >
                <MenuItem
                  close={() => setMenu(false)}
                  icon={ArrowUpRight}
                  label="Open builder"
                  onClick={() => router.push(`/dashboard/sites/${site.id}`)}
                />
                {url && (
                  <MenuItem
                    close={() => setMenu(false)}
                    icon={ExternalLink}
                    label="Visit live site"
                    onClick={() => window.open(url, "_blank", "noopener")}
                  />
                )}
                {url && (
                  <MenuItem
                    close={() => setMenu(false)}
                    icon={Copy}
                    label="Copy link"
                    onClick={async () => {
                      await navigator.clipboard.writeText(url);
                      toast.success("Link copied");
                    }}
                  />
                )}
                <MenuItem close={() => setMenu(false)} icon={Pencil} label="Rename" onClick={() => setRenaming(true)} />
                <div className="my-1 h-px bg-hairline" />
                <MenuItem
                  close={() => setMenu(false)}
                  icon={Trash2}
                  label="Delete"
                  destructive
                  onClick={() => setConfirm(true)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <ConfirmDialog
        open={confirm}
        title={`Delete ${site.title ?? "this website"}?`}
        body={live ? "Its live address stops working straight away. This can’t be undone." : "This can’t be undone."}
        confirmLabel="Delete website"
        destructive
        busy={deleting}
        onConfirm={remove}
        onCancel={() => setConfirm(false)}
      />
    </motion.li>
  );
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  close,
  destructive,
}: {
  icon: typeof Copy;
  label: string;
  onClick: () => void;
  close: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      role="menuitem"
      onClick={() => {
        close();
        onClick();
      }}
      className={`flex h-10 w-full items-center gap-2.5 rounded-[10px] px-2.5 text-[14px] ${
        destructive ? "text-red-600 hover:bg-red-500/10" : "text-fg-2 hover:bg-fg/5 hover:text-fg"
      }`}
    >
      <Icon size={15} strokeWidth={1.75} /> {label}
    </button>
  );
}
