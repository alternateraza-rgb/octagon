"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { Conversation } from "@/lib/chat/store";
import type { Interval, PlanId } from "@/lib/billing/plans";
import { onUpgrade, type BillingStatus } from "@/lib/billing/client";
import { BillingDialog } from "@/components/billing/billing-dialog";
import type { Onboarding } from "@/lib/onboarding/steps";

export type Theme = "system" | "light" | "dark";
export type Me = { name: string; email: string };
export type BillingSummary = {
  plan: PlanId | null;
  interval: Interval;
  active: boolean;
  comped: boolean;
  pausesAt: number | null;
  builds: { used: number; limit: number } | null;
};

export const summarize = ({ access, usage }: BillingStatus): BillingSummary => ({
  plan: access.plan,
  interval: access.interval,
  active: access.active,
  comped: access.comped,
  pausesAt: access.pausesAt,
  builds: access.limits ? { used: usage.builds, limit: access.limits.builds } : null,
});

type Workspace = {
  me: Me;
  conversations: Conversation[];
  // Chats are kept here on the client so replies don't have to re-render the whole layout.
  upsertConversation: (c: Conversation) => void;
  removeConversation: (id: string) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  billing: BillingSummary;
  setBilling: (billing: BillingSummary) => void;
  // Opens plan selection and checkout, optionally straight into one plan's checkout.
  openBilling: (options?: { plan?: PlanId; interval?: Interval; message?: string }) => void;
  // First-run tour and the "Getting started" checklist.
  onboarding: Onboarding;
  tourOpen: boolean;
  openTour: () => void;
  closeTour: () => void;
  dismissChecklist: () => void;
  // Re-reads checklist progress (the layout isn't re-rendered as people move between pages).
  refreshOnboarding: () => void;
};

const WorkspaceContext = createContext<Workspace | null>(null);

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace outside WorkspaceProvider");
  return ctx;
}

export function WorkspaceProvider({
  me,
  initialConversations,
  initialTheme,
  initialBilling,
  initialOnboarding,
  children,
}: {
  me: Me;
  initialConversations: Conversation[];
  initialTheme: Theme;
  initialBilling: BillingSummary;
  initialOnboarding: Onboarding;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [conversations, setConversations] = useState(initialConversations);
  const [theme, setThemeState] = useState(initialTheme);
  const [billing, setBilling] = useState(initialBilling);
  const [dialog, setDialog] = useState<{ plan?: PlanId; interval?: Interval; message?: string } | null>(null);
  const [onboarding, setOnboarding] = useState(initialOnboarding);
  // New builders get the tour once, as soon as they arrive with a plan (never over the paywall).
  const [tourOpen, setTourOpen] = useState(!initialOnboarding.tourDone && initialBilling.active);

  const onboardingAction = (action: "tourDone" | "dismissChecklist") =>
    fetch("/api/onboarding", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action }) }).catch(
      () => null,
    );

  const refreshOnboarding = useCallback(async () => {
    const res = await fetch("/api/onboarding").catch(() => null);
    if (res?.ok) setOnboarding((await res.json()) as Onboarding);
  }, []);

  // Any request refused for the plan's limits opens the upgrade dialog with the reason.
  useEffect(() => onUpgrade((notice) => setDialog({ message: notice.error })), []);

  return (
    <WorkspaceContext.Provider
      value={{
        me,
        conversations,
        upsertConversation: (c) =>
          setConversations((list) => [c, ...list.filter((x) => x.id !== c.id)].sort((a, b) => b.updatedAt - a.updatedAt)),
        removeConversation: (id) => setConversations((list) => list.filter((x) => x.id !== id)),
        theme,
        setTheme: (t) => {
          setThemeState(t);
          document.cookie = `theme=${t}; path=/; max-age=31536000; samesite=lax`;
        },
        billing,
        setBilling,
        openBilling: (options) => setDialog(options ?? {}),
        onboarding,
        tourOpen,
        openTour: () => setTourOpen(true),
        closeTour: () => {
          setTourOpen(false);
          // Finishing or skipping both count: it only opens by itself once.
          if (!onboarding.tourDone) {
            setOnboarding((o) => ({ ...o, tourDone: true }));
            onboardingAction("tourDone");
          }
        },
        dismissChecklist: () => {
          setOnboarding((o) => ({ ...o, checklistDismissed: true }));
          onboardingAction("dismissChecklist");
        },
        refreshOnboarding,
      }}
    >
      {children}
      <BillingDialog
        open={!!dialog}
        plan={dialog?.plan ? { plan: dialog.plan, interval: dialog.interval ?? "month" } : null}
        message={dialog?.message}
        current={billing.active && billing.plan ? { plan: billing.plan, interval: billing.interval } : null}
        theme={theme}
        onClose={() => setDialog(null)}
        onActivated={(status) => {
          setBilling(summarize(status));
          router.refresh();
        }}
      />
    </WorkspaceContext.Provider>
  );
}
