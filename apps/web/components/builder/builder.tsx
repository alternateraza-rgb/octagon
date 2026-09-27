"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft, Check, Copy, ExternalLink, Loader2, Monitor, Rocket, Smartphone, Tablet } from "lucide-react";
import { readModelText } from "@/lib/ai/read-events";
import { parseAttachments, type Attachment } from "@/lib/attachments";
import { buildProgress } from "@/lib/sites/build-progress";
import { readNote } from "@/lib/sites/octa-note";
import type { Deployment, Site, VersionSummary } from "@/lib/sites/store";
import { Composer } from "@/components/chat/composer";
import { useToast } from "@/components/ui/toast";
import { useUploads } from "@/components/uploads/use-uploads";
import { BuilderTimeline, type Pending } from "./builder-chat";
import { BuildStage, EditOverlay } from "./build-progress";

type Device = "desktop" | "tablet" | "mobile";
const DEVICES: { id: Device; label: string; icon: typeof Monitor; width: string }[] = [
  { id: "desktop", label: "Desktop", icon: Monitor, width: "100%" },
  { id: "tablet", label: "Tablet", icon: Tablet, width: "820px" },
  { id: "mobile", label: "Phone", icon: Smartphone, width: "390px" },
];

const day = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

type Stream = { instruction: string; attachments: Attachment[]; raw: string };

export function Builder({
  site,
  versions,
  deployments,
  liveUrl,
  sitesDomain,
  latestSize,
  autoStart,
  stalled,
}: {
  site: Site;
  versions: VersionSummary[];
  deployments: Deployment[];
  liveUrl: string | null;
  sitesDomain: string;
  latestSize: number;
  autoStart: boolean;
  stalled: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const reduce = useReducedMotion();
  const [refreshing, startRefresh] = useTransition();
  const [panel, setPanel] = useState<"chat" | "deploys">("chat");
  const [mobileView, setMobileView] = useState<"chat" | "preview">("preview");
  const [device, setDevice] = useState<Device>("desktop");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const uploads = useUploads();
  const [stream, setStream] = useState<Stream | null>(null);
  const [error, setError] = useState("");
  const [deploying, setDeploying] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const started = useRef(false);

  const latest = versions.at(-1) ?? null;
  const selected = versions.find((v) => v.id === selectedId) ?? latest;
  const building = stream !== null || refreshing;
  const number = (id: string) => versions.findIndex((v) => v.id === id) + 1;
  const liveVersion = site.deployedVersionId;

  // What the model has written so far: Octa's note, then the page (which drives the progress view).
  const note = stream ? readNote(stream.raw) : null;
  const progress = buildProgress(note?.html ?? "", latest ? Math.max(latestSize, 6000) : 16000);
  const pending: Pending | null =
    stream && note
      ? {
          instruction: stream.instruction,
          attachments: stream.attachments,
          summary: note.summary,
          noteDone: note.complete,
          progress,
        }
      : null;

  const save = (body: { instruction?: string; text: string; attachments?: string[] } | { failed: true }) =>
    fetch(`/api/sites/${site.id}/versions/save`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });

  async function generate(instruction?: string) {
    if (building) return;
    setError("");
    // Edits carry the files picked for them; the first build uses the ones given with the prompt.
    const attachments = instruction === undefined ? parseAttachments(site.attachments) : uploads.attachments;
    const ids = attachments.map((a) => a.id);
    setStream({ instruction: instruction ?? site.prompt, attachments, raw: "" });
    setInput("");
    uploads.clear();
    setMobileView("preview");
    try {
      const res = await fetch(`/api/sites/${site.id}/versions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ instruction, attachments: ids }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Something went wrong.");
      }
      let text: string;
      try {
        text = await readModelText(res, (raw) => setStream((s) => (s ? { ...s, raw } : s)));
      } catch (e) {
        await save({ failed: true });
        throw e;
      }
      const saved = await save({ instruction, text, attachments: ids });
      if (!saved.ok) {
        const body = (await saved.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Couldn't save that build. Try again.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      // Cleared in the same transition as the refresh, so the new version replaces the live view seamlessly.
      startRefresh(() => {
        setStream(null);
        setSelectedId(null);
        router.refresh();
      });
    }
  }

  function applyChange(value: string) {
    if (!latest || building) return;
    generate(value.trim() || (uploads.attachments.length === 1 ? "Add this file to the site." : "Add these files to the site."));
  }

  async function deploy(versionId?: string) {
    const target = versionId ?? selected?.id;
    if (!target || deploying) return;
    setDeploying(target);
    setError("");
    const res = await fetch(`/api/sites/${site.id}/deploy`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ versionId: target }),
    }).catch(() => null);
    const body = (await res?.json().catch(() => null)) as { url?: string } | null;
    if (res?.ok && body?.url)
      toast.success(versionId ? `Restored version ${number(target)}` : `Live at ${body.url.replace("https://", "")}`);
    else toast.error("Deploy failed. Try again.");
    setDeploying(null);
    startRefresh(() => router.refresh());
  }

  // A brand-new site builds its first version as soon as the builder opens.
  useEffect(() => {
    if (autoStart && versions.length === 0 && !started.current) {
      started.current = true;
      window.history.replaceState(null, "", `/dashboard/sites/${site.id}`);
      generate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const firstBuild = !!stream && !latest;

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-12 shrink-0 items-center justify-center border-b border-hairline lg:hidden">
        <Segmented
          id="mobile-view"
          value={mobileView}
          onChange={setMobileView}
          options={[
            { id: "chat", label: "Chat" },
            { id: "preview", label: "Preview" },
          ]}
        />
      </div>

      <div className="flex min-h-0 flex-1">
        <section
          aria-label="Site conversation"
          className={`${mobileView === "chat" ? "flex" : "hidden"} w-full min-w-0 flex-col border-r border-hairline bg-canvas lg:flex lg:w-[400px] lg:shrink-0`}
        >
          <div className="flex h-14 shrink-0 items-center gap-1 border-b border-hairline px-2">
            <Link
              href="/dashboard/sites"
              aria-label="All websites"
              className="grid size-11 place-items-center rounded-full text-fg-2 hover:bg-fg/5 hover:text-fg"
            >
              <ArrowLeft size={18} strokeWidth={1.5} />
            </Link>
            <h1 className="min-w-0 flex-1 truncate text-[15px] font-semibold tracking-[-0.01em]">
              {site.title ?? "New website"}
            </h1>
            <Segmented
              id="panel"
              value={panel}
              onChange={setPanel}
              options={[
                { id: "chat", label: "Chat" },
                { id: "deploys", label: "Deploys" },
              ]}
            />
          </div>

          {panel === "chat" ? (
            <>
              <BuilderTimeline
                versions={versions}
                pending={pending}
                selectedId={selected?.id ?? null}
                liveVersionId={liveVersion}
                building={building}
                onSelect={(id) => {
                  setSelectedId(id);
                  setMobileView("preview");
                }}
                onSuggestion={(s) => applyChange(s)}
              >
                {versions.length === 0 && !stream && !refreshing && (
                  <EmptyState site={site} stalled={stalled} onRetry={() => generate()} />
                )}
              </BuilderTimeline>
              <div className="shrink-0 p-3">
                <AnimatePresence>
                  {error && (
                    <motion.p
                      role="alert"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mb-2 px-1 text-[13px] text-red-600"
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>
                <Composer
                  id="change-input"
                  label="Describe a change"
                  size="md"
                  placeholder={latest ? "Describe a change, or attach a logo…" : "Your site is being built…"}
                  value={input}
                  onChange={setInput}
                  onSubmit={applyChange}
                  uploads={uploads}
                  busy={building}
                  disabled={!latest}
                />
              </div>
            </>
          ) : (
            <DeploysPanel
              site={site}
              liveUrl={liveUrl}
              liveVersion={liveVersion}
              deployments={deployments}
              deploying={deploying}
              copied={copied}
              sitesDomain={sitesDomain}
              number={number}
              onCopy={async (url) => {
                await navigator.clipboard.writeText(url);
                setCopied(true);
                toast.success("Link copied");
                setTimeout(() => setCopied(false), 1500);
              }}
              onRestore={deploy}
              onAddressSaved={() => startRefresh(() => router.refresh())}
            />
          )}
        </section>

        <section
          aria-label="Preview"
          className={`${mobileView === "preview" ? "flex" : "hidden"} min-w-0 flex-1 flex-col lg:flex`}
        >
          <div className="flex h-14 shrink-0 items-center gap-2 border-b border-hairline px-3">
            <div className="hidden sm:block">
              <Segmented
                id="device"
                value={device}
                onChange={setDevice}
                options={DEVICES.map(({ id, label, icon: Icon }) => ({ id, label, icon: <Icon size={16} strokeWidth={1.5} /> }))}
                iconOnly
              />
            </div>
            {selected && !firstBuild && (
              <span className="truncate rounded-full bg-fg/[.05] px-3 py-1 text-[12px] font-medium text-fg-2">
                Version {number(selected.id)}
                {selected.id !== latest?.id && <span className="text-fg-3"> · older</span>}
              </span>
            )}
            <div className="ml-auto flex items-center gap-2">
              {selected && (
                <a
                  href={`/preview/${selected.id}`}
                  target="_blank"
                  rel="noopener"
                  aria-label="Open preview in a new tab"
                  className="grid size-11 place-items-center rounded-full text-fg-2 hover:bg-fg/5 hover:text-fg"
                >
                  <ExternalLink size={17} strokeWidth={1.5} />
                </a>
              )}
              <AnimatePresence mode="popLayout" initial={false}>
                {liveUrl && selected?.id === liveVersion && !deploying ? (
                  <motion.a
                    key="live"
                    href={liveUrl}
                    target="_blank"
                    rel="noopener"
                    initial={reduce ? false : { opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 420, damping: 30 }}
                    className="flex h-11 items-center gap-2 rounded-full bg-emerald-500/10 px-4 text-[14px] font-medium text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-400"
                  >
                    <span className="relative flex size-2">
                      <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500/60" />
                      <span className="relative size-2 rounded-full bg-emerald-500" />
                    </span>
                    Live
                  </motion.a>
                ) : (
                  <motion.button
                    key="deploy"
                    onClick={() => deploy()}
                    disabled={!selected || building || !!deploying}
                    initial={reduce ? false : { opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    whileTap={{ scale: 0.96 }}
                    transition={{ type: "spring", stiffness: 420, damping: 30 }}
                    className="flex h-11 items-center gap-2 rounded-full bg-octa-600 px-5 text-[15px] font-medium text-white shadow-[0_8px_20px_-8px_rgba(194,65,12,.7)] transition-colors hover:bg-octa-500 disabled:bg-fg/10 disabled:text-fg-3 disabled:shadow-none"
                  >
                    {deploying ? <Loader2 size={16} className="animate-spin" /> : <Rocket size={16} strokeWidth={1.75} />}
                    {deploying ? "Deploying…" : liveUrl ? "Deploy update" : "Deploy"}
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="relative min-h-0 flex-1 overflow-hidden bg-canvas-2">
            {firstBuild ? (
              <BuildStage progress={progress} siteName={site.slug ? `${site.slug}.${sitesDomain}` : "your-site.octacore.app"} />
            ) : selected ? (
              <div className={`flex h-full justify-center overflow-auto ${device !== "desktop" ? "p-6" : ""}`}>
                <motion.iframe
                  key={selected.id}
                  initial={reduce ? false : { opacity: 0, scale: 0.995 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  src={`/preview/${selected.id}`}
                  title={`${site.title ?? "Site"} preview`}
                  sandbox="allow-scripts allow-forms allow-popups allow-modals"
                  style={{ width: DEVICES.find((d) => d.id === device)!.width }}
                  className={`h-full max-w-full bg-white transition-[width] duration-500 ease-[var(--ease-spring)] ${
                    device === "desktop" ? "" : "rounded-[22px] shadow-float ring-1 ring-hairline"
                  }`}
                />
              </div>
            ) : (
              <div className="grid h-full place-items-center px-6 text-center text-[15px] text-fg-3">
                Your preview will appear here.
              </div>
            )}
            <AnimatePresence>
              {stream && latest && <EditOverlay progress={progress} note={note?.summary ?? ""} />}
            </AnimatePresence>
          </div>
        </section>
      </div>
    </div>
  );
}

function DeploysPanel({
  site,
  liveUrl,
  liveVersion,
  deployments,
  deploying,
  copied,
  sitesDomain,
  number,
  onCopy,
  onRestore,
  onAddressSaved,
}: {
  site: Site;
  liveUrl: string | null;
  liveVersion: string | null;
  deployments: Deployment[];
  deploying: string | null;
  copied: boolean;
  sitesDomain: string;
  number: (id: string) => number;
  onCopy: (url: string) => void;
  onRestore: (versionId: string) => void;
  onAddressSaved: () => void;
}) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
      {liveUrl ? (
        <div className="rounded-[20px] bg-elevated p-4 shadow-soft ring-1 ring-hairline">
          <p className="flex items-center gap-2 text-[13px] text-fg-2">
            <LiveBadge /> Version {liveVersion ? number(liveVersion) : "—"}
          </p>
          <a
            href={liveUrl}
            target="_blank"
            rel="noopener"
            className="mt-2 block truncate text-[16px] font-semibold tracking-[-0.01em] hover:text-octa-600"
          >
            {liveUrl.replace("https://", "")}
          </a>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => onCopy(liveUrl)}
              className="flex h-11 items-center gap-2 rounded-full bg-fg/[.06] px-4 text-[14px] font-medium hover:bg-fg/10"
            >
              {copied ? <Check size={15} /> : <Copy size={15} strokeWidth={1.5} />} {copied ? "Copied" : "Copy link"}
            </button>
            <a
              href={liveUrl}
              target="_blank"
              rel="noopener"
              className="flex h-11 items-center gap-2 rounded-full bg-fg/[.06] px-4 text-[14px] font-medium hover:bg-fg/10"
            >
              <ExternalLink size={15} strokeWidth={1.5} /> Visit
            </a>
          </div>
          <AddressEditor siteId={site.id} slug={site.slug!} domain={sitesDomain} onSaved={onAddressSaved} />
        </div>
      ) : (
        <div className="rounded-[20px] border border-dashed border-hairline p-5 text-center">
          <p className="text-[15px] font-medium">Not live yet</p>
          <p className="mt-1 text-[14px] text-fg-2">Deploy your site to get a link you can share with anyone.</p>
        </div>
      )}

      {deployments.length > 0 && (
        <>
          <h2 className="mt-7 px-1 text-[12px] font-medium text-fg-3">History</h2>
          <ol className="relative mt-3 space-y-1 border-l border-hairline pl-4">
            {deployments.map((d, i) => (
              <li key={d.id} className="relative flex min-h-14 items-center gap-3 py-2 text-[14px]">
                <span
                  className={`absolute -left-[21px] size-2.5 rounded-full ring-4 ring-canvas ${i === 0 ? "bg-emerald-500" : "bg-fg/20"}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">Version {number(d.versionId)}</p>
                  <p className="text-[12px] text-fg-3">{day.format(d.createdAt)}</p>
                </div>
                {i === 0 ? (
                  <LiveBadge />
                ) : (
                  d.versionId !== liveVersion && (
                    <button
                      onClick={() => onRestore(d.versionId)}
                      disabled={!!deploying}
                      className="h-9 rounded-full px-3 text-[13px] font-medium text-octa-600 hover:bg-octa-600/10 disabled:opacity-50"
                    >
                      {deploying === d.versionId ? "Restoring…" : "Restore"}
                    </button>
                  )
                )}
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  );
}

function Segmented<T extends string>({
  id,
  value,
  onChange,
  options,
  iconOnly,
}: {
  id: string;
  value: T;
  onChange: (value: T) => void;
  options: { id: T; label: string; icon?: React.ReactNode }[];
  iconOnly?: boolean;
}) {
  return (
    <div role="radiogroup" className="flex rounded-full bg-fg/[.06] p-0.5">
      {options.map((o) => (
        <button
          key={o.id}
          role="radio"
          aria-checked={value === o.id}
          aria-label={iconOnly ? o.label : undefined}
          title={iconOnly ? o.label : undefined}
          onClick={() => onChange(o.id)}
          className={`relative flex h-9 items-center justify-center rounded-full text-[13px] font-medium transition-colors ${iconOnly ? "w-10" : "px-3.5"} ${
            value === o.id ? "text-fg" : "text-fg-2 hover:text-fg"
          }`}
        >
          {value === o.id && (
            <motion.span
              layoutId={`seg-${id}`}
              className="absolute inset-0 rounded-full bg-elevated shadow-soft"
              transition={{ type: "spring", stiffness: 420, damping: 34 }}
            />
          )}
          <span className="relative">{iconOnly ? o.icon : o.label}</span>
        </button>
      ))}
    </div>
  );
}
function EmptyState({ site, stalled, onRetry }: { site: Site; stalled: boolean; onRetry: () => void }) {
  if (site.status === "generating" && !stalled) {
    return <p className="px-1 text-[14px] text-fg-2">Still building — refresh in a moment.</p>;
  }
  return (
    <div className="rounded-[18px] bg-elevated p-4 ring-1 ring-hairline">
      <p className="text-[15px] font-medium">This build didn&apos;t finish</p>
      <p className="mt-1 text-[14px] text-fg-2">{site.prompt}</p>
      <button
        onClick={onRetry}
        className="mt-3 h-11 rounded-full bg-octa-600 px-5 text-[15px] font-medium text-white hover:bg-octa-500"
      >
        Try again
      </button>
    </div>
  );
}

function AddressEditor({ siteId, slug, domain, onSaved }: { siteId: string; slug: string; domain: string; onSaved: () => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(slug);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    setError("");
    const res = await fetch(`/api/sites/${siteId}/address`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug: value }),
    }).catch(() => null);
    const body = (await res?.json().catch(() => null)) as { slug?: string; error?: string } | null;
    setSaving(false);
    if (!res?.ok) return setError(body?.error ?? "Couldn't change the address. Try again.");
    setValue(body?.slug ?? value);
    setEditing(false);
    onSaved();
  }

  if (!editing) {
    return (
      <button
        onClick={() => {
          setValue(slug);
          setEditing(true);
        }}
        className="mt-3 h-9 rounded-full px-1 text-[13px] font-medium text-octa-600 hover:text-octa-500"
      >
        Change address ›
      </button>
    );
  }
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      className="mt-4 border-t border-hairline pt-4"
    >
      <label htmlFor="site-address" className="text-[13px] font-medium">
        Address
      </label>
      <div className="mt-2 flex h-11 items-center rounded-[12px] bg-canvas px-3 text-[15px] ring-1 ring-hairline focus-within:ring-2 focus-within:ring-octa-600">
        <input
          id="site-address"
          value={value}
          autoFocus
          autoCapitalize="off"
          spellCheck={false}
          onChange={(e) => {
            setValue(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
            setError("");
          }}
          aria-invalid={!!error}
          aria-describedby={error ? "address-error" : undefined}
          className="min-w-0 flex-1 bg-transparent focus:outline-none"
        />
        <span className="shrink-0 text-fg-3">.{domain}</span>
      </div>
      {error && (
        <p id="address-error" role="alert" className="mt-2 text-[13px] text-red-600">
          {error}
        </p>
      )}
      <div className="mt-3 flex gap-2">
        <button
          disabled={saving || !value || value === slug}
          className="h-11 rounded-full bg-octa-600 px-5 text-[14px] font-medium text-white hover:bg-octa-500 disabled:bg-fg/10 disabled:text-fg-3"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="h-11 rounded-full px-4 text-[14px] font-medium text-fg-2 hover:bg-fg/5"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function LiveBadge() {
  return (
    <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[12px] font-medium text-emerald-700 dark:text-emerald-400">
      <span className="size-1.5 rounded-full bg-emerald-500" /> Live
    </span>
  );
}
