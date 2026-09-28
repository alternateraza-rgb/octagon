import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Check, Minus } from "lucide-react";
import { JsonLd } from "@/components/json-ld";
import { CtaBand, MarketingPage, PageHero, QuestionList, Section, display } from "@/components/marketing/page";
import { PricingPlans } from "@/components/marketing/pricing-plans";
import { SupportLink } from "@/components/marketing/legal";
import { GRACE_DAYS } from "@/lib/billing/entitlements";
import { PLANS, YEARLY_SAVING, formatBytes, type Meter } from "@/lib/billing/plans";
import { PLATFORM_FEE } from "@/lib/sales/money";
import { absoluteUrl, breadcrumbs } from "@/lib/seo";

const FEE = `${Math.round(PLATFORM_FEE * 100)}%`;
const CHEAPEST = Math.min(...PLANS.map((p) => p.yearly));

export const metadata: Metadata = {
  title: "Pricing",
  description: `Octacore plans start at $${CHEAPEST}/month billed yearly. Build websites with AI, host them, and sell them to businesses — every plan includes hosting, checkout and ownership transfer.`,
  alternates: { canonical: "/pricing" },
};

const ROWS: [label: string, meter: Meter][] = [
  ["AI builds and edits a month", "builds"],
  ["Octa chat messages a month", "chat"],
  ["Live websites", "sites"],
  ["Upload storage", "storage"],
  ["Lead Finder leads a month", "leads"],
];

const EVERY_PLAN = [
  "Hosting on a global edge network, with SSL",
  "A free address for every site",
  "Checkout links to sell sites to clients",
  "One-click ownership transfer to buyers",
  "Octa Agents: Lead Finder and Demo Builder",
  "Templates for restaurants, salons, gyms and more",
];

const FAQS: [string, ReactNode][] = [
  ["Is there a fee when I sell a website?", `When a buyer pays through an Octacore checkout link, Octacore keeps a ${FEE} platform fee and the rest goes to your payout account. You can also transfer a site you were paid for elsewhere.`],
  ["Can I switch plans later?", "Yes. Move up or down from Settings › Billing at any time."],
  ["What does yearly billing save?", `Paying yearly saves up to ${YEARLY_SAVING}% compared with monthly. It's charged once a year; your monthly limits reset each month either way.`],
  ["What counts as an AI build?", "Each time Octacore generates or changes a site from your instructions — a new site, or an edit like “add a booking page” — counts as one build."],
  ["What happens to my sites if I cancel?", `Your plan stays active until the end of the period you've paid for. After that, your live sites keep running for a ${GRACE_DAYS}-day grace period, then pause until you renew. Sites you've sold and handed over belong to their owners.`],
  ["Can I get a refund?", <>Purchases are generally non-refundable. If something isn&apos;t working for you, email <SupportLink /> and we&apos;ll help.</>],
];

export default function PricingPage() {
  return (
    <MarketingPage>
      <JsonLd data={breadcrumbs([["Pricing", "/pricing"]])} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "Octacore",
          url: absoluteUrl("/"),
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web",
          offers: PLANS.map((p) => ({
            "@type": "Offer",
            name: p.name,
            price: p.price,
            priceCurrency: "USD",
            description: p.tagline,
            url: absoluteUrl("/pricing"),
          })),
        }}
      />
      <PageHero
        eyebrow="Pricing"
        title="One app to build, host and sell websites."
        intro={`Pick a plan for the amount of client work you do. Every plan includes hosting, checkout and handover — save up to ${YEARLY_SAVING}% when you pay yearly.`}
        cta={null}
      >
        <div className="mt-12">
          <PricingPlans />
        </div>
      </PageHero>

      <Section title="Compare plans" intro="Limits reset every month, on monthly and yearly plans alike.">
        <div className="-mx-4 overflow-x-auto px-4">
          <table className="w-full min-w-[560px] text-left text-[15px]">
            <thead>
              <tr className="border-b border-fg">
                <th scope="col" className="py-4 pr-4 font-medium text-fg-2">
                  <span className="sr-only">Feature</span>
                </th>
                {PLANS.map((p) => (
                  <th key={p.id} scope="col" className={`${display} py-4 pr-4 text-[20px] tracking-[-0.02em]`}>
                    {p.name}
                    <span className="block font-sans text-[14px] font-normal tracking-normal text-fg-2">${p.price}/mo</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map(([label, meter]) => (
                <tr key={meter} className="border-b border-hairline">
                  <th scope="row" className="py-4 pr-4 font-normal text-fg-2">
                    {label}
                  </th>
                  {PLANS.map((p) => (
                    <td key={p.id} className="py-4 pr-4 tabular-nums">
                      {meter === "storage" ? formatBytes(p.limits.storage) : p.limits[meter].toLocaleString("en-US")}
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="border-b border-hairline">
                <th scope="row" className="py-4 pr-4 font-normal text-fg-2">
                  Custom client domains
                </th>
                {PLANS.map((p) => {
                  const yes = p.features.includes("Custom client domains");
                  return (
                    <td key={p.id} className="py-4 pr-4">
                      {yes ? <Check size={16} className="text-octa-600" aria-label="Included" /> : <Minus size={16} className="text-fg-3" aria-label="Not included" />}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Included in every plan" tone="stone">
        <ul className="grid gap-x-10 gap-y-4 text-[17px] sm:grid-cols-2 lg:grid-cols-3">
          {EVERY_PLAN.map((f) => (
            <li key={f} className="flex items-start gap-3">
              <Check size={18} strokeWidth={2.25} className="mt-[3px] shrink-0 text-octa-600" /> {f}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Pricing questions">
        <QuestionList items={FAQS} />
      </Section>

      <CtaBand title="One sale can pay for the whole year." body="Most businesses pay hundreds or thousands for a website. Build one this afternoon." />
    </MarketingPage>
  );
}
