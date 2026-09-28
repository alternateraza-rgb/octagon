import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { JsonLd } from "@/components/json-ld";
import { CtaBand, MarketingPage, PageHero, Section, TemplateGrid, display } from "@/components/marketing/page";
import { INDUSTRIES, industryTitle } from "@/components/templates/industries";
import { breadcrumbs } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Website templates for local businesses",
  description:
    "Website templates for restaurants, cafés, salons, gyms, law firms, dentists, florists and architects. Customize one with AI, host it, and sell it with Octacore.",
  alternates: { canonical: "/templates" },
};

export default function TemplatesPage() {
  return (
    <MarketingPage>
      <JsonLd data={breadcrumbs([["Templates", "/templates"]])} />
      <PageHero
        eyebrow="Templates"
        title="Website templates for the businesses that buy websites."
        intro="Launch-ready designs for restaurants, salons, gyms, clinics and studios. Open one, describe your client, and Octacore rewrites it around their business."
        cta={null}
      >
        <div className="mt-14">
          <TemplateGrid />
        </div>
      </PageHero>

      <Section title="Browse by industry." intro="What each kind of business needs from its website, and the templates built for it." tone="stone">
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {INDUSTRIES.map((i) => (
            <li key={i.slug}>
              <Link href={`/templates/${i.slug}`} className="group flex h-full items-center justify-between gap-4 rounded-[18px] bg-elevated p-6 shadow-soft">
                <span>
                  <span className={`${display} block text-[22px] tracking-[-0.02em]`}>{i.name}</span>
                  <span className="mt-1 block text-[14px] text-fg-2">{industryTitle(i)}</span>
                </span>
                <ArrowRight size={18} className="shrink-0 transition-transform group-hover:translate-x-1" />
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      <CtaBand title="Don't see your client's industry?" body="Describe any business and Octacore designs a site for it from scratch." />
    </MarketingPage>
  );
}
