// Browser side of plan limits: any request refused with 402 opens the upgrade dialog (the app shell
// listens for this event), so every feature gets the same upgrade path with one line.
export type UpgradeNotice = { error?: string; reason?: string };

const EVENT = "octa:upgrade";

export function noticeUpgrade(status: number | undefined, body: unknown) {
  if (status !== 402 || typeof window === "undefined") return false;
  window.dispatchEvent(new CustomEvent<UpgradeNotice>(EVENT, { detail: (body ?? {}) as UpgradeNotice }));
  return true;
}

export function onUpgrade(listener: (notice: UpgradeNotice) => void) {
  const handler = (e: Event) => listener((e as CustomEvent<UpgradeNotice>).detail);
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}

export type BillingStatus = {
  access: {
    plan: "starter" | "pro" | "agency" | null;
    active: boolean;
    comped: boolean;
    status: string;
    limits: Record<"builds" | "chat" | "sites" | "storage", number> | null;
    periodStart: number;
    periodEnd: number | null;
    cancelAtPeriodEnd: boolean;
    manageUrl: string | null;
    pausesAt: number | null;
  };
  usage: Record<"builds" | "chat" | "sites" | "storage", number>;
};

export async function fetchBillingStatus(): Promise<BillingStatus | null> {
  const res = await fetch("/api/billing/status", { cache: "no-store" }).catch(() => null);
  return res?.ok ? ((await res.json()) as BillingStatus) : null;
}
