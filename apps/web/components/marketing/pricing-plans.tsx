"use client";

import { useRouter } from "next/navigation";
import { PlanCards } from "@/components/billing/plan-cards";

// The plan picker on /pricing: choosing a plan starts sign-up, which asks for the plan again at checkout.
export function PricingPlans() {
  const router = useRouter();
  return <PlanCards onChoose={() => router.push("/start")} />;
}
