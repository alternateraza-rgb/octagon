// What Octa knows about Octacore itself: how the product works, where things live in the dashboard,
// and what each plan includes. Static, so it sits ahead of the account snapshot in the instructions
// and OpenAI can cache it across requests.
import { GUIDES } from "@/lib/guides";
import { GRACE_DAYS } from "@/lib/billing/entitlements";
import { PLANS, YEARLY_SAVING, formatBytes } from "@/lib/billing/plans";
import { PLATFORM_FEE } from "@/lib/sales/money";
import { INVITE_DAYS } from "@/lib/sales/store";
import { MAX_DOMAINS_PER_SITE } from "@/lib/domains/store";
import { STEPS } from "@/lib/onboarding/steps";
import { SUPPORT_EMAIL } from "@/lib/support";

const plans = PLANS.map(
  (p) =>
    `- **${p.name}** — $${p.price}/month, or $${p.yearly}/month billed yearly. ${p.tagline} ` +
    `Monthly: ${p.limits.builds.toLocaleString("en-US")} AI builds and edits, ${p.limits.chat.toLocaleString("en-US")} Octa chat messages, ` +
    `${p.limits.sites} live websites, ${formatBytes(p.limits.storage)} of uploads, ${p.limits.leads.toLocaleString("en-US")} Lead Finder leads.` +
    (p.features.includes("Custom client domains") ? " Includes custom domains." : ""),
).join("\n");

export function octacoreGuide(sitesDomain: string) {
  return `# About Octacore
Octacore (octacore.app) is an app for building, hosting and selling websites to businesses. The loop: describe a business → Octacore builds the site → publish it → send the business owner a checkout link → they pay and own the site.

## Dashboard map (link to these with Markdown links)
- [Home](/dashboard) — chat with Octa (you). Past chats are in the sidebar.
- [Websites](/dashboard/sites) — every site. Click "New website", describe the business (or start from a [template](/templates)), and Octacore builds it. Open a site at /dashboard/sites/<site> to edit it by chatting ("make the hero warmer", "add a booking page"), attach images, logos or PDFs, see versions, preview on desktop/tablet/mobile, publish, change its address, connect a domain and sell it.
- [Sales](/dashboard/sales) — set up payouts (a connected Whop account, with identity verification) and track checkout links you've sent.
- [Agents](/dashboard/agents) — Octa Agents: Lead Finder (finds local businesses on Google with no website or only a social page, and ranks them), Demo Builder (builds a lead a site from their real Google details and reviews) and outreach. It is "coming soon" for most accounts.
- [Settings](/dashboard/settings) — profile, password, appearance, [billing](/dashboard/settings#billing) (change or cancel plan, yearly billing) and deleting the account.
- [Getting started checklist](/dashboard/sites#getting-started): ${STEPS.map((s) => s.title).join(" → ")}.

## How things work
- **Builds**: each new site or edit counts as one AI build. Every build is saved as a version; any older version can be previewed and published again.
- **Publishing**: one click puts a site live at https://<address>.${sitesDomain}, with SSL. The address can be changed from the site's publish settings. Edits after publishing aren't live until the site is published again.
- **Custom domains**: up to ${MAX_DOMAINS_PER_SITE} per site (e.g. the apex and www). On Pro and Agency, and on any sold site whose client pays for hosting. The builder adds a CNAME record at their DNS provider; Octacore verifies it and issues the certificate automatically (it can take a few minutes to a few hours). Domains whose DNS never points at Octacore are dropped after 14 days.
- **Selling**: set up payouts once in Sales, then open a site and choose Sell: set a one-off price, optionally a monthly hosting fee, and the buyer's name and email. The buyer gets an email with a checkout link valid for ${INVITE_DAYS} days (it can be resent or canceled). They pay through Whop; Octacore keeps a ${Math.round(PLATFORM_FEE * 100)}% fee on the site price and on each hosting payment, and the rest goes to the seller's payout account. Once paid, the buyer owns the site and can sign in at /owner; the seller keeps building it. A sold site whose client pays hosting doesn't count against the seller's live-site limit.
- **Plans** (billed through Whop; yearly saves up to ${YEARLY_SAVING}%; limits reset monthly, yearly plans included):
${plans}
- **Without a plan** the dashboard asks the user to choose one before building or chatting. After a plan ends, live sites keep running for ${GRACE_DAYS} days, then show a "paused" page until the plan is renewed. Sold sites with active client hosting stay up.
- **Refunds**: purchases are generally non-refundable; people having trouble should email ${SUPPORT_EMAIL}. Cancelling keeps the plan active to the end of the paid period.
- **Support**: ${SUPPORT_EMAIL}.
- **Templates**: ready-made designs for restaurants, salons, law firms, gyms, dentists, cafés, florists and studios at [/templates](/templates).
- **Guides**: ${GUIDES.map((g) => `[${g.title}](/guides/${g.slug})`).join(", ")}.`;
}
