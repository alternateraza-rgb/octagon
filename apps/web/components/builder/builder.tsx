"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowUp, Check, Copy, ExternalLink, Monitor, Rocket, Smartphone, Tablet } from "lucide-react";
import { readTextStream } from "@/lib/read-stream";
import type { Deployment, Site, VersionSummary } from "@/lib/sites/store";

type Device = "desktop" | "tablet" | "mobile";
const DEVICES: { id: Device; label: string; icon: typeof Monitor; width: string }[] = [
  { id: "desktop", label: "Desktop", icon: Monitor, width: "100%" },
  { id: "tablet", label: "Tablet", icon: Tablet, width: "820px" },
  { id: "mobile", label: "Phone", icon: Smartphone, width: "390px" },
];

const time = new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" });
const day = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

export function Builder({
  site,
  versions,
  deployments,
  liveUrl,
  autoStart,
  stalled,
}: {
  site: Site;
  versions: VersionSummary[];
  deployments: Deployment[];
  liveUrl: string | null;
  autoStart: boolean;
  stalled: boolean;
}) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [refreshing, startRefresh] = useTransition();
  const [panel, setPanel] = useState<"chat" | "deploys">("chat");
  const [mobileView, setMobileView] = useState<"chat" | "preview">("preview");
  const [device, setDevice] = useState<Device>("desktop");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState<{ instruction: string; code: string } | null>(null);
  const [error, setError] = useState("");
  const [deploying, setDeploying] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const started = useRef(false);
  const timelineRef = useRef<HTMLDivElement>(null);

  const latest = versions.at(-1) ?? null;
  const selected = versions.find((v) => v.id === selectedId) ?? latest;
  const building = pending !== null || refreshing;
  const number = (id: string) => versions.findIndex((v) => v.id === id) + 1;

  async function generate(instruction?: string) {
    if (building) return;
    setError("");
    setPending({ instruction: instruction ?? site.prompt, code: "" });
    setInput("");
    setMobileView("preview");
    try {
      const res = await fetch(`/api/sites/${site.id}/versions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ instruction }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Something went wrong.");
      }
      const { failed } = await readTextStream(res, (code) => setPending((p) => (p ? { ...p, code } : p)));
      if (failed) throw new Error("The build didn't finish. Try again.");
      setSelectedId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setPending(null);
      startRefresh(() => router.refresh());
    }
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
    if (!res?.ok) setError("Deploy failed. Try again.");
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

  useEffect(() => {
    timelineRef.current?.scrollTo({ top: timelineRef.current.scrollHeight });
  }, [versions.length, pending?.instruction]);

  const liveVersion = site.deployedVersionId;
  const lines = pending ? pending.code.split("\n").length : 0;

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-12 shrink-0 items-center justify-center border-b border-hairline lg:hidden">
        <Segmented
          value={mobileView}
          onChange={setMobileView}
          options={[
            { id: "chat", label: "Chat" },
            { id: "preview", label: "Preview" },
          ]}
        />
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Conversation and deploys */}
        <section
          aria-label="Site conversation"
          className={`${mobileView === "chat" ? "flex" : "hidden"} w-full min-w-0 flex-col border-r border-hairline lg:flex lg:w-[380px] lg:shrink-0`}
        >
          <div className="flex h-14 shrink-0 items-center gap-1 px-2">
            <Link href="/dashboard/sites" aria-label="All websites" className="grid size-11 place-items-center rounded-full text-fg-2 hover:bg-fg/5 hover:text-fg">
              <ArrowLeft size={18} strokeWidth={1.5} />
            </Link>
            <h1 className="min-w-0 flex-1 truncate text-[15px] font-semibold">{site.title ?? "New website"}</h1>
            <Segmented
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
              <div ref={timelineRef} className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4">
                {versions.map((v, i) => (
                  <div key={v.id} className="space-y-2">
                    <p className="ml-auto w-fit max-w-[90%] whitespace-pre-wrap break-words rounded-[18px] bg-fg/[.07] px-4 py-2.5 text-[15px] leading-[1.45]">
                      {v.instruction}
                    </p>
                    <button
                      onClick={() => setSelectedId(v.id)}
                      aria-pressed={selected?.id === v.id}
                      className={`flex min-h-11 w-full items-center gap-3 rounded-[12px] px-3 text-left text-[14px] transition-colors ${
                        selected?.id === v.id ? "bg-elevated shadow-soft ring-1 ring-hairline" : "hover:bg-fg/5"
                      }`}
                    >
                      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-octa-600/10 text-[11px] font-semibold text-octa-700">
                        {i + 1}
                      </span>
                      <span className="flex-1">{i === 0 ? "Built your site" : "Applied your changes"}</span>
                      {v.id === liveVersion && <LiveBadge />}
                      <span className="text-[12px] text-fg-3">{time.format(v.createdAt)}</span>
                    </button>
                  </div>
                ))}
                {pending && (
                  <div className="space-y-2">
                    <p className="ml-auto w-fit max-w-[90%] whitespace-pre-wrap break-words rounded-[18px] bg-fg/[.07] px-4 py-2.5 text-[15px] leading-[1.45]">
                      {pending.instruction}
                    </p>
                    <p role="status" className="flex min-h-11 items-center gap-3 px-3 text-[14px] text-fg-2">
                      <Pulse reduce={!!reduce} />
                      {pending.code ? `Writing · ${lines} lines` : "Designing"}
                    </p>
                  </div>
                )}
                {versions.length === 0 && !pending && !refreshing && (
                  <EmptyState site={site} stalled={stalled} onRetry={() => generate()} />
                )}
              </div>

              <div className="shrink-0 p-3">
                {error && (
                  <p role="alert" className="mb-2 px-1 text-[13px] text-red-600">
                    {error}
                  </p>
                )}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (input.trim() && latest) generate(input.trim());
                  }}
                  className="flex items-end gap-2 rounded-[18px] bg-elevated p-1.5 shadow-soft ring-1 ring-hairline"
                >
                  <label htmlFor="change-input" className="sr-only">
                    Describe a change
                  </label>
                  <textarea
                    id="change-input"
                    rows={1}
                    value={input}
                    disabled={!latest || building}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                        e.preventDefault();
                        if (input.trim() && latest) generate(input.trim());
                      }
                    }}
                    placeholder={latest ? "Describe a change…" : "Your site is being built…"}
                    className="field-sizing-content max-h-[160px] min-h-11 flex-1 resize-none bg-transparent px-3 py-2.5 text-[15px] leading-[1.45] placeholder:text-fg-3 focus:outline-none disabled:opacity-60"
                  />
                  <button
                    type="submit"
                    aria-label="Apply change"
                    disabled={!input.trim() || !latest || building}
                    className="grid size-11 shrink-0 place-items-center rounded-full bg-octa-600 text-white transition-all hover:bg-octa-500 active:scale-95 disabled:bg-fg/10 disabled:text-fg-3"
                  >
                    <ArrowUp size={18} strokeWidth={2} />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
              {liveUrl ? (
                <div className="rounded-[18px] bg-elevated p-4 shadow-soft ring-1 ring-hairline">
                  <p className="flex items-center gap-2 text-[13px] text-fg-2">
                    <LiveBadge /> Version {liveVersion ? number(liveVersion) : "—"}
                  </p>
                  <a href={liveUrl} target="_blank" rel="noopener" className="mt-2 block truncate text-[15px] font-medium hover:text-octa-600">
                    {liveUrl.replace("https://", "")}
                  </a>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={async () => {
                        await navigator.clipboard.writeText(liveUrl);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 1500);
                      }}
                      className="flex h-11 items-center gap-2 rounded-full bg-fg/[.06] px-4 text-[14px] font-medium hover:bg-fg/10"
                    >
                      {copied ? <Check size={15} /> : <Copy size={15} strokeWidth={1.5} />} {copied ? "Copied" : "Copy link"}
                    </button>
                    <a href={liveUrl} target="_blank" rel="noopener" className="flex h-11 items-center gap-2 rounded-full bg-fg/[.06] px-4 text-[14px] font-medium hover:bg-fg/10">
                      <ExternalLink size={15} strokeWidth={1.5} /> Visit
                    </a>
                  </div>
                </div>
              ) : (
                <p className="px-1 text-[15px] text-fg-2">Deploy your site to get a link you can share with anyone.</p>
              )}

              {deployments.length > 0 && (
                <>
                  <h2 className="mt-7 px-1 text-[12px] font-medium text-fg-3">History</h2>
                  <ul className="mt-2 divide-y divide-hairline">
                    {deployments.map((d, i) => (
                      <li key={d.id} className="flex min-h-14 items-center gap-3 px-1 py-2 text-[14px]">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">Version {number(d.versionId)}</p>
                          <p className="text-[12px] text-fg-3">{day.format(d.createdAt)}</p>
                        </div>
                        {i === 0 ? (
                          <LiveBadge />
                        ) : (
                          d.versionId !== liveVersion && (
                            <button
                              onClick={() => deploy(d.versionId)}
                              disabled={!!deploying}
                              className="h-9 rounded-full px-3 text-[13px] font-medium text-octa-600 hover:bg-octa-600/10 disabled:opacity-50"
                            >
                              {deploying === d.versionId ? "Restoring…" : "Restore"}
                            </button>
                          )
                        )}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}
        </section>

        {/* Preview */}
        <section aria-label="Preview" className={`${mobileView === "preview" ? "flex" : "hidden"} min-w-0 flex-1 flex-col lg:flex`}>
          <div className="flex h-14 shrink-0 items-center gap-2 border-b border-hairline px-3">
            <div className="hidden sm:block">
              <Segmented
                value={device}
                onChange={setDevice}
                options={DEVICES.map(({ id, label, icon: Icon }) => ({ id, label, icon: <Icon size={16} strokeWidth={1.5} /> }))}
                iconOnly
              />
            </div>
            {selected && (
              <p className="truncate text-[13px] text-fg-3">
                Version {number(selected.id)}
                {selected.id !== latest?.id && " · viewing an older version"}
              </p>
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
              {liveUrl && selected?.id === liveVersion ? (
                <a
                  href={liveUrl}
                  target="_blank"
                  rel="noopener"
                  className="flex h-11 items-center gap-2 rounded-full bg-fg/[.06] px-4 text-[14px] font-medium hover:bg-fg/10"
                >
                  <span className="size-2 rounded-full bg-emerald-500" /> Live
                </a>
              ) : (
                <button
                  onClick={() => deploy()}
                  disabled={!selected || building || !!deploying}
                  className="flex h-11 items-center gap-2 rounded-full bg-octa-600 px-5 text-[15px] font-medium text-white transition-all hover:bg-octa-500 active:scale-[.98] disabled:bg-fg/10 disabled:text-fg-3"
                >
                  <Rocket size={16} strokeWidth={1.75} />
                  {deploying ? "Deploying…" : liveUrl ? "Deploy update" : "Deploy"}
                </button>
              )}
            </div>
          </div>

          <div className="relative min-h-0 flex-1 overflow-hidden bg-canvas-2">
            {selected ? (
              <div className="flex h-full justify-center overflow-auto p-0 data-[framed=true]:p-6" data-framed={device !== "desktop"}>
                <iframe
                  key={selected.id}
                  src={`/preview/${selected.id}`}
                  title={`${site.title ?? "Site"} preview`}
                  sandbox="allow-scripts allow-forms allow-popups allow-modals"
                  style={{ width: DEVICES.find((d) => d.id === device)!.width }}
                  className={`h-full max-w-full bg-white transition-[width] duration-500 ease-[var(--ease-spring)] ${
                    device === "desktop" ? "" : "rounded-[18px] shadow-float ring-1 ring-hairline"
                  }`}
                />
              </div>
            ) : (
              !pending && <div className="grid h-full place-items-center px-6 text-center text-[15px] text-fg-3">Your preview will appear here.</div>
            )}

            <AnimatePresence>
              {pending && (
                <motion.div
                  initial={reduce ? false : { opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? undefined : { opacity: 0, y: 16 }}
                  transition={{ type: "spring", stiffness: 120, damping: 20 }}
                  className={`absolute inset-x-4 bottom-4 mx-auto max-w-[720px] overflow-hidden rounded-[18px] ${
                    selected ? "material shadow-float ring-1 ring-hairline" : "top-4 bg-elevated shadow-soft ring-1 ring-hairline"
                  }`}
                >
                  <p role="status" className="flex h-12 items-center gap-3 border-b border-hairline px-4 text-[14px] font-medium">
                    <Pulse reduce={!!reduce} />
                    {pending.code ? `Writing your site · ${lines} lines` : "Designing your site"}
                  </p>
                  <pre
                    aria-hidden
                    className={`overflow-hidden whitespace-pre-wrap break-all px-4 py-3 font-mono text-[12px] leading-[1.55] text-fg-2 ${selected ? "h-40" : "h-[calc(100%-3rem)]"} [mask-image:linear-gradient(to_bottom,transparent,black_40%)] flex flex-col justify-end`}
                  >
                    {pending.code.split("\n").slice(-60).join("\n") || " "}
                  </pre>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>
      </div>
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
      <button onClick={onRetry} className="mt-3 h-11 rounded-full bg-octa-600 px-5 text-[15px] font-medium text-white hover:bg-octa-500">
        Try again
      </button>
    </div>
  );
}

function LiveBadge() {
  return (
    <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[12px] font-medium text-emerald-700 dark:text-emerald-400">
      <span className="size-1.5 rounded-full bg-emerald-500" /> Live
    </span>
  );
}

function Pulse({ reduce }: { reduce: boolean }) {
  return (
    <motion.span
      aria-hidden
      className="size-2 shrink-0 rounded-full bg-octa-600"
      animate={reduce ? undefined : { opacity: [1, 0.25, 1] }}
      transition={{ duration: 1.2, repeat: Infinity }}
    />
  );
}

function Segmented<T extends string>({
  value,
  onChange,
  options,
  iconOnly,
}: {
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
          className={`flex h-9 items-center justify-center rounded-full text-[13px] font-medium transition-colors ${iconOnly ? "w-10" : "px-3.5"} ${
            value === o.id ? "bg-elevated text-fg shadow-soft" : "text-fg-2 hover:text-fg"
          }`}
        >
          {iconOnly ? o.icon : o.label}
        </button>
      ))}
    </div>
  );
}
