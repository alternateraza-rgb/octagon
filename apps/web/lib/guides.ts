// Articles at /guides/<slug>: long-form answers to what people search before they need Octacore.
// Bodies are Markdown (GitHub-flavoured), rendered on the server.
export type Guide = {
  slug: string;
  title: string;
  description: string;
  // ISO date, shown on the page and used for the sitemap and structured data.
  published: string;
  readingMinutes: number;
  body: string;
};

export const GUIDES: Guide[] = [
  {
    slug: "how-to-sell-websites-to-local-businesses",
    title: "How to sell websites to local businesses",
    description:
      "A practical playbook for finding local businesses that need a website, pitching them with a finished demo, pricing the work and handing it over.",
    published: "2026-09-28",
    readingMinutes: 8,
    body: `
Local businesses are the best customers for a website: there are millions of them, many still don't have a site (or have one that doesn't work on a phone), and a better website pays for itself quickly in calls, bookings and orders. This guide walks through a repeatable way to find them, pitch them and get paid.

## 1. Pick a niche and a city

Selling "websites" is hard. Selling "websites for dentists in Austin" is much easier. A niche gives you:

- **A shorter pitch.** You know what a dental site needs: treatments, insurance, new-patient info and online booking.
- **Reusable work.** Your second dental site takes a fraction of the time of your first.
- **Referrals.** Business owners in the same trade talk to each other.

Good first niches have plenty of independent businesses, real revenue per customer and an obvious payoff from a website: restaurants, salons, gyms, dentists, law firms, trades and florists all work well. See the [industry templates](/templates) for what each one needs.

## 2. Find businesses that need a website

The best leads have a Google Business Profile — so they're real, open and have reviews — but no website, or only a Facebook page. You can find them by searching Google Maps for "[niche] in [city]" and checking each listing for a website link.

That's slow by hand. [Octa Agents](/agents) do it for you: Lead Finder searches Google for businesses with no website in any niche and city across the US and Canada, and ranks them so you know who to call first.

## 3. Build the demo before you call

The single biggest change you can make to your close rate is to stop pitching and start showing. Instead of "I build websites, are you interested?", open with "I built you a new website — can I send you the link?"

A demo should use the business's real details: its name, phone number, opening hours, services and a few of its best Google reviews. With Octacore you can [start from a template](/templates) or let Demo Builder create one in a click from the lead's Google listing, then refine it by chatting ("make it feel more upscale", "add a booking page").

## 4. Make the first contact

Call, walk in, or email — whichever you're comfortable with. Keep it short:

> Hi Maria — I noticed Bloom & Branch doesn't have a website yet, so I made you one. It's live at this link. If you like it, it's yours; if not, no hard feelings.

Things that help:

- **Lead with their benefit**, not your process: more calls, more bookings, showing up on Google.
- **Send the link, not screenshots.** A live site on their phone is far more convincing.
- **Follow up.** Most sales happen on the second or third touch, a few days apart.

## 5. Price it simply

Most freelancers charge a one-off build fee plus a monthly fee for hosting and small updates. The monthly fee matters: ten clients at a modest monthly rate is steady income that grows every time you sell another site.

Anchor the price on what the site is worth to the business — one extra booking a week for a salon, or one new patient a month for a dentist, easily covers it — rather than on how long it took you.

## 6. Get paid and hand it over

When they say yes, send a checkout link. With Octacore, the buyer sees their site full-screen, pays through a secure checkout, and gets an email invite to claim ownership. Payment goes to your payout account, minus a small platform fee, and you can stay on as a collaborator to handle updates.

## 7. Keep them happy

Small, fast updates are what turn a one-off sale into a long-term client: new menu items, holiday hours, a seasonal offer. With Octacore those changes are a sentence each, so upkeep takes minutes a month.

## The short version

1. Pick a niche and a city.
2. Find businesses with no website.
3. Build their site before you call.
4. Send the link and follow up.
5. Charge a build fee plus a monthly fee.
6. Send a checkout link and hand it over.

[Start building](/start) your first demo today.
`,
  },
  {
    slug: "start-a-web-design-business-with-ai",
    title: "How to start a web design business with AI",
    description:
      "You don't need to be a designer or a developer to run a web design business in 2026. Here's how to start one with AI tools, from your first client to recurring revenue.",
    published: "2026-09-28",
    readingMinutes: 7,
    body: `
A few years ago, starting a web design business meant learning design, HTML, CSS and hosting before you could take your first client. AI has changed that. Today the hard parts of the job are finding clients and looking after them — the building is fast.

## What a web design business actually sells

Business owners don't want "a website". They want customers to find them, trust them and contact them. That means your job is to deliver:

- A site that **looks professional** on a phone.
- **Clear information**: what they do, prices, hours, location.
- **One obvious action**: call, book, order or enquire.
- **Showing up on Google** for "[service] near me".
- **Someone to call** when something needs changing.

AI handles most of the first three. The last two are where you add value.

## Step 1: Choose your tools

You need a way to build, host, get paid and hand over. You can stitch together a site builder, a hosting provider, an invoicing tool and a lot of email — or use one app that does all of it. [Octacore](/features) was built for exactly this: you describe a site, it builds and hosts it, and you sell it with a checkout link.

## Step 2: Build a small portfolio

Make three or four sites before you pitch anyone. They can be for businesses you know, or demos for real local businesses that don't have a website yet. Start from [templates](/templates) for common industries and customize them by chatting. A portfolio gives you something to show — and practice.

## Step 3: Pick a niche

Specialising makes everything easier: your pitch, your pricing and your referrals. Choose an industry with lots of independent businesses and a clear return from a website, such as restaurants, salons, gyms or dental practices.

## Step 4: Find your first clients

Start with people you know, then go local. Look for businesses with a Google listing but no website — they're open, they have customers, and they're missing out. [Octa Agents](/agents) find these leads for you and build each one a demo site before you reach out.

Our guide on [how to sell websites to local businesses](/guides/how-to-sell-websites-to-local-businesses) covers outreach step by step.

## Step 5: Set your pricing

A common, simple model:

- **Build fee**: a one-off payment for the site.
- **Monthly plan**: hosting, security and small updates.

The monthly plan is what turns a side project into a business, because it compounds: every new client adds to your baseline income.

## Step 6: Deliver and hand over cleanly

Send a checkout link, get paid, and transfer ownership so the client feels in control. Stay on as a collaborator for updates. Respond quickly to change requests — it's the easiest way to earn referrals.

## Step 7: Scale up

Once you have a process, grow by:

- **Adding a second niche** or a second city.
- **Productising**: fixed packages at fixed prices.
- **Bringing in help** for outreach while you handle the builds.

## Common mistakes to avoid

- **Waiting until you're "ready".** Your fifth site will be better than your first; ship the first.
- **Pricing by the hour.** Price on the value to the business.
- **Skipping the monthly plan.** One-off sales mean starting from zero every month.
- **Pitching without a demo.** Showing a finished site beats describing one.

Ready to try it? [Build your first site](/start) in a few minutes.
`,
  },
  {
    slug: "ai-website-builder-for-agencies-and-freelancers",
    title: "The AI website builder for agencies and freelancers",
    description:
      "What to look for in an AI website builder when you build sites for clients: quality, editing, hosting, custom domains, payments and handover.",
    published: "2026-09-28",
    readingMinutes: 6,
    body: `
Most AI website builders are designed for a business owner making their own site. If you build sites **for clients**, you need more: design that's good enough to sell, fast revisions, hosting you don't have to babysit, and a clean way to get paid and hand the site over.

Here's what matters, and how Octacore handles each part.

## 1. Design quality you can sell

A client won't pay for a site that looks generated. Look for real typography, strong layouts, good photography and industry-specific structure — a restaurant needs a menu and reservations; a law firm needs practice areas and a consultation form.

Octacore sites start from [professional templates](/templates) and industry knowledge, so the first draft already looks like something a business would pay for.

## 2. Editing by conversation

Client feedback comes as sentences: "can the header be warmer?", "add our Sunday hours", "we need a page for weddings". The fastest workflow is one where you can paste that feedback in and see the change. In Octacore every edit is a message, and every version is saved.

## 3. Hosting you don't have to manage

Each client site needs hosting, SSL, a domain and uptime. Managing that across dozens of clients is where agencies lose time. Octacore hosts every site on a global edge network with SSL included, gives each one a free address, and connects the client's own domain in a couple of clicks.

## 4. Getting paid

Invoicing and chasing payment is slow. Octacore lets you send a checkout link: the client sees their new site, pays securely, and the money goes to your payout account minus a small platform fee. You can charge a monthly hosting fee too, for recurring revenue.

## 5. Clean handover

Clients want to own their site. Octacore sends the buyer an email invite to claim it, gives them a simple dashboard, and lets you stay on as a collaborator for upkeep.

## 6. Finding the next client

The bottleneck for most freelancers isn't building — it's the pipeline. [Octa Agents](/agents) find local businesses with no website and build each one a demo, so every outreach starts with a finished site.

## Checklist: choosing an AI website builder for client work

| Need | Why it matters |
| --- | --- |
| Sellable design out of the box | Less time polishing, higher prices |
| Edit by chat | Faster revisions, happier clients |
| Hosting, SSL and custom domains | No infrastructure to manage |
| Checkout links and payouts | Get paid without chasing invoices |
| Ownership transfer | Clients own their site; you keep the relationship |
| Lead generation | A pipeline, not just a tool |

If that's the workflow you want, [see Octacore's features](/features) or [compare plans](/pricing).
`,
  },
  {
    slug: "octacore-vs-base44-wix-durable-framer",
    title: "Octacore vs Base44, Wix, Durable and Framer",
    description:
      "How Octacore compares with Base44, Wix, Durable and Framer — and which one to choose depending on whether you're building your own site, an app, or selling websites to clients.",
    published: "2026-09-28",
    readingMinutes: 6,
    body: `
There are lots of good ways to build a website with AI. The right one depends on **what you're trying to do**: build your own site, build a web app, or build websites to sell to other businesses. This comparison is written from that angle.

*Products change quickly — check each one's website for current features and pricing.*

## The short answer

- **Choose Octacore** if you want to build websites for local businesses and sell them: it combines an AI builder, hosting, checkout, ownership transfer and lead finding in one app.
- **Choose Base44** if you want to build a web *app* — internal tools, dashboards, apps with user accounts and logic.
- **Choose Wix** if you want a mature, all-purpose website builder with a huge ecosystem of apps and templates.
- **Choose Durable** if you're a small-business owner who wants a simple site for your own business, fast.
- **Choose Framer** if you're a designer who wants precise visual control and polished animation.

## Octacore

Octacore is built around one workflow: **build a site, ship it, sell it.** You describe a business and Octacore designs, writes and hosts its site. Then you send the business a checkout link; when they pay, they're invited to claim ownership and you get paid. [Octa Agents](/agents) find local businesses with no website and build each one a demo.

**Best for:** freelancers, agencies and anyone who wants to run a web design business.
**Less suited to:** complex web applications, or huge sites with hundreds of pages.

## Base44

Base44 is an AI app builder. You describe an application and it generates the pages, data and logic — useful for internal tools, portals and prototypes.

**Best for:** building web apps without code.
**Compared with Octacore:** Base44 focuses on apps; Octacore focuses on marketing websites for businesses and on selling them, with checkout and handover built in.

## Wix

Wix is one of the longest-established website builders, with drag-and-drop editing, AI site generation, a large app marketplace and e-commerce. Wix Studio adds tools aimed at agencies.

**Best for:** people who want a full-featured, general-purpose builder and ecosystem.
**Compared with Octacore:** Wix offers far more add-ons; Octacore is narrower and faster for the build-and-sell workflow, and includes lead finding and one-link checkout for selling sites.

## Durable

Durable is an AI website builder aimed at small-business owners, generating a simple site quickly along with tools for running the business.

**Best for:** a business owner who wants their own site with minimal effort.
**Compared with Octacore:** Durable is designed for the business owner; Octacore is designed for the person building sites for many business owners.

## Framer

Framer is a design-first website builder popular with designers, with fine visual control, animation, a CMS and AI features.

**Best for:** designers building bespoke, highly polished sites.
**Compared with Octacore:** Framer gives more manual design control; Octacore prioritises speed — sites built by describing them — plus the tools to sell and hand them over.

## Side by side

| | Octacore | Base44 | Wix | Durable | Framer |
| --- | --- | --- | --- | --- | --- |
| Main use | Build and sell business websites | Build web apps | General websites | Your own small-business site | Designer-built websites |
| Build with AI by describing | Yes | Yes | Yes | Yes | Yes |
| Hosting included | Yes | Yes | Yes | Yes | Yes |
| Checkout link to sell a site to a client | Built in | Not a focus | Via agency tools | Not a focus | Not a focus |
| Transfer ownership to a buyer | One click | Not a focus | Site transfer | Not a focus | Project transfer |
| Finds businesses that need a site | Octa Agents | Not a focus | Not a focus | Not a focus | Not a focus |

## Which should you choose?

If your goal is to **sell websites** — to local restaurants, salons, gyms, clinics and studios — Octacore is built for that workflow from start to finish. [See how it works](/features), [browse templates](/templates) or [compare plans](/pricing).
`,
  },
];

export const getGuide = (slug: string) => GUIDES.find((g) => g.slug === slug);
