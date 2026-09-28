import type { Metadata } from "next";
import { JsonLd } from "@/components/json-ld";
import { CtaBand, MarketingPage, MoreLink, PageHero, PointGrid, Section, Steps } from "@/components/marketing/page";
import { Design } from "@/components/marketing/sections";
import { breadcrumbs } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Features — AI website builder, hosting and selling",
  description:
    "Everything Octacore does: an AI website builder you edit by talking, hosting with custom domains, checkout links, ownership transfer and Octa Agents that find clients.",
  alternates: { canonical: "/features" },
};

const BUILD: [string, string][] = [
  ["Describe it, get a real site", "Tell Octacore about the business. It plans the pages, writes the copy, picks the photography and designs a site that looks hand-made."],
  ["Edit by talking", "“Make the hero warmer.” “Add a booking page.” Every change is a sentence away, and every version is saved."],
  ["Start from a template", "Launch-ready designs for restaurants, salons, gyms, law firms, dentists and more — then make them your client's."],
  ["Brand controls in one place", "Set colours, fonts and logo once and the whole site updates to match."],
  ["Real photography", "Sites come with high-quality stock photos out of the box, and you can upload the client's own."],
  ["No code required", "You never have to touch code. It's there if you ever want it."],
];

const HOST: [string, string][] = [
  ["One-click publishing", "Go live in seconds on a fast global edge network, with SSL and automatic scaling included."],
  ["Free address for every site", "Every site gets its own free address the moment you publish."],
  ["Custom client domains", "Connect the business's own domain in a couple of clicks — no chasing anyone for their DNS password."],
  ["Backend built in", "Forms, bookings, a database and file storage run on Octacore, with nothing to configure."],
  ["Security and backups", "Isolated data per site, encrypted at rest, with daily backups and access controls."],
];

const SELL: [string, string][] = [
  ["Checkout links", "Send the business a secure checkout link. Payment goes straight to your payout account."],
  ["They see it before they pay", "The link opens their new site full-screen, and you get an email the moment they look at it."],
  ["One-click handover", "When the buyer pays, they get an email invite to claim the site. You can stay on as a collaborator for upkeep."],
  ["A dashboard owners can use", "Buyers get a simple page to see and manage their site — no builder to learn."],
  ["Recurring hosting revenue", "Charge a monthly hosting fee on top of the build price and turn one sale into ongoing income."],
];

export default function FeaturesPage() {
  return (
    <MarketingPage>
      <JsonLd data={breadcrumbs([["Features", "/features"]])} />
      <PageHero
        eyebrow="Features"
        title="Build it. Ship it. Sell it. All in Octacore."
        intro="Octacore is an AI website builder made for selling websites. Build a site by describing it, publish it in one click, and get paid when the business says yes."
      />

      <Section id="build" title="Build a website by describing it." intro="The builder does the busywork, so you can make more sites for more clients.">
        <PointGrid points={BUILD} />
        <MoreLink href="/templates" className="mt-12">
          Browse templates
        </MoreLink>
      </Section>

      <Section id="host" tone="stone" title="Hosting that's already set up." intro="Every site ships with everything it needs to run — you never touch a server.">
        <PointGrid points={HOST} />
      </Section>

      <Section id="sell" title="Sell it without the admin." intro="Octacore handles payment and ownership, so a sale is a link, not a project.">
        <PointGrid points={SELL} />
      </Section>

      <Design />

      <Section id="how" tone="canvas" title="From idea to invoice in four steps.">
        <Steps
          steps={[
            ["Describe the business", "Its name, what it does and the feel you want. Or start from a template."],
            ["Refine by chatting", "Ask for changes in plain language until it's right."],
            ["Publish", "One click puts it live, on a free address or the client's domain."],
            ["Send a checkout link", "The client pays, claims the site, and you get paid."],
          ]}
        />
        <MoreLink href="/agents" className="mt-12">
          Find clients with Octa Agents
        </MoreLink>
      </Section>

      <CtaBand title="Build your first site today." body="Describe a business and watch Octacore build its website." />
    </MarketingPage>
  );
}
