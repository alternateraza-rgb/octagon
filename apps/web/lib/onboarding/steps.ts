// The "Getting started" checklist, in order. Shared by the server (which works out what's done)
// and the client (which shows it).
export type StepId = "built" | "published" | "payouts" | "sent" | "sold";

export type Onboarding = {
  tourDone: boolean;
  checklistDismissed: boolean;
  steps: Record<StepId, boolean>;
};

export const STEPS: { id: StepId; title: string; why: string; href: string; cta: string }[] = [
  { id: "built", title: "Build your first website", why: "Describe a business and watch it come together.", href: "/dashboard/sites", cta: "Build a site" },
  { id: "published", title: "Publish it", why: "One click puts it live on its own address.", href: "/dashboard/sites", cta: "Open Websites" },
  { id: "payouts", title: "Set up payouts", why: "Connect once so clients can pay you directly.", href: "/dashboard/sales", cta: "Set up payouts" },
  { id: "sent", title: "Send your first checkout link", why: "Set a price and invite the business owner.", href: "/dashboard/sites", cta: "Pick a site" },
  { id: "sold", title: "Make your first sale", why: "When they pay, the site is theirs and the money is yours.", href: "/dashboard/sales", cta: "View sales" },
];

export const doneCount = (o: Onboarding) => STEPS.filter((s) => o.steps[s.id]).length;
