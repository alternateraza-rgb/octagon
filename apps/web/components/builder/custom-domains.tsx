"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Copy, Loader2, X } from "lucide-react";
import { noticeUpgrade } from "@/lib/billing/client";
import type { DomainView } from "@/lib/domains/store";

const POLL_MS = 10_000;

function statusLabel(d: DomainView) {
  if (d.status === "active") return { text: "Live", tone: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" };
  if (d.status === "failed") return { text: "Failed", tone: "bg-red-500/10 text-red-700 dark:text-red-400" };
  // The domain points at us and Cloudflare is issuing its certificate.
  if (d.sslStatus && d.sslStatus !== "initializing" && d.sslStatus !== "pending_validation") {
    return { text: "Issuing SSL", tone: "bg-amber-500/10 text-amber-700 dark:text-amber-400" };
  }
  return { text: "Waiting for DNS", tone: "bg-fg/[.06] text-fg-2" };
}

async function fetchDomains(siteId: string) {
  const res = await fetch(`/api/sites/${siteId}/domains`, { cache: "no-store" }).catch(() => null);
  const body = (await res?.json().catch(() => null)) as { domains?: DomainView[] } | null;
  return res?.ok ? (body?.domains ?? null) : null;
}

// Custom domains for a deployed site: connect one, see the DNS records to add, and watch it go live.
export function CustomDomains({ siteId, onChanged }: { siteId: string; onChanged: () => void }) {
  const [domains, setDomains] = useState<DomainView[] | null>(null);
  const [adding, setAdding] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const latest = useRef<DomainView[] | null>(null);
  // The parent passes a new callback each render; polling shouldn't restart because of it.
  const changed = useRef(onChanged);
  useEffect(() => {
    changed.current = onChanged;
  });

  // A domain that just went live changes the site's address.
  const apply = useCallback((next: DomainView[] | null) => {
    if (!next) return;
    if (latest.current?.some((p) => p.status !== "active" && next.find((d) => d.id === p.id)?.status === "active")) changed.current();
    latest.current = next;
    setDomains(next);
  }, []);

  useEffect(() => {
    fetchDomains(siteId).then(apply);
  }, [siteId, apply]);

  const pending = domains?.some((d) => d.status === "pending");
  useEffect(() => {
    if (!pending) return;
    const timer = setInterval(() => fetchDomains(siteId).then(apply), POLL_MS);
    return () => clearInterval(timer);
  }, [pending, siteId, apply]);

  async function add() {
    setSaving(true);
    setError("");
    const res = await fetch(`/api/sites/${siteId}/domains`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ hostname: value }),
    }).catch(() => null);
    const body = (await res?.json().catch(() => null)) as { domain?: DomainView; error?: string } | null;
    setSaving(false);
    if (!res?.ok || !body?.domain) {
      if (!noticeUpgrade(res?.status, body)) setError(body?.error ?? "Couldn't connect the domain. Try again.");
      return;
    }
    latest.current = [...(latest.current ?? []), body.domain];
    setDomains(latest.current);
    setValue("");
    setAdding(false);
  }

  async function remove(id: string) {
    setRemoving(id);
    const res = await fetch(`/api/sites/${siteId}/domains/${id}`, { method: "DELETE" }).catch(() => null);
    setRemoving(null);
    if (res?.ok) {
      const wasActive = domains?.find((d) => d.id === id)?.status === "active";
      latest.current = latest.current?.filter((d) => d.id !== id) ?? null;
      setDomains(latest.current);
      if (wasActive) changed.current();
    }
  }

  async function copy(text: string) {
    await navigator.clipboard.writeText(text).catch(() => {});
    setCopied(text);
    setTimeout(() => setCopied((c) => (c === text ? null : c)), 1500);
  }

  return (
    <div className="mt-4 border-t border-hairline pt-4">
      <h3 className="text-[13px] font-medium">Custom domains</h3>
      {domains && domains.length > 0 && (
        <ul className="mt-3 space-y-3">
          {domains.map((d) => {
            const label = statusLabel(d);
            return (
              <li key={d.id} className="rounded-[12px] bg-canvas p-3 ring-1 ring-hairline">
                <div className="flex items-center gap-2">
                  <p className="min-w-0 flex-1 truncate text-[14px] font-medium">{d.hostname}</p>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[12px] font-medium ${label.tone}`}>{label.text}</span>
                  <button
                    onClick={() => remove(d.id)}
                    disabled={removing === d.id}
                    aria-label={`Remove ${d.hostname}`}
                    title="Remove"
                    className="-mr-1 flex size-9 shrink-0 items-center justify-center rounded-full text-fg-3 hover:bg-fg/5 hover:text-fg disabled:opacity-50"
                  >
                    {removing === d.id ? <Loader2 size={15} className="animate-spin" /> : <X size={15} strokeWidth={1.5} />}
                  </button>
                </div>
                {d.status !== "active" && (
                  <>
                    <p className="mt-2 text-[13px] text-fg-2">Add this record at your domain provider:</p>
                    <dl className="mt-2 space-y-2">
                      {d.records.map((r, i) => (
                        <div key={`${r.type}-${r.name}`} className="text-[12px]">
                          {i === 1 && <p className="mb-2 text-fg-3">If your provider asks for proof of ownership, also add:</p>}
                          <div className="flex items-center gap-2 rounded-[10px] bg-fg/[.04] px-2.5 py-2">
                            <dt className="w-12 shrink-0 font-medium text-fg-2">{r.type}</dt>
                            <dd className="min-w-0 flex-1">
                              <p className="truncate" title={r.name}>{r.name}</p>
                              <p className="truncate text-fg-3" title={r.value}>{r.value}</p>
                            </dd>
                            <button
                              onClick={() => copy(r.value)}
                              aria-label={`Copy ${r.type} value`}
                              className="flex size-9 shrink-0 items-center justify-center rounded-full text-fg-3 hover:bg-fg/5 hover:text-fg"
                            >
                              {copied === r.value ? <Check size={14} /> : <Copy size={14} strokeWidth={1.5} />}
                            </button>
                          </div>
                        </div>
                      ))}
                    </dl>
                    {d.hostname.split(".").length === 2 && (
                      <p className="mt-2 text-[12px] text-fg-3">
                        Root domains can&apos;t use a plain CNAME. Use your provider&apos;s ALIAS or CNAME flattening, or forward it to
                        www.{d.hostname} and connect that instead.
                      </p>
                    )}
                  </>
                )}
                {d.error && <p className="mt-2 text-[12px] text-red-600">{d.error}</p>}
              </li>
            );
          })}
        </ul>
      )}
      {adding ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            add();
          }}
          className="mt-3"
        >
          <label htmlFor="custom-domain" className="sr-only">
            Domain
          </label>
          <input
            id="custom-domain"
            value={value}
            autoFocus
            autoCapitalize="off"
            spellCheck={false}
            placeholder="www.example.com"
            onChange={(e) => {
              setValue(e.target.value);
              setError("");
            }}
            aria-invalid={!!error}
            aria-describedby={error ? "domain-error" : undefined}
            className="h-11 w-full rounded-[12px] bg-canvas px-3 text-[15px] ring-1 ring-hairline focus:ring-2 focus:ring-octa-600 focus:outline-none"
          />
          {error && (
            <p id="domain-error" role="alert" className="mt-2 text-[13px] text-red-600">
              {error}
            </p>
          )}
          <div className="mt-3 flex gap-2">
            <button
              disabled={saving || !value.trim()}
              className="h-11 rounded-full bg-octa-600 px-5 text-[14px] font-medium text-white hover:bg-octa-500 disabled:bg-fg/10 disabled:text-fg-3"
            >
              {saving ? "Connecting…" : "Connect"}
            </button>
            <button
              type="button"
              onClick={() => {
                setAdding(false);
                setError("");
              }}
              className="h-11 rounded-full px-4 text-[14px] font-medium text-fg-2 hover:bg-fg/5"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        (domains?.length ?? 0) < 2 && (
          <button
            onClick={() => setAdding(true)}
            className="mt-2 h-9 rounded-full px-1 text-[13px] font-medium text-octa-600 hover:text-octa-500"
          >
            Connect a domain ›
          </button>
        )
      )}
    </div>
  );
}
