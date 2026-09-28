import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { JsonLd } from "@/components/json-ld";
import { CtaBand, MarketingPage, PageHero, display } from "@/components/marketing/page";
import { GUIDES } from "@/lib/guides";
import { breadcrumbs } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Guides — selling websites with AI",
  description:
    "Guides from Octacore on starting a web design business, finding clients, pricing websites and building them with AI.",
  alternates: { canonical: "/guides" },
};

export default function GuidesPage() {
  return (
    <MarketingPage>
      <JsonLd data={breadcrumbs([["Guides", "/guides"]])} />
      <PageHero
        eyebrow="Guides"
        title="Build websites. Sell them. Here's how."
        intro="Practical guides to starting a web design business, finding local clients and getting paid — with AI doing the building."
        cta={null}
      >
        <ul className="mt-14 grid gap-4 md:grid-cols-2">
          {GUIDES.map((g) => (
            <li key={g.slug}>
              <Link href={`/guides/${g.slug}`} className="group flex h-full flex-col rounded-[18px] bg-elevated p-6 shadow-soft sm:p-8">
                <h2 className={`${display} text-[26px] leading-[1.1] tracking-[-0.025em] text-balance`}>{g.title}</h2>
                <p className="mt-3 text-[16px] leading-[1.5] text-fg-2">{g.description}</p>
                <span className="mt-6 flex items-center gap-2 text-[14px] text-fg-3">
                  {g.readingMinutes} min read
                  <ArrowRight size={16} className="ml-auto text-fg transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </PageHero>
      <CtaBand title="Ready to build your first site?" />
    </MarketingPage>
  );
}
