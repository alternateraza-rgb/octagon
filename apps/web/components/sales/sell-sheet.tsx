"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, Copy, Mail, Send, ShieldCheck, Tag, X } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { noticeUpgrade } from "@/lib/billing/client";
import type { PublicSale } from "@/lib/sales/invite";
import { fee, money, parsePrice, sellerShare } from "@/lib/sales/money";

type Seller = { verification: string; canSell: boolean } | null;
type State = { sale: PublicSale | null; seller: Seller };

const spring = { type: "spring", stiffness: 380, damping: 38 } as const;
const when = new Intl.DateTimeFormat("en", { month: "short", day: "numeric" });

// Selling a site from the builder: set a price, invite the client by email, and follow the invite.
export function SellSheet({ open, siteId, siteTitle, onClose }: { open: boolean; siteId: string; siteTitle: string; onClose: () => void }) {
  const reduce = useReducedMotion();
  const [state, setState] = useState<State | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    let stale = false;
    fetch(`/api/sites/${siteId}/sales`, { cache: "no-store" })
      .then(async (res) => {
        const body = (await res.json().catch(() => null)) as (State & { error?: string }) | null;
        if (stale) return;
        if (res.ok && body) setState({ sale: body.sale, seller: body.seller });
        else setError(body?.error ?? "Couldn't load this site's sale.");
      })
      .catch(() => !stale && setError("Couldn't load this site's sale."));
    return () => {
      stale = true;
    };
  }, [open, siteId]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-stretch sm:justify-end">
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
            aria-labelledby="sell-title"
            initial={reduce ? { opacity: 0 } : { y: "100%" }}
            animate={reduce ? { opacity: 1 } : { y: 0 }}
            exit={reduce ? { opacity: 0 } : { y: "100%" }}
            transition={spring}
            className="relative flex max-h-[92dvh] w-full flex-col rounded-t-[28px] bg-elevated shadow-float ring-1 ring-hairline sm:max-h-none sm:max-w-[480px] sm:rounded-none sm:rounded-l-[28px]"
          >
            <header className="flex items-start gap-3 px-6 pb-2 pt-6">
              <span className="grid size-11 shrink-0 place-items-center rounded-[14px] bg-octa-600/10 text-octa-600">
                <Tag size={20} strokeWidth={1.75} />
              </span>
              <div className="min-w-0 flex-1">
                <h2 id="sell-title" className="text-[24px] font-semibold leading-tight tracking-[-0.02em]">
                  Sell this site
                </h2>
                <p className="truncate text-[14px] text-fg-2">{siteTitle}</p>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                autoFocus
                className="-mr-2 grid size-11 shrink-0 place-items-center rounded-full text-fg-2 hover:bg-fg/5 hover:text-fg"
              >
                <X size={20} strokeWidth={1.5} />
              </button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-8 pt-4">
              {error ? (
                <p role="alert" className="rounded-[16px] bg-red-500/10 px-4 py-3 text-[14px] text-red-700 dark:text-red-300">
                  {error}
                </p>
              ) : !state ? (
                <div className="grid h-40 place-items-center">
                  <span className="size-6 animate-spin rounded-full border-2 border-fg/15 border-t-octa-600" />
                </div>
              ) : !state.seller?.canSell ? (
                <Payouts seller={state.seller} />
              ) : state.sale ? (
                <SaleStatus sale={state.sale} onChange={(sale) => setState({ ...state, sale })} />
              ) : (
                <InviteForm siteId={siteId} siteTitle={siteTitle} onSent={(sale) => setState({ ...state, sale })} />
              )}
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}

// Sellers are paid through their own Whop account, which needs identity verification first.
export function Payouts({ seller }: { seller: Seller }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const rejected = seller?.verification === "rejected";
  // A Whop account Octacore can't take its fee through (e.g. Octacore's own business).
  const unlinked = seller?.verification === "unlinked";

  async function start() {
    setBusy(true);
    setError("");
    const res = await fetch("/api/payouts", { method: "POST" }).catch(() => null);
    const body = (await res?.json().catch(() => null)) as { url?: string; error?: string } | null;
    if (res?.ok && body?.url) {
      window.location.href = body.url;
      return;
    }
    setBusy(false);
    setError(body?.error ?? "Couldn't start payouts setup. Try again.");
  }

  return (
    <div>
      <span className="grid size-14 place-items-center rounded-full bg-emerald-500/10 text-emerald-600">
        <ShieldCheck size={26} strokeWidth={1.5} />
      </span>
      <h3 className="mt-5 text-[21px] font-semibold tracking-[-0.02em]">
        {rejected
          ? "Whop couldn't verify you"
          : unlinked
            ? "Link a payout account"
            : seller
              ? "Finish setting up payouts"
              : "Get paid for your sites"}
      </h3>
      <p className="mt-2 text-[15px] leading-[1.47] text-fg-2">
        {rejected
          ? "Whop, our payments partner, wasn't able to verify your identity. Open Whop to see why and try again."
          : unlinked
            ? "The Whop account on file isn't linked to Octacore, so client payments can't be split with it. Set up a linked payout account — it takes about three minutes."
            : "Your clients pay you directly through Whop, our payments partner. Verify your identity once — it takes about three minutes — and every sale lands in your Whop balance."}
      </p>
      <ul className="mt-5 space-y-2 text-[15px] text-fg-2">
        {["You set the price and optional monthly hosting", "Octacore keeps 10%, you keep the rest", "Withdraw to your bank any time"].map(
          (line) => (
            <li key={line} className="flex items-start gap-2">
              <Check size={15} strokeWidth={2.5} className="mt-[3px] shrink-0 text-octa-600" /> {line}
            </li>
          ),
        )}
      </ul>
      {error && (
        <p role="alert" className="mt-5 rounded-[16px] bg-red-500/10 px-4 py-3 text-[14px] text-red-700 dark:text-red-300">
          {error}
        </p>
      )}
      <button
        onClick={start}
        disabled={busy}
        className="mt-7 h-12 w-full rounded-full bg-octa-600 text-[15px] font-medium text-white transition-colors hover:bg-octa-500 disabled:opacity-60"
      >
        {busy ? "Opening Whop…" : rejected ? "Open Whop" : unlinked ? "Set up payouts" : seller ? "Continue verification" : "Set up payouts"}
      </button>
    </div>
  );
}

function InviteForm({ siteId, siteTitle, onSent }: { siteId: string; siteTitle: string; onSent: (sale: PublicSale) => void }) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [price, setPrice] = useState("");
  const [hosting, setHosting] = useState(true);
  const [monthly, setMonthly] = useState("49");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const priceCents = parsePrice(price);
  const monthlyCents = hosting ? parsePrice(monthly) : null;

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    setError("");
    const res = await fetch(`/api/sites/${siteId}/sales`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, email, price, monthly: hosting ? monthly : null, message }),
    }).catch(() => null);
    const body = (await res?.json().catch(() => null)) as { sale?: PublicSale; warning?: string; error?: string } | null;
    setSending(false);
    if (res?.ok && body?.sale) {
      onSent(body.sale);
      if (body.warning) toast.error(body.warning);
      else toast.success(`Invite sent to ${body.sale.buyerName}`);
      return;
    }
    if (!noticeUpgrade(res?.status, body)) setError(body?.error ?? "Couldn't send the invite. Try again.");
  }

  return (
    <form onSubmit={send} className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Client name" value={name} onChange={setName} placeholder="Maria Lopez" autoComplete="off" />
        <Field label="Client email" type="email" value={email} onChange={setEmail} placeholder="maria@business.com" autoComplete="off" />
      </div>

      <div>
        <Field label="Price" value={price} onChange={setPrice} placeholder="1,200" prefix="$" inputMode="decimal" />
        <label className="mt-3 flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-[14px] bg-canvas px-4 py-2 ring-1 ring-hairline">
          <span>
            <span className="block text-[15px] font-medium">Monthly hosting</span>
            <span className="block text-[13px] text-fg-3">Recurring income; the site stays live while it&apos;s paid</span>
          </span>
          <input
            type="checkbox"
            checked={hosting}
            onChange={(e) => setHosting(e.target.checked)}
            className="size-5 shrink-0 accent-[var(--color-octa-600)]"
          />
        </label>
        <AnimatePresence initial={false}>
          {hosting && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="pt-3">
                <Field label="Per month" value={monthly} onChange={setMonthly} placeholder="49" prefix="$" suffix="/mo" inputMode="decimal" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div>
        <label htmlFor="sell-message" className="text-[13px] font-medium text-fg-2">
          Personal message <span className="font-normal text-fg-3">(optional)</span>
        </label>
        <textarea
          id="sell-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={600}
          rows={3}
          placeholder={`Hi! I put together a new website for ${siteTitle}. Have a look — happy to tweak anything.`}
          className="mt-1.5 w-full resize-none rounded-[12px] bg-canvas px-4 py-3 text-[15px] ring-1 ring-hairline placeholder:text-fg-3 focus:outline-none focus:ring-2 focus:ring-octa-600"
        />
      </div>

      <Earnings priceCents={priceCents} monthlyCents={monthlyCents} />

      {error && (
        <p role="alert" className="rounded-[16px] bg-red-500/10 px-4 py-3 text-[14px] text-red-700 dark:text-red-300">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={sending}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-octa-600 text-[15px] font-medium text-white transition-colors hover:bg-octa-500 disabled:opacity-60"
      >
        <Send size={16} strokeWidth={1.75} /> {sending ? "Sending…" : "Send invite"}
      </button>
      <p className="text-center text-[12px] text-fg-3">
        Your client gets an email with a live preview and a secure checkout. The site becomes theirs once they pay.
      </p>
    </form>
  );
}

function Earnings({ priceCents, monthlyCents }: { priceCents: number | null; monthlyCents: number | null }) {
  if (!priceCents) return null;
  return (
    <div className="rounded-[18px] bg-canvas p-4 ring-1 ring-hairline">
      <div className="flex items-baseline justify-between text-[14px] text-fg-2">
        <span>Client pays</span>
        <span className="tabular-nums">
          {money(priceCents)}
          {monthlyCents ? ` + ${money(monthlyCents)}/mo` : ""}
        </span>
      </div>
      <div className="mt-1.5 flex items-baseline justify-between text-[14px] text-fg-2">
        <span>Octacore (10%)</span>
        <span className="tabular-nums">
          −{money(fee(priceCents))}
          {monthlyCents ? ` − ${money(fee(monthlyCents))}/mo` : ""}
        </span>
      </div>
      <div className="mt-3 flex items-baseline justify-between border-t border-hairline pt-3">
        <span className="text-[15px] font-medium">You receive</span>
        <span className="text-[19px] font-semibold tabular-nums tracking-[-0.01em]">
          {money(sellerShare(priceCents))}
          {monthlyCents ? <span className="text-[15px] font-medium text-fg-2"> + {money(sellerShare(monthlyCents))}/mo</span> : null}
        </span>
      </div>
      <p className="mt-2 text-[12px] text-fg-3">Before Whop&apos;s card processing fees.</p>
    </div>
  );
}

function SaleStatus({ sale, onChange }: { sale: PublicSale; onChange: (sale: PublicSale | null) => void }) {
  const toast = useToast();
  const [busy, setBusy] = useState<"resend" | "cancel" | null>(null);
  const [copied, setCopied] = useState(false);
  const sold = sale.status === "paid";

  async function resend() {
    setBusy("resend");
    const res = await fetch(`/api/sales/${sale.id}`, { method: "POST" }).catch(() => null);
    const body = (await res?.json().catch(() => null)) as { sale?: PublicSale; error?: string } | null;
    setBusy(null);
    if (res?.ok && body?.sale) {
      onChange(body.sale);
      toast.success("Invite sent again");
    } else toast.error(body?.error ?? "Couldn't resend the invite");
  }

  async function cancel() {
    setBusy("cancel");
    const res = await fetch(`/api/sales/${sale.id}`, { method: "DELETE" }).catch(() => null);
    setBusy(null);
    if (res?.ok) {
      onChange(null);
      toast.success("Invite canceled");
    } else toast.error("Couldn't cancel the invite");
  }

  async function copy() {
    await navigator.clipboard.writeText(sale.url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  const steps = [
    { label: "Invite sent", done: true, at: sale.createdAt },
    { label: `${sale.buyerName.split(" ")[0]} opened it`, done: !!sale.viewedAt, at: sale.viewedAt },
    { label: "Paid", done: sold, at: sale.paidAt },
    ...(sale.monthlyCents ? [{ label: "Hosting started", done: sale.hostingStatus === "active", at: null }] : []),
  ];

  return (
    <div>
      <div className="rounded-[20px] bg-canvas p-5 ring-1 ring-hairline">
        <p className="text-[13px] font-medium text-fg-3">{sold ? "Sold to" : "Offered to"}</p>
        <p className="mt-1 text-[17px] font-semibold">{sale.buyerName}</p>
        <p className="flex items-center gap-1.5 text-[14px] text-fg-2">
          <Mail size={14} strokeWidth={1.75} /> {sale.buyerEmail}
        </p>
        <p className="mt-3 text-[15px] tabular-nums">
          {money(sale.priceCents)}
          {sale.monthlyCents ? <span className="text-fg-2"> + {money(sale.monthlyCents)}/mo hosting</span> : null}
        </p>
      </div>

      <ol className="mt-6 space-y-3">
        {steps.map((s) => (
          <li key={s.label} className="flex items-center gap-3 text-[15px]">
            <span
              className={`grid size-7 shrink-0 place-items-center rounded-full ${s.done ? "bg-octa-600 text-white" : "bg-fg/[.07] text-fg-3"}`}
            >
              {s.done ? <Check size={14} strokeWidth={2.5} /> : <span className="size-1.5 rounded-full bg-current" />}
            </span>
            <span className={s.done ? "" : "text-fg-3"}>{s.label}</span>
            {s.done && s.at && <span className="ml-auto text-[13px] text-fg-3">{when.format(s.at)}</span>}
          </li>
        ))}
      </ol>

      {!sold && (
        <>
          <div className="mt-7 flex items-center gap-2 rounded-full bg-canvas p-1.5 pl-4 ring-1 ring-hairline">
            <span className="min-w-0 flex-1 truncate text-[13px] text-fg-2">{sale.url.replace("https://", "")}</span>
            <button onClick={copy} className="flex h-9 items-center gap-1.5 rounded-full bg-fg/[.06] px-3 text-[13px] font-medium hover:bg-fg/[.1]">
              {copied ? <Check size={14} strokeWidth={2.5} /> : <Copy size={14} strokeWidth={1.75} />} {copied ? "Copied" : "Copy link"}
            </button>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={resend}
              disabled={!!busy}
              className="h-11 flex-1 rounded-full bg-fg/[.06] text-[15px] font-medium hover:bg-fg/[.1] disabled:opacity-60"
            >
              {busy === "resend" ? "Sending…" : "Resend email"}
            </button>
            <button
              onClick={cancel}
              disabled={!!busy}
              className="h-11 flex-1 rounded-full text-[15px] font-medium text-red-600 hover:bg-red-500/10 disabled:opacity-60"
            >
              {busy === "cancel" ? "Canceling…" : "Cancel invite"}
            </button>
          </div>
        </>
      )}
      {sold && (
        <p className="mt-7 text-[14px] leading-[1.47] text-fg-2">
          The site belongs to {sale.buyerName} now. Keep editing it here — every deploy goes straight to their live site.
        </p>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  prefix,
  suffix,
  ...input
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  prefix?: string;
  suffix?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "prefix">) {
  return (
    <label className="block">
      <span className="text-[13px] font-medium text-fg-2">{label}</span>
      <span className="mt-1.5 flex h-12 items-center gap-1 rounded-[12px] bg-canvas px-4 ring-1 ring-hairline focus-within:ring-2 focus-within:ring-octa-600">
        {prefix && <span className="text-[15px] text-fg-3">{prefix}</span>}
        <input
          {...input}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-w-0 flex-1 bg-transparent text-[15px] tabular-nums placeholder:text-fg-3 focus:outline-none"
        />
        {suffix && <span className="text-[15px] text-fg-3">{suffix}</span>}
      </span>
    </label>
  );
}
