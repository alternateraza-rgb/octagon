import type { Metadata } from "next";
import { JsonLd } from "@/components/json-ld";
import { SupportLink } from "@/components/marketing/legal";
import { CtaBand, MarketingPage, MoreLink, PageHero, PointGrid, Section } from "@/components/marketing/page";
import { Story } from "@/components/marketing/sections";
import { breadcrumbs } from "@/lib/seo";

export const metadata: Metadata = {
  title: "About Octacore",
  description:
    "Octacore is the app for building, hosting and selling websites. We help freelancers and agencies build websites for local businesses with AI — and get paid for them.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <MarketingPage>
      <JsonLd data={breadcrumbs([["About", "/about"]])} />
      <PageHero
        eyebrow="About Octacore"
        title="Every business needs a website. We help you sell them one."
        intro={
          <>
            <p>
              Millions of local businesses still don&apos;t have a website, or have one that doesn&apos;t work on a phone. Building
              them one used to take weeks of design, hosting setup and chasing invoices.
            </p>
            <p className="mt-4">
              Octacore turns that into an afternoon. Describe a business and Octacore builds its site, hosts it, and handles the sale
              — so anyone can run a web design business.
            </p>
          </>
        }
      />

      <Section title="What we believe.">
        <PointGrid
          points={[
            ["Great design shouldn't be rare", "Every site Octacore makes should look like a professional built it, because that's what makes it worth paying for."],
            ["Selling is part of the product", "Building is only half the job. Checkout, handover and hosting belong in the same app."],
            ["Small businesses deserve better", "The local restaurant, salon and dentist should have a site as good as a national chain's."],
          ]}
        />
      </Section>

      <Story />

      <Section title="Get in touch." tone="stone">
        <p className="max-w-[640px] text-[17px] leading-[1.6] text-fg-2">
          Questions, partnerships or press: email <SupportLink /> and a person will get back to you.
        </p>
        <MoreLink href="/features" className="mt-8">
          See what Octacore does
        </MoreLink>
      </Section>

      <CtaBand title="Build it. Ship it. Sell it." />
    </MarketingPage>
  );
}
