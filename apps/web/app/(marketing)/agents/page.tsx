import type { Metadata } from "next";
import { JsonLd } from "@/components/json-ld";
import { CtaBand, MarketingPage, MoreLink, PageHero, QuestionList, Section, Steps } from "@/components/marketing/page";
import { Agents } from "@/components/marketing/sections";
import { PLANS } from "@/lib/billing/plans";
import { breadcrumbs } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Octa Agents — find local businesses that need a website",
  description:
    "Octa Agents find local businesses on Google with no website, then build each one a demo site with its real name, hours and reviews — so you start every sales call with a finished site.",
  alternates: { canonical: "/agents" },
};

const [fewest, most] = [PLANS[0].limits.leads, PLANS[PLANS.length - 1].limits.leads].map((n) => n.toLocaleString("en-US"));

export default function AgentsPage() {
  return (
    <MarketingPage>
      <JsonLd data={breadcrumbs([["Octa Agents", "/agents"]])} />
      <PageHero
        eyebrow="Octa Agents"
        title="Find the businesses that need a website. Build theirs before you call."
        intro="Prospecting is the hardest part of selling websites. Octa Agents find local businesses with no website, rank them, and build each one a site with its real details — so you spend your time closing."
      />

      <Agents more={false} />

      <Section title="How Octa Agents work." tone="canvas">
        <Steps
          steps={[
            ["Pick a niche and a city", "Dentists in Austin, gyms in Toronto, florists in Denver — anywhere in the US and Canada."],
            ["Lead Finder searches Google", "It finds businesses with no website, or only a Facebook page, and ranks the best prospects."],
            ["Demo Builder builds their site", "One click creates a site with the business's real name, phone number, hours and Google reviews."],
            ["You make the call", "Open with a finished website, not a pitch. Send a checkout link when they say yes."],
          ]}
        />
      </Section>

      <Section title="Questions about Octa Agents">
        <QuestionList
          items={[
            ["Where does Lead Finder work?", "Anywhere in the United States and Canada, for any kind of local business."],
            ["How many leads do I get?", `Every plan includes Lead Finder leads each month — from ${fewest} on Starter to ${most} on Agency.`],
            ["What goes into a demo site?", "The business's real name, phone number, opening hours and Google reviews, in a design suited to its industry. You can refine it by chatting before you send it."],
            ["Does Octacore contact businesses for me?", "Not yet. Outreach — an agent that writes the first email with the new site attached and follows up on schedule — is coming soon."],
            ["Do I have to use agents?", "No. They're optional. You can bring your own clients and still build, host and sell with Octacore."],
          ]}
        />
        <MoreLink href="/guides/how-to-sell-websites-to-local-businesses" className="mt-10">
          Read: how to sell websites to local businesses
        </MoreLink>
      </Section>

      <CtaBand title="Your next client is already on Google." body="Let Octa Agents find them and build their site." />
    </MarketingPage>
  );
}
