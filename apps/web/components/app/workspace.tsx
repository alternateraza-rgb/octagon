"use client";

import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import type { Conversation } from "@/lib/chat/store";
import type { Interval, PlanId } from "@/lib/billing/plans";
import { onUpgrade, type BillingStatus } from "@/lib/billing/client";
import { BillingDialog } from "@/components/billing/billing-dialog";

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
  children,
}: {
  me: Me;
  initialConversations: Conversation[];
  initialTheme: Theme;
  initialBilling: BillingSummary;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [conversations, setConversations] = useState(initialConversations);
  const [theme, setThemeState] = useState(initialTheme);
  const [billing, setBilling] = useState(initialBilling);
  const [dialog, setDialog] = useState<{ plan?: PlanId; interval?: Interval; message?: string } | null>(null);

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
