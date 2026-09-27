"use client";

import Link from "next/link";
import { useMemo } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, Tag } from "lucide-react";
import type { PublicSale } from "@/lib/sales/invite";
import { money, sellerShare } from "@/lib/sales/money";

const when = new Intl.DateTimeFormat("en", { month: "short", day: "numeric" });

const STATUS: Record<PublicSale["status"], { label: string; tone: string }> = {
  sent: { label: "Sent", tone: "bg-fg/[.07] text-fg-2" },
  viewed: { label: "Opened", tone: "bg-sky-500/15 text-sky-700 dark:text-sky-300" },
  paid: { label: "Paid", tone: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" },
  expired: { label: "Expired", tone: "bg-fg/[.05] text-fg-3" },
  canceled: { label: "Canceled", tone: "bg-fg/[.05] text-fg-3" },
};

// Every site the user has offered to a client, and what they've earned.
export function SalesView({ sales }: { sales: PublicSale[] }) {
  const reduce = useReducedMotion();
  const stats = useMemo(() => {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const paid = sales.filter((s) => s.status === "paid");
    return [
      { label: "Earned this month", value: money(paid.filter((s) => (s.paidAt ?? 0) >= monthStart.getTime()).reduce((n, s) => n + sellerShare(s.priceCents), 0)) },
      {
        label: "Monthly hosting",
        value: `${money(sales.filter((s) => s.hostingStatus === "active").reduce((n, s) => n + sellerShare(s.monthlyCents ?? 0), 0))}/mo`,
      },
      { label: "Open invites", value: String(sales.filter((s) => s.status === "sent" || s.status === "viewed").length) },
    ];
  }, [sales]);

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-[1120px] px-5 pb-24 pt-12 sm:pt-16">
        <motion.h1
          initial={reduce ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 90, damping: 18 }}
          className="font-[family-name:var(--font-display)] text-[44px] font-semibold leading-[1] tracking-[-0.045em] sm:text-[56px]"
        >
          Sales
        </motion.h1>
        <p className="mt-3 text-[17px] text-fg-2">Sell a site from the builder: your client gets a preview and pays you directly.</p>

        <ul className="mt-9 grid gap-3 sm:grid-cols-3">
          {stats.map((s) => (
            <li key={s.label} className="rounded-[22px] bg-elevated p-5 shadow-soft ring-1 ring-hairline">
              <p className="text-[13px] font-medium text-fg-3">{s.label}</p>
              <p className="mt-2 text-[28px] font-semibold tabular-nums tracking-[-0.02em]">{s.value}</p>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[12px] text-fg-3">After Octacore&apos;s 10%, before Whop&apos;s processing fees.</p>

        {sales.length ? (
          <ul className="mt-10 overflow-hidden rounded-[24px] bg-elevated shadow-soft ring-1 ring-hairline">
            {sales.map((sale) => (
              <li key={sale.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-hairline px-5 py-4 last:border-b-0">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[17px] font-semibold tracking-[-0.01em]">{sale.siteTitle ?? "Untitled site"}</p>
                  <p className="truncate text-[14px] text-fg-2">
                    {sale.buyerName} · {sale.buyerEmail}
                  </p>
                </div>
                <p className="text-[15px] tabular-nums">
                  {money(sale.priceCents)}
                  {sale.monthlyCents ? <span className="text-fg-3"> + {money(sale.monthlyCents)}/mo</span> : null}
                </p>
                <span className={`rounded-full px-2.5 py-1 text-[12px] font-medium ${STATUS[sale.status].tone}`}>
                  {STATUS[sale.status].label}
                  {sale.status === "paid" && sale.monthlyCents
                    ? sale.hostingStatus === "active"
                      ? " · hosting on"
                      : sale.hostingStatus === "ended"
                        ? " · hosting ended"
                        : " · no hosting yet"
                    : ""}
                </span>
                <span className="w-16 text-right text-[13px] text-fg-3">{when.format(sale.paidAt ?? sale.createdAt)}</span>
                <Link
                  href={`/dashboard/sites/${sale.siteId}`}
                  aria-label={`Open ${sale.siteTitle ?? "site"} in the builder`}
                  className="grid size-11 place-items-center rounded-full text-fg-2 hover:bg-fg/5 hover:text-fg"
                >
                  <ArrowUpRight size={18} strokeWidth={1.5} />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-10 grid place-items-center rounded-[28px] bg-elevated px-6 py-16 text-center shadow-soft ring-1 ring-hairline">
            <span className="grid size-14 place-items-center rounded-full bg-octa-600/10 text-octa-600">
              <Tag size={24} strokeWidth={1.5} />
            </span>
            <p className="mt-5 text-[21px] font-semibold tracking-[-0.02em]">No sales yet</p>
            <p className="mt-2 max-w-[420px] text-[15px] text-fg-2">
              Open any site in the builder and press Sell. Set a price, add your client&apos;s email, and they&apos;ll get a link to buy it.
            </p>
            <Link
              href="/dashboard/sites"
              className="mt-6 flex h-11 items-center rounded-full bg-octa-600 px-5 text-[15px] font-medium text-white hover:bg-octa-500"
            >
              Go to your websites
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
