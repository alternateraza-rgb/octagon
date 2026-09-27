"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, Check, CreditCard, Globe, LogOut, Mail, MessageSquare, X } from "lucide-react";
import { authClient } from "@/lib/auth/client";
import { money } from "@/lib/sales/money";

export type OwnedSite = {
  id: string;
  title: string;
  url: string | null;
  live: boolean;
  buyUrl: string;
  monthlyCents: number | null;
  hostingStatus: "none" | "active" | "ended";
  manageUrl: string | null;
  paidAt: number | null;
  sellerName: string;
  sellerEmail: string;
};

const since = new Intl.DateTimeFormat("en", { month: "long", year: "numeric" });

function Mark() {
  return (
    <a href="https://octacore.app" className="flex items-center gap-2 text-[17px] font-semibold tracking-[-0.02em]">
      <span className="size-2.5 rounded-full bg-octa-600" /> octacore
    </a>
  );
}

// The owner page: every site this person bought, with its live link, billing and a line to its builder.
export function OwnerView({ name, email, builder, sites }: { name: string; email: string; builder: boolean; sites: OwnedSite[] }) {
  const reduce = useReducedMotion();
  const router = useRouter();
  const [requesting, setRequesting] = useState<OwnedSite | null>(null);

  async function signOut() {
    await authClient.signOut().catch(() => {});
    router.push("/owner/sign-in");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-[880px] px-5 pb-24 pt-8">
      <header className="flex items-center justify-between">
        <Mark />
        <div className="flex items-center gap-1">
          {builder && (
            <a href="/dashboard" className="h-11 rounded-full px-4 text-[14px] leading-[44px] text-fg-2 hover:bg-fg/5 hover:text-fg">
              Dashboard
            </a>
          )}
          <button onClick={signOut} className="flex h-11 items-center gap-2 rounded-full px-4 text-[14px] text-fg-2 hover:bg-fg/5 hover:text-fg">
            <LogOut size={15} strokeWidth={1.75} /> Sign out
          </button>
        </div>
      </header>

      <motion.h1
        initial={reduce ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 90, damping: 18 }}
        className="mt-14 font-[family-name:var(--font-display)] text-[40px] font-semibold leading-[1.05] tracking-[-0.04em] sm:text-[52px]"
      >
        {sites.length === 1 ? "Your website" : "Your websites"}
      </motion.h1>
      <p className="mt-3 text-[17px] text-fg-2">
        Signed in as {name} · {email}
      </p>

      {sites.length === 0 ? (
        <p className="mt-12 rounded-[24px] bg-elevated p-8 text-[15px] text-fg-2 shadow-soft ring-1 ring-hairline">
          There are no websites registered to this email yet. If you just paid, give it a minute and refresh.
        </p>
      ) : (
        <ul className="mt-10 space-y-5">
          {sites.map((site, i) => (
            <motion.li
              key={site.id}
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 110, damping: 20, delay: 0.08 * i }}
              className="overflow-hidden rounded-[28px] bg-elevated shadow-soft ring-1 ring-hairline"
            >
              {site.url && site.live && (
                <div className="relative h-[220px] overflow-hidden bg-canvas-2 sm:h-[300px]">
                  <iframe
                    src={site.url}
                    title={`${site.title} preview`}
                    tabIndex={-1}
                    loading="lazy"
                    className="pointer-events-none absolute left-0 top-0 h-[250%] w-[250%] origin-top-left scale-[0.4] border-0 bg-white"
                  />
                </div>
              )}
              <div className="p-6 sm:p-7">
                <div className="flex flex-wrap items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[24px] font-semibold tracking-[-0.02em]">{site.title}</p>
                    <p className="mt-1 text-[14px] text-fg-2">
                      Built by {site.sellerName}
                      {site.paidAt ? ` · yours since ${since.format(site.paidAt)}` : ""}
                    </p>
                  </div>
                  <Status site={site} />
                </div>

                {site.monthlyCents && site.hostingStatus !== "active" && (
                  <div className="mt-5 flex flex-wrap items-center gap-3 rounded-[18px] bg-octa-600/10 p-4">
                    <p className="min-w-0 flex-1 text-[15px] text-octa-800 dark:text-octa-100">
                      {site.hostingStatus === "ended"
                        ? "Hosting has ended, so your site is offline. Restart it to bring the site back instantly."
                        : `Start hosting (${money(site.monthlyCents)}/mo) to put your site online.`}
                    </p>
                    <a
                      href={site.buyUrl}
                      className="flex h-11 items-center rounded-full bg-octa-600 px-5 text-[15px] font-medium text-white hover:bg-octa-500"
                    >
                      {site.hostingStatus === "ended" ? "Restart hosting" : "Start hosting"}
                    </a>
                  </div>
                )}

                <div className="mt-6 flex flex-wrap gap-2">
                  {site.url && site.live && (
                    <a
                      href={site.url}
                      target="_blank"
                      rel="noopener"
                      className="flex h-11 items-center gap-2 rounded-full bg-fg px-5 text-[15px] font-medium text-canvas hover:opacity-90"
                    >
                      <Globe size={16} strokeWidth={1.75} /> {site.url.replace("https://", "")} <ArrowUpRight size={15} />
                    </a>
                  )}
                  <button
                    onClick={() => setRequesting(site)}
                    className="flex h-11 items-center gap-2 rounded-full bg-fg/[.06] px-5 text-[15px] font-medium hover:bg-fg/[.1]"
                  >
                    <MessageSquare size={16} strokeWidth={1.75} /> Request a change
                  </button>
                  {site.manageUrl && (
                    <a
                      href={site.manageUrl}
                      target="_blank"
                      rel="noopener"
                      className="flex h-11 items-center gap-2 rounded-full bg-fg/[.06] px-5 text-[15px] font-medium hover:bg-fg/[.1]"
                    >
                      <CreditCard size={16} strokeWidth={1.75} /> Billing
                    </a>
                  )}
                  <a
                    href={`mailto:${site.sellerEmail}`}
                    className="flex h-11 items-center gap-2 rounded-full px-4 text-[15px] text-fg-2 hover:bg-fg/5 hover:text-fg"
                  >
                    <Mail size={16} strokeWidth={1.75} /> Email {site.sellerName.split(" ")[0]}
                  </a>
                </div>
              </div>
            </motion.li>
          ))}
        </ul>
      )}

      <AnimatePresence>{requesting && <RequestDialog site={requesting} onClose={() => setRequesting(null)} />}</AnimatePresence>
    </div>
  );
}

function Status({ site }: { site: OwnedSite }) {
  const [label, tone] = site.live
    ? ["Live", "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"]
    : site.monthlyCents && site.hostingStatus !== "active"
      ? ["Offline", "bg-fg/[.07] text-fg-2"]
      : ["Getting ready", "bg-amber-500/15 text-amber-700 dark:text-amber-300"];
  return (
    <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-medium ${tone}`}>
      {site.live && <span className="size-1.5 rounded-full bg-emerald-500" />}
      {label}
    </span>
  );
}

function RequestDialog({ site, onClose }: { site: OwnedSite; onClose: () => void }) {
  const reduce = useReducedMotion();
  const [text, setText] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    setError("");
    const res = await fetch(`/api/owner/sites/${site.id}/request`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: text }),
    }).catch(() => null);
    const body = (await res?.json().catch(() => null)) as { error?: string } | null;
    if (res?.ok) setState("sent");
    else {
      setState("idle");
      setError(body?.error ?? "Couldn't send your request. Try again.");
    }
  }

  return (
    <div className="fixed inset-0 z-[90] grid place-items-center px-4" onKeyDown={(e) => e.key === "Escape" && onClose()}>
      <motion.div className="absolute inset-0 bg-black/30 backdrop-blur-[3px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div
        role="dialog"
        aria-modal
        aria-labelledby="request-title"
        initial={reduce ? false : { opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 420, damping: 32 }}
        className="relative w-full max-w-[460px] rounded-[24px] bg-elevated p-6 shadow-float ring-1 ring-hairline"
      >
        <button onClick={onClose} aria-label="Close" className="absolute right-3 top-3 grid size-11 place-items-center rounded-full text-fg-2 hover:bg-fg/5">
          <X size={18} strokeWidth={1.5} />
        </button>
        {state === "sent" ? (
          <div className="py-4 text-center">
            <span className="mx-auto grid size-14 place-items-center rounded-full bg-octa-600 text-white">
              <Check size={26} strokeWidth={2.5} />
            </span>
            <p className="mt-5 text-[19px] font-semibold">Request sent</p>
            <p className="mt-2 text-[15px] text-fg-2">{site.sellerName} will get back to you by email.</p>
            <button onClick={onClose} className="mt-6 h-11 w-full rounded-full bg-fg/[.06] text-[15px] font-medium hover:bg-fg/[.1]">
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={send}>
            <h2 id="request-title" className="pr-10 text-[21px] font-semibold tracking-[-0.02em]">
              Request a change
            </h2>
            <p className="mt-1 text-[15px] text-fg-2">Tell {site.sellerName} what you&apos;d like updated on {site.title}.</p>
            <textarea
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={5}
              maxLength={2000}
              placeholder="e.g. Update our Saturday hours to 9am–2pm and add a photo of the new storefront."
              className="mt-4 w-full resize-none rounded-[14px] bg-canvas px-4 py-3 text-[15px] ring-1 ring-hairline placeholder:text-fg-3 focus:outline-none focus:ring-2 focus:ring-octa-600"
            />
            {error && (
              <p role="alert" className="mt-3 text-[14px] text-red-600">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={state === "sending" || text.trim().length < 5}
              className="mt-4 h-12 w-full rounded-full bg-octa-600 text-[15px] font-medium text-white hover:bg-octa-500 disabled:opacity-50"
            >
              {state === "sending" ? "Sending…" : "Send request"}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}

// Owners have no password: they sign in with a link sent to the email they bought with.
export function OwnerSignIn({ email: initialEmail, expired }: { email: string; expired: boolean }) {
  const reduce = useReducedMotion();
  const [email, setEmail] = useState(initialEmail);
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setState("sending");
    setError("");
    const { error } = await authClient.signIn.magicLink({
      email: email.trim(),
      callbackURL: "/owner",
      errorCallbackURL: "/owner/sign-in?error=expired",
    });
    // Unknown emails are treated the same as known ones, so this can't be used to look people up.
    if (error && error.status !== 404 && !/not found/i.test(error.message ?? "")) {
      setState("idle");
      setError(error.status === 429 ? "Too many tries. Wait a minute and try again." : "Couldn't send the link. Try again.");
      return;
    }
    setState("sent");
  }

  return (
    <main className="grid min-h-dvh place-items-center px-5">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 110, damping: 20 }}
        className="w-full max-w-[400px]"
      >
        <Mark />
        {state === "sent" ? (
          <>
            <h1 className="mt-10 text-[34px] font-semibold leading-tight tracking-[-0.03em]">Check your email</h1>
            <p className="mt-3 text-[17px] leading-[1.47] text-fg-2">
              If <span className="font-medium text-fg">{email}</span> owns a website on Octacore, a sign-in link is on its way.
            </p>
            <button onClick={() => setState("idle")} className="mt-6 text-[15px] text-octa-600 hover:underline">
              Use a different email
            </button>
          </>
        ) : (
          <form onSubmit={send}>
            <h1 className="mt-10 text-[34px] font-semibold leading-tight tracking-[-0.03em]">See your website</h1>
            <p className="mt-3 text-[17px] leading-[1.47] text-fg-2">
              {expired ? "That link has expired or was already used. Get a fresh one below." : "Enter the email you bought your website with. We'll send you a sign-in link."}
            </p>
            <label className="mt-7 block">
              <span className="sr-only">Email</span>
              <input
                type="email"
                required
                autoFocus
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@business.com"
                className="h-12 w-full rounded-[12px] bg-elevated px-4 text-[16px] ring-1 ring-hairline placeholder:text-fg-3 focus:outline-none focus:ring-4 focus:ring-octa-600/15"
              />
            </label>
            {error && (
              <p role="alert" className="mt-3 text-[14px] text-red-600">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={state === "sending"}
              className="mt-4 h-12 w-full rounded-full bg-octa-600 text-[15px] font-medium text-white hover:bg-octa-500 disabled:opacity-60"
            >
              {state === "sending" ? "Sending…" : "Email me a sign-in link"}
            </button>
            <p className="mt-6 text-[14px] text-fg-3">
              Build websites with Octacore?{" "}
              <a href="/login" className="text-octa-600 hover:underline">
                Log in here
              </a>
            </p>
          </form>
        )}
      </motion.div>
    </main>
  );
}
