"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, Check, Globe, Lock, MessageSquareQuote, X } from "lucide-react";
import { clearWhopOverlays } from "@/lib/billing/whop-overlays";
import { money } from "@/lib/sales/money";

const WhopCheckoutEmbed = dynamic(() => import("@whop/checkout/react").then((m) => m.WhopCheckoutEmbed), {
  ssr: false,
  loading: () => <EmbedLoading />,
});

type SaleInfo = {
  siteTitle: string;
  sellerName: string;
  buyerName: string;
  buyerEmail: string;
  message: string | null;
  priceCents: number;
  monthlyCents: number | null;
  currency: string;
  status: "sent" | "viewed" | "paid" | "canceled";
  hostingStatus: "none" | "active" | "ended";
};

type Kind = "site" | "hosting";
type Checkout = { kind: Kind; id: string; purchaseUrl: string };

const first = (name: string) => name.split(" ")[0] || name;
const spring = { type: "spring", stiffness: 320, damping: 32 } as const;

// The invite page: the client's new site full-screen, with a floating bar to buy it. Paying runs
// in Whop's embedded checkout, first for the site, then (if the seller charges for it) hosting.
export function BuyView({ token, sale: initial, returning }: { token: string; sale: SaleInfo; returning: boolean }) {
  const reduce = useReducedMotion();
  const [sale, setSale] = useState(initial);
  // Back from Whop's own checkout tab (the fallback link): pick up where the purchase left off.
  const [open, setOpen] = useState(returning);
  const [showNote, setShowNote] = useState(!!initial.message);
  const paid = sale.status === "paid";
  const needsHosting = paid && !!sale.monthlyCents && sale.hostingStatus !== "active";
  const owned = paid && !needsHosting;

  return (
    <main className="fixed inset-0 bg-canvas-2">
      <iframe
        src={`/buy/${token}/site`}
        title={`${sale.siteTitle} — website preview`}
        className="absolute inset-0 h-full w-full border-0 bg-white"
      />

      <motion.div
        initial={reduce ? false : { opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring, delay: 0.2 }}
        className="bg-elevated/90 backdrop-blur-xl backdrop-saturate-150 pointer-events-none absolute left-4 top-4 flex h-10 items-center gap-2 rounded-full px-4 text-[13px] shadow-soft ring-1 ring-hairline"
      >
        <span className="size-2 rounded-full bg-octa-600" />
        <span className="text-fg-2">
          Made for {first(sale.buyerName)} by <span className="font-medium text-fg">{sale.sellerName}</span>
        </span>
      </motion.div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 px-4 pb-4 sm:pb-6">
        <AnimatePresence>
          {showNote && sale.message && !owned && (
            <motion.figure
              initial={reduce ? false : { opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ ...spring, delay: 0.6 }}
              className="bg-elevated/90 backdrop-blur-xl backdrop-saturate-150 pointer-events-auto relative w-full max-w-[720px] rounded-[22px] p-5 pr-12 shadow-float ring-1 ring-hairline"
            >
              <MessageSquareQuote size={18} strokeWidth={1.5} className="text-octa-600" />
              <blockquote className="mt-2 whitespace-pre-line text-[15px] leading-[1.5]">{sale.message}</blockquote>
              <figcaption className="mt-2 text-[13px] text-fg-3">— {sale.sellerName}</figcaption>
              <button
                onClick={() => setShowNote(false)}
                aria-label="Hide message"
                className="absolute right-2 top-2 grid size-11 place-items-center rounded-full text-fg-3 hover:bg-fg/5 hover:text-fg"
              >
                <X size={16} strokeWidth={1.75} />
              </button>
            </motion.figure>
          )}
        </AnimatePresence>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.35 }}
          className="bg-elevated/90 backdrop-blur-xl backdrop-saturate-150 pointer-events-auto flex w-full max-w-[720px] flex-col gap-4 rounded-[28px] p-4 pl-6 shadow-float ring-1 ring-hairline sm:flex-row sm:items-center"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-[17px] font-semibold tracking-[-0.01em]">{sale.siteTitle}</p>
            <p className="mt-0.5 text-[14px] text-fg-2">
              {owned
                ? `Owned by ${sale.buyerName}`
                : needsHosting
                  ? `Yours — start hosting to put it online`
                  : sale.monthlyCents
                    ? `${money(sale.priceCents, sale.currency)}, then ${money(sale.monthlyCents, sale.currency)}/mo hosting`
                    : `${money(sale.priceCents, sale.currency)} · one payment`}
            </p>
          </div>
          {owned ? (
            <a
              href="/owner"
              className="flex h-12 items-center justify-center gap-2 rounded-full bg-fg px-6 text-[15px] font-medium text-canvas transition-opacity hover:opacity-90"
            >
              Your owner page <ArrowUpRight size={16} />
            </a>
          ) : (
            <button
              onClick={() => setOpen(true)}
              className="h-12 rounded-full bg-octa-600 px-7 text-[16px] font-medium text-white shadow-[0_8px_24px_-8px_rgba(194,65,12,.6)] transition-colors hover:bg-octa-500"
            >
              {needsHosting ? "Start hosting" : "Buy this website"}
            </button>
          )}
        </motion.div>
      </div>

      <AnimatePresence>
        {open && <CheckoutSheet token={token} sale={sale} onSale={setSale} onClose={() => setOpen(false)} />}
      </AnimatePresence>
    </main>
  );
}

function CheckoutSheet({
  token,
  sale,
  onSale,
  onClose,
}: {
  token: string;
  sale: SaleInfo;
  onSale: (sale: SaleInfo) => void;
  onClose: () => void;
}) {
  const reduce = useReducedMotion();
  const withHosting = !!sale.monthlyCents;
  const step: Kind | "done" =
    sale.status !== "paid" ? "site" : withHosting && sale.hostingStatus !== "active" ? "hosting" : "done";
  // Each step's checkout, keyed by step so moving on starts clean.
  const [loaded, setLoaded] = useState<{ kind: Kind; checkout?: Checkout; error?: string } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [readyId, setReadyId] = useState<string | null>(null);
  // Paid in the embed; waiting for the payment to be confirmed.
  const [confirming, setConfirming] = useState(false);
  const [slow, setSlow] = useState(false);
  const current = step !== "done" && loaded?.kind === step ? loaded : null;
  const checkout = current?.checkout ?? null;
  const error = current?.error ?? "";
  const ready = !!checkout && readyId === checkout.id;
  const saleRef = useRef({ sale, onSale });
  useEffect(() => {
    saleRef.current = { sale, onSale };
  });

  useEffect(() => {
    if (step === "done") return;
    let stale = false;
    fetch(`/api/buy/${token}/checkout`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kind: step }),
    })
      .then(async (res) => {
        const body = (await res.json().catch(() => null)) as { id?: string; purchaseUrl?: string; error?: string } | null;
        if (stale) return;
        if (res.ok && body?.id) setLoaded({ kind: step, checkout: { kind: step, id: body.id, purchaseUrl: body.purchaseUrl ?? "" } });
        else setLoaded({ kind: step, error: body?.error ?? "Couldn't start checkout. Try again." });
      })
      .catch(() => !stale && setLoaded({ kind: step, error: "Couldn't start checkout. Try again." }));
    return () => {
      stale = true;
    };
  }, [step, token, attempt]);

  // Reveal the embed even if it never reports its state.
  useEffect(() => {
    if (!checkout) return;
    const timer = setTimeout(() => setReadyId(checkout.id), 6000);
    return () => clearTimeout(timer);
  }, [checkout]);

  // Watch for the payment to land: quickly after the embed reports it, slowly otherwise (paying
  // in Whop's own tab never calls back here).
  useEffect(() => {
    if (step === "done") return;
    let stopped = false;
    const startedAt = Date.now();
    const tick = async () => {
      const res = await fetch(`/api/buy/${token}/status`, { cache: "no-store" }).catch(() => null);
      const body = (await res?.json().catch(() => null)) as Pick<SaleInfo, "status" | "hostingStatus"> | null;
      if (stopped) return;
      const { sale: current, onSale: update } = saleRef.current;
      if (body && (body.status !== current.status || body.hostingStatus !== current.hostingStatus)) {
        setConfirming(false);
        setSlow(false);
        update({ ...current, ...body });
        return;
      }
      if (confirming && Date.now() - startedAt > 45_000) setSlow(true);
      timer = setTimeout(tick, confirming ? 2000 : 6000);
    };
    let timer = setTimeout(tick, confirming ? 1000 : 6000);
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [step, token, confirming]);

  useEffect(() => {
    if (step !== "done") return;
    const timers = [0, 2000].map((ms) => setTimeout(clearWhopOverlays, ms));
    return () => timers.forEach(clearTimeout);
  }, [step]);
  useEffect(() => () => void setTimeout(clearWhopOverlays, 0), []);

  const closable = !confirming || slow;
  const title = step === "site" ? "Make it yours" : step === "hosting" ? "Put it online" : "It's yours";

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-stretch sm:justify-end" onKeyDown={(e) => e.key === "Escape" && closable && onClose()}>
      <motion.div
        className="absolute inset-0 bg-black/35 backdrop-blur-[3px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => closable && onClose()}
      />
      <motion.section
        role="dialog"
        aria-modal
        aria-labelledby="buy-title"
        initial={reduce ? { opacity: 0 } : { y: "100%" }}
        animate={reduce ? { opacity: 1 } : { y: 0 }}
        exit={reduce ? { opacity: 0 } : { y: "100%" }}
        transition={spring}
        className="relative flex max-h-[92dvh] w-full flex-col rounded-t-[28px] bg-elevated shadow-float ring-1 ring-hairline sm:max-h-none sm:max-w-[500px] sm:rounded-none sm:rounded-l-[28px]"
      >
        <header className="flex items-start gap-3 px-6 pb-4 pt-6">
          <div className="min-w-0 flex-1">
            <h2 id="buy-title" className="text-[28px] font-semibold leading-tight tracking-[-0.025em]">
              {title}
            </h2>
            {withHosting && step !== "done" && <Steps step={step} />}
          </div>
          {closable && (
            <button
              onClick={onClose}
              aria-label="Close"
              className="-mr-2 grid size-11 shrink-0 place-items-center rounded-full text-fg-2 hover:bg-fg/5 hover:text-fg"
            >
              <X size={20} strokeWidth={1.5} />
            </button>
          )}
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
          <AnimatePresence mode="wait">
            {step === "done" ? (
              <Done key="done" sale={sale} />
            ) : (
              <motion.div key={step} initial={reduce ? false : { opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={spring}>
                <Summary sale={sale} step={step} />

                {confirming && <Confirming slow={slow} />}
                {error && (
                  <p role="alert" className="mt-4 rounded-[16px] bg-red-500/10 px-4 py-3 text-[14px] text-red-700 dark:text-red-300">
                    {error}{" "}
                    <button onClick={() => setAttempt((n) => n + 1)} className="font-medium underline">
                      Try again
                    </button>
                  </p>
                )}
                {checkout && (
                  // Stays mounted after payment so Whop can finish and close its own overlay.
                  <div className={confirming ? "pointer-events-none absolute h-0 overflow-hidden opacity-0" : "relative mt-5 min-h-[420px]"}>
                    {!ready && (
                      <div className="absolute inset-0">
                        <EmbedLoading />
                      </div>
                    )}
                    <div className={`transition-opacity duration-300 ${ready ? "opacity-100" : "opacity-0"}`}>
                      <WhopCheckoutEmbed
                        key={checkout.id}
                        sessionId={checkout.id}
                        theme="system"
                        skipRedirect
                        prefill={{ email: sale.buyerEmail }}
                        themeOptions={{ accentColor: "#c2410c", borderRadius: 12 }}
                        onStateChange={(state) => state !== "loading" && setReadyId(checkout.id)}
                        onComplete={() => setConfirming(true)}
                      />
                    </div>
                  </div>
                )}
                {!checkout && !error && <EmbedLoading />}

                {!confirming && (
                  <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-[12px] text-fg-3">
                    <Lock size={12} strokeWidth={2} /> Secure payment by Whop, paid to {sale.sellerName}.
                    {checkout?.purchaseUrl && (
                      <a href={checkout.purchaseUrl} target="_blank" rel="noopener" className="ml-1 underline hover:text-fg">
                        Open in a new tab
                      </a>
                    )}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.section>
    </div>
  );
}

function Steps({ step }: { step: Kind }) {
  const items: { id: Kind; label: string }[] = [
    { id: "site", label: "Website" },
    { id: "hosting", label: "Hosting" },
  ];
  return (
    <ol className="mt-3 flex items-center gap-2 text-[13px]">
      {items.map((item, i) => {
        const done = step === "hosting" && item.id === "site";
        const current = item.id === step;
        return (
          <li key={item.id} className="flex items-center gap-2">
            {i > 0 && <span className="h-px w-5 bg-hairline" />}
            <span
              className={`flex h-7 items-center gap-1.5 rounded-full px-3 font-medium ${
                current ? "bg-octa-600/10 text-octa-700 dark:text-octa-400" : done ? "text-fg-2" : "text-fg-3"
              }`}
            >
              {done ? <Check size={13} strokeWidth={2.5} /> : <span className="tabular-nums">{i + 1}</span>}
              {item.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function Summary({ sale, step }: { sale: SaleInfo; step: Kind }) {
  const rows =
    step === "site"
      ? [
          { label: `${sale.siteTitle} website`, sub: "Designed and built for you, yours to keep", value: money(sale.priceCents, sale.currency) },
          ...(sale.monthlyCents
            ? [{ label: "Hosting", sub: "Next step · keeps your site online", value: `${money(sale.monthlyCents, sale.currency)}/mo` }]
            : []),
        ]
      : [{ label: "Hosting", sub: "Your site online, billed monthly · cancel anytime", value: `${money(sale.monthlyCents!, sale.currency)}/mo` }];
  const today = step === "site" ? sale.priceCents : sale.monthlyCents!;
  return (
    <div className="rounded-[20px] bg-canvas p-5 ring-1 ring-hairline">
      <ul className="space-y-3">
        {rows.map((r) => (
          <li key={r.label} className="flex items-start justify-between gap-4 text-[15px]">
            <div className="min-w-0">
              <p className="font-medium">{r.label}</p>
              <p className="text-[13px] text-fg-3">{r.sub}</p>
            </div>
            <p className="shrink-0 tabular-nums">{r.value}</p>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex items-baseline justify-between border-t border-hairline pt-4">
        <p className="text-[15px] font-medium">Due today</p>
        <p className="text-[22px] font-semibold tabular-nums tracking-[-0.02em]">{money(today, sale.currency)}</p>
      </div>
    </div>
  );
}

function Confirming({ slow }: { slow: boolean }) {
  return (
    <div className="grid place-items-center py-12 text-center" role="status">
      <span className="relative grid size-16 place-items-center">
        <span className="absolute inset-0 animate-ping rounded-full bg-octa-600/20" />
        <span className="size-4 rounded-full bg-octa-600" />
      </span>
      <p className="mt-6 max-w-[320px] text-[15px] text-fg-2">
        {slow ? "Payment received — confirming it is taking a little longer than usual. We'll email you as soon as it's done." : "Payment received. Confirming…"}
      </p>
    </div>
  );
}

function Done({ sale }: { sale: SaleInfo }) {
  const reduce = useReducedMotion();
  return (
    <motion.div initial={reduce ? false : { opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="pt-4 text-center">
      <motion.span
        initial={reduce ? false : { scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 16 }}
        className="mx-auto grid size-16 place-items-center rounded-full bg-octa-600 text-white shadow-float"
      >
        <Check size={30} strokeWidth={2.5} />
      </motion.span>
      <p className="mx-auto mt-6 max-w-[340px] text-[17px] leading-[1.47] text-fg-2">
        {sale.siteTitle} now belongs to you. We&apos;ve emailed <span className="font-medium text-fg">{sale.buyerEmail}</span> a link to
        your owner page.
      </p>
      <ul className="mx-auto mt-6 max-w-[340px] space-y-2 text-left text-[15px] text-fg-2">
        {[
          sale.monthlyCents ? "Your site is going online now" : "Your site is live",
          "Manage billing and see your site from your owner page",
          `Ask ${sale.sellerName} for changes any time`,
        ].map((line) => (
          <li key={line} className="flex items-start gap-2">
            <Check size={15} strokeWidth={2.5} className="mt-[3px] shrink-0 text-octa-600" /> {line}
          </li>
        ))}
      </ul>
      <a
        href="/owner"
        className="mt-8 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-octa-600 text-[15px] font-medium text-white transition-colors hover:bg-octa-500"
      >
        <Globe size={17} strokeWidth={1.75} /> Open your owner page
      </a>
    </motion.div>
  );
}

function EmbedLoading() {
  return (
    <div className="grid min-h-[420px] place-items-center">
      <span className="size-6 animate-spin rounded-full border-2 border-fg/15 border-t-octa-600" />
    </div>
  );
}

// Invite links that no longer lead anywhere.
export function InviteStatus({ kind, sellerName, sellerEmail }: { kind: "gone" | "expired"; sellerName?: string; sellerEmail?: string }) {
  return (
    <main className="grid min-h-dvh place-items-center bg-canvas px-5 text-center">
      <div className="max-w-[440px]">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-fg/[.06] text-fg-2">
          <Globe size={24} strokeWidth={1.5} />
        </span>
        <h1 className="mt-6 text-[32px] font-semibold tracking-[-0.03em]">
          {kind === "expired" ? "This invite has expired" : "This invite isn't available"}
        </h1>
        <p className="mt-3 text-[17px] leading-[1.47] text-fg-2">
          {kind === "expired" && sellerName ? (
            <>
              Ask {sellerName} to send you a new link
              {sellerEmail && (
                <>
                  {" "}
                  at{" "}
                  <a href={`mailto:${sellerEmail}`} className="text-octa-600 hover:underline">
                    {sellerEmail}
                  </a>
                </>
              )}
              .
            </>
          ) : (
            "The link may have been canceled or mistyped. Check with whoever sent it to you."
          )}
        </p>
        <a href="https://octacore.app" className="mt-8 inline-block text-[15px] text-octa-600 hover:underline">
          Built with Octacore ›
        </a>
      </div>
    </main>
  );
}
