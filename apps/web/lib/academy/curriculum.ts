// Octacore Academy: everything it takes to go from a first website to a paying client, in the order
// people need it. Lesson ids are "<module>/<lesson>" and are stored in academy_progress, so don't
// rename them once shipped.
import { PLATFORM_FEE } from "@/lib/sales/money";
import { INVITE_DAYS } from "@/lib/sales/store";
import type { Lesson, Module, TaskId } from "./types";

const fee = `${Math.round(PLATFORM_FEE * 100)}%`;

export const TASKS: Record<TaskId, { label: string; href: string; cta: string }> = {
  built: { label: "Build your first website", href: "/dashboard/sites#new", cta: "New website" },
  edited: { label: "Edit a site by chatting (make a second version)", href: "/dashboard/sites", cta: "Open Websites" },
  published: { label: "Publish a site", href: "/dashboard/sites", cta: "Open Websites" },
  domain: { label: "Connect a custom domain", href: "/dashboard/sites", cta: "Open a site" },
  searched: { label: "Run a search in Octa Agents", href: "/dashboard/agents", cta: "Open Agents" },
  saved: { label: "Add a business to your list", href: "/dashboard/agents", cta: "Find businesses" },
  demo: { label: "Build a demo site for a business you found", href: "/dashboard/agents", cta: "Open Businesses" },
  mailbox: { label: "Connect your mailbox for outreach", href: "/dashboard/agents", cta: "Connect mailbox" },
  emailed: { label: "Send your first outreach email", href: "/dashboard/agents", cta: "Open outreach" },
  practiced: { label: "Score 60 or more on a practice call", href: "/dashboard/academy/practice", cta: "Practice a call" },
  payouts: { label: "Set up payouts", href: "/dashboard/sales", cta: "Set up payouts" },
  sent: { label: "Send a checkout link", href: "/dashboard/sites", cta: "Pick a site" },
  sold: { label: "Make your first sale", href: "/dashboard/sales", cta: "View sales" },
};

export const MODULES: Module[] = [
  {
    id: "start",
    title: "Start here",
    tagline: "How the business works, and what you'll have in 30 days.",
    lessons: [
      {
        id: "start/model",
        title: "The business in one page",
        minutes: 4,
        summary: "Build a site for a real business, show it to the owner, and charge a setup fee plus a monthly fee.",
        blocks: [
          {
            type: "text",
            md: `Most local businesses either have no website or have one that's slow, ugly and breaks on a phone. They know it costs them customers. What they don't have is the time to sort it out, or someone they trust to do it.

That's the gap you fill. Octacore does the building and hosting. Your job is to **find the businesses, show them their new site, and close**.`,
          },
          {
            type: "steps",
            items: [
              { title: "Find", body: "Octa Agents finds businesses near you with good Google reviews and no website. They're your best prospects." },
              { title: "Build", body: "Build their site *before* you contact them, from their real name, reviews, hours and phone number. It takes about a minute." },
              { title: "Show", body: "Call, email or walk in, and send them the live link. A finished site on their phone does the selling for you." },
              { title: "Close", body: `Send a checkout link from Octacore. They pay you, they own the site, and Octacore keeps ${fee}.` },
              { title: "Keep", body: "Charge monthly for hosting and small changes. That's what grows into real income." },
            ],
          },
          {
            type: "callout",
            tone: "story",
            title: "Touseef, CEO of Killzone",
            md: "“Octacore took me from making $500 a month selling websites to $20k MRR. It took me 5 hours a month of prompting to make all the websites.”",
          },
          {
            type: "text",
            md: `## Why the monthly fee matters

A one-off sale is a good day. A monthly fee is a business. Say you charge **$500 to set up and $99 a month**:

| Clients | One-off income | Monthly income |
|---|---|---|
| 5 | $2,500 | $495/mo |
| 20 | $10,000 | $1,980/mo |
| 50 | $25,000 | $4,950/mo |

Every client you close adds to the monthly line, and it keeps paying after the setup money is spent.`,
          },
        ],
      },
      {
        id: "start/plan",
        title: "Your first 30 days",
        minutes: 3,
        summary: "A day-by-day plan to land your first paying client.",
        blocks: [
          {
            type: "text",
            md: "You don't need a portfolio, a logo or a website of your own to start. You need demos and conversations. Here's the plan this Academy walks you through:",
          },
          {
            type: "steps",
            items: [
              { title: "Days 1–2: Learn the builder", body: "Build two or three practice sites for made-up businesses in the trade you're targeting. Publish one." },
              { title: "Days 3–4: Pick a niche and a city", body: "One trade, one area. Run searches in Octa Agents and add your best 30 businesses." },
              { title: "Day 5: Practise", body: "Do three practice calls in the simulator until you score 60 or more. Learn the opener by heart." },
              { title: "Days 6–20: Build and call", body: "Build 5 demos a day. Call or email each business the same day. Follow up everyone after 2 and 5 days." },
              { title: "Days 21–30: Close and repeat", body: "Send checkout links to everyone who liked their site. Ask every new client who else they know." },
            ],
          },
          {
            type: "callout",
            tone: "tip",
            title: "The only number that matters early on",
            md: "Count conversations, not sales. If you have 100 real conversations with business owners who've seen their site, the sales follow.",
          },
        ],
      },
    ],
  },
  {
    id: "build",
    title: "Build a site that sells",
    tagline: "Get the builder to make sites owners actually want.",
    lessons: [
      {
        id: "build/first-site",
        title: "Build your first site",
        minutes: 6,
        summary: "What to type, what to expect, and how to judge the result.",
        blocks: [
          {
            type: "text",
            md: `Open **Websites**, click **New website**, and describe the business. The more real detail you give, the better the site. Vague prompts get generic sites.`,
          },
          {
            type: "compare",
            bad: { label: "Vague", text: "A website for a plumber." },
            good: {
              label: "Specific",
              text: "A website for Reliable Rooter, a family-run plumber in Mississauga since 2009. 24/7 emergency call-outs, drain cleaning, water heaters and leak repair. Phone (905) 555-0142. 4.8 stars from 210 Google reviews. Big \"Call now\" button, trust badges, and a short reviews section.",
            },
          },
          {
            type: "steps",
            items: [
              { title: "Name, trade and town", body: "The business name, what they do, and where. Location words help them show up on Google." },
              { title: "Services", body: "The 4–6 things they actually sell. Owners check this first." },
              { title: "How customers get in touch", body: "Phone, booking, a quote form, or walk-ins. Ask for one big button for it." },
              { title: "Proof", body: "Years in business, review rating, licences, awards. This is what makes strangers trust them." },
              { title: "A feel", body: "\"Warm and family-run\", \"clean and clinical\", \"bold and modern\". One phrase is enough." },
            ],
          },
          { type: "task", task: "built" },
          {
            type: "callout",
            tone: "tip",
            title: "Start from a template",
            md: "Templates for restaurants, salons, law firms, gyms, dentists, cafés, florists and studios are at [Templates](/templates). They're a quick way to get a polished starting point for a trade.",
          },
        ],
      },
      {
        id: "build/edit",
        title: "Edit by chatting",
        minutes: 5,
        summary: "Turn a good first draft into a site the owner can't say no to.",
        blocks: [
          {
            type: "text",
            md: `Open any site and type what you want changed, just as you'd tell a designer. Every edit is saved as a **version**, so you can always go back.`,
          },
          {
            type: "text",
            md: `### Edits that make a site sell
- "Make the call button sticky on mobile."
- "Add a reviews section with five of their best Google reviews."
- "Add an emergency banner at the top: 24/7 call-outs, (905) 555-0142."
- "Make the hero warmer and use a photo of a real kitchen."
- "Add a simple FAQ: prices, areas covered, how fast they come out."`,
          },
          {
            type: "callout",
            tone: "warning",
            title: "Check it on a phone",
            md: "Most owners open your link on their phone. Use the mobile preview in the builder before you send anything. If the phone number isn't one tap away, fix that first.",
          },
          { type: "task", task: "edited" },
        ],
      },
      {
        id: "build/what-owners-want",
        title: "What owners care about",
        minutes: 4,
        summary: "Owners don't buy design. They buy more calls and bookings.",
        blocks: [
          {
            type: "text",
            md: `You'll be tempted to show off animations and fonts. Owners don't care. They look for five things, in this order:`,
          },
          {
            type: "steps",
            items: [
              { title: "Is it *my* business?", body: "Their name, their phone number, their real reviews. A site with their details feels like theirs before they've paid." },
              { title: "Can customers reach me?", body: "A big call or book button that works on a phone." },
              { title: "Does it look trustworthy?", body: "Clean, quick, no spelling mistakes, real photos where possible." },
              { title: "Will it show up on Google?", body: "Their town and services in the headings. Mention this when you pitch." },
              { title: "Is it hassle-free?", body: "They don't want to learn anything. Tell them you handle changes." },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "live",
    title: "Go live",
    tagline: "Publish, share the link, and connect a domain.",
    lessons: [
      {
        id: "live/publish",
        title: "Publish and share",
        minutes: 3,
        summary: "One click puts a site live on its own address.",
        blocks: [
          {
            type: "text",
            md: `In the builder, press **Publish**. The site goes live straight away at its own address on octacore.app, with SSL. You can change the address in the publish settings, e.g. *reliable-rooter.octacore.app*.

Edits you make after publishing aren't live until you publish again, so you can work on changes without the owner seeing a half-finished version.`,
          },
          { type: "task", task: "published" },
          {
            type: "callout",
            tone: "tip",
            title: "Name the address after the business",
            md: "*bloom-and-branch.octacore.app* reads as theirs. A random address reads as a test. It's a small thing that makes the demo feel real.",
          },
        ],
      },
      {
        id: "live/domains",
        title: "Custom domains, in plain English",
        minutes: 5,
        summary: "How to put a site on the client's own domain, and how to explain it to them.",
        blocks: [
          {
            type: "text",
            md: `A custom domain is the address people type, like *reliablerooter.ca*. Once a client buys, you'll usually connect theirs (or one they buy) to the site.`,
          },
          {
            type: "steps",
            items: [
              { title: "Open the site and go to Domains", body: "Type the domain, e.g. reliablerooter.ca and www.reliablerooter.ca." },
              { title: "Copy the record Octacore shows you", body: "It's a CNAME record: a line that tells the internet where the site lives." },
              { title: "Add it where the domain was bought", body: "GoDaddy, Namecheap, Cloudflare and so on all have a DNS page. Paste the record there. If the client owns the domain, ask them to add you or do it with them on a call." },
              { title: "Wait for the tick", body: "Octacore checks the record and issues the security certificate itself. It takes from a few minutes to a few hours." },
            ],
          },
          {
            type: "callout",
            tone: "tip",
            title: "How to explain it to an owner",
            md: "“Your domain is like your phone number, and the website is the phone. I'll plug one into the other; you don't need to do anything.”",
          },
          { type: "task", task: "domain", optional: true },
        ],
      },
    ],
  },
  {
    id: "find",
    title: "Find buyers",
    tagline: "Use Octa Agents to find businesses that need you.",
    lessons: [
      {
        id: "find/niche",
        title: "Pick a niche and a city",
        minutes: 4,
        summary: "\"Websites for dentists in Austin\" sells far better than \"websites\".",
        blocks: [
          {
            type: "text",
            md: `A niche gives you a shorter pitch, reusable work (your fifth salon site takes minutes) and referrals, because owners in the same trade talk.

Good first niches have lots of independent businesses, decent money per customer, and an obvious payoff from more calls: **plumbers, electricians, roofers, landscapers, salons, barbers, dentists, gyms, cafés and restaurants**.`,
          },
          {
            type: "callout",
            tone: "tip",
            title: "Go local first",
            md: "Start with your own city or the one next to it. \"I'm local\" is the easiest trust you'll ever earn, and you can meet in person to close.",
          },
        ],
      },
      {
        id: "find/agents",
        title: "Find businesses with Octa Agents",
        minutes: 6,
        summary: "Search, read the score, and build a list worth calling.",
        blocks: [
          {
            type: "steps",
            items: [
              { title: "Search a trade and a city", body: "Open Agents → Find. Type a kind of business and a city, e.g. \"plumber\" in \"Mississauga\"." },
              { title: "Read the card", body: "Each business shows its Google rating, reviews and a potential score. High score = lots of happy customers and no website." },
              { title: "Add or skip", body: "Add the good ones (or drag the card right). Skipping is free; adding counts toward your monthly businesses." },
              { title: "Open Businesses", body: "Everything you've added, with the phone number from Google Maps and an email Octa hunts down from the web." },
            ],
          },
          {
            type: "callout",
            tone: "tip",
            title: "The sweet spot",
            md: "**Lots of reviews + no website** is the best lead there is. They have customers and they care about their reputation, but anyone who Googles them finds nothing. That's a problem you can show them in ten seconds.",
          },
          { type: "task", task: "searched" },
          { type: "task", task: "saved" },
        ],
      },
      {
        id: "find/demo",
        title: "Build the demo before you call",
        minutes: 4,
        summary: "The biggest change you can make to your close rate.",
        blocks: [
          {
            type: "compare",
            bad: { label: "Pitching", text: "\"Hi, I build websites. Would you be interested in one?\"" },
            good: { label: "Showing", text: "\"Hi, I noticed you don't have a website, so I built you one. Can I text you the link?\"" },
          },
          {
            type: "text",
            md: `In **Businesses**, open a business and press **Build website**. Octa builds it from their real Google details: name, phone, hours and their best reviews quoted word for word. Polish it with an edit or two, publish it, and you're ready to call.`,
          },
          { type: "task", task: "demo" },
        ],
      },
    ],
  },
  {
    id: "calling",
    title: "Cold calling & outreach",
    tagline: "What to say, how to say it, and what to do when they push back.",
    lessons: [
      {
        id: "calling/numbers",
        title: "Mindset and numbers",
        minutes: 4,
        summary: "Cold calling is a numbers game you can win on purpose.",
        blocks: [
          {
            type: "text",
            md: `Most calls won't go anywhere, and that's normal. A "no" isn't about you; they were busy, or it wasn't the day. What matters is the numbers over a week. A typical week for someone new looks like this:`,
          },
          {
            type: "funnel",
            stages: [
              { label: "Dials", value: 100 },
              { label: "Owners reached", value: 30 },
              { label: "Agreed to see the site", value: 12 },
              { label: "Interested", value: 5 },
              { label: "Closed", value: 2 },
            ],
            note: "At $500 setup and $99 a month, 2 closes a week is $1,000 now and $792/mo more every month.",
          },
          {
            type: "steps",
            items: [
              { title: "Call in blocks", body: "Put 60–90 minutes in the calendar and dial without stopping. Momentum makes you better." },
              { title: "Best times", body: "Trades: 7–8:30am and 4–6pm, before and after jobs. Shops and salons: mid-morning on weekdays. Never in a lunch rush." },
              { title: "Stand up and smile", body: "It sounds silly. It works; people can hear it." },
              { title: "Write down every objection", body: "You'll hear the same ten again and again. The objection cards in this module cover them." },
            ],
          },
        ],
      },
      {
        id: "calling/opener",
        title: "The opener",
        minutes: 6,
        summary: "The first 20 seconds decide the call. Here's exactly what to say.",
        blocks: [
          {
            type: "text",
            md: `Your opener has one job: earn the next 30 seconds. Say who you are, why you're calling *them*, and ask for something small.`,
          },
          {
            type: "script",
            title: "The demo-first opener",
            when: "For a business you've already built a site for. Use this one most.",
            lines: [
              "Hi, is this [Owner]? … Hi [Owner], it's [Your name], I'm a web designer here in [City].",
              "I'll be quick. I was looking at [Business] on Google; you've got some great reviews, but there's no website, so I went ahead and built you one.",
              "It's already live. Can I text you the link so you can have a look? No cost to look.",
              "(If yes) Perfect. What's the best number? … Sent. Take a look now while I'm on the line. What do you think of the top part?",
            ],
            practice: { mood: "busy" },
          },
          {
            type: "script",
            title: "If you reach someone else",
            when: "Receptionist, staff or family member answers.",
            lines: [
              "Hi, it's [Your name]. Is [Owner] around?",
              "(If they ask what it's about) I built a website for [Business] and wanted to send it over. Is this the best number to reach them, or is there a better time?",
              "(If they offer to pass a message) Thank you. Could I get their mobile or email so I can send the link directly?",
            ],
          },
          {
            type: "script",
            title: "Voicemail",
            when: "Keep it under 20 seconds. Then send a text with the link straight away.",
            lines: [
              "Hi [Owner], it's [Your name], a web designer in [City]. I built a website for [Business], and it's live already.",
              "I'll text you the link now. Have a look when you get a minute, and call me back on [Your phone] if you like it. Thanks!",
            ],
          },
          {
            type: "callout",
            tone: "warning",
            title: "Don't ask \"Is now a good time?\"",
            md: "It's an easy no. Instead, say you'll be quick, then actually be quick.",
          },
        ],
      },
      {
        id: "calling/discovery",
        title: "Questions that sell",
        minutes: 5,
        summary: "Get them talking about their business, and they'll sell themselves.",
        blocks: [
          {
            type: "text",
            md: `Once they're looking at the site, stop pitching and ask questions. The goal is for *them* to say why they need it.`,
          },
          {
            type: "text",
            md: `### Questions to ask
- "How do most of your new customers find you right now?"
- "When someone Googles you and there's no website, what do you think they do?" *(They call the competitor who has one.)*
- "If this brought you two extra jobs a month, what would that be worth?"
- "What would you change on it?" *(Anyone who suggests changes is picturing it as theirs.)*
- "Who else would need to see it before you go ahead?"`,
          },
          {
            type: "callout",
            tone: "tip",
            title: "Talk less than they do",
            md: "Aim for them talking 60% of the time. The practice call scorecard measures your talk ratio.",
          },
        ],
      },
      {
        id: "calling/objections",
        title: "Handling objections",
        minutes: 8,
        summary: "The pushback you'll hear every day, and what to say back.",
        blocks: [
          {
            type: "text",
            md: `Every objection gets the same treatment: **agree, ask, answer**. Agree it's a fair point, ask a question to understand it, then answer the real concern. Never argue. Tap a card to see the reply.`,
          },
          {
            type: "objections",
            items: [
              {
                says: "I'm not interested.",
                reply: "Totally fair, most people aren't until they've seen it. It's already built, so there's nothing to decide; can I just text you the link and you can ignore it if it's not for you?",
                why: "\"Not interested\" usually means \"I don't want a sales call.\" Lowering the ask to a text gets past it.",
              },
              {
                says: "How much is it?",
                reply: "Good question. It depends on what you'd want on it, but most of my clients pay [Setup price] once and [Monthly price] a month for hosting and changes. Before we talk money though, do you actually like it?",
                why: "Answer honestly so you don't sound shifty, then go back to value. Price only matters once they want it.",
              },
              {
                says: "That's too expensive.",
                reply: "I hear you. Can I ask: what's one new customer worth to you? … So if this brings in one extra job a month, it's paid for itself. Would that be fair?",
                why: "Compare the price with what a customer is worth to them, not with nothing.",
              },
              {
                says: "We already have a Facebook page.",
                reply: "That's great, keep it. The thing is, when someone Googles \"[Trade] in [City]\", Google shows websites first. This doesn't replace Facebook; it catches the people Facebook misses.",
                why: "Don't attack what they have. Add to it.",
              },
              {
                says: "My nephew does our website.",
                reply: "That's nice to have family helping. I can't see a site for you on Google at the moment, though; is it still in the works? If it helps, this one's ready today, and it's yours to keep or compare.",
                why: "Respect the relationship, then point out the gap. Often the nephew's site was never finished.",
              },
              {
                says: "Just send me an email.",
                reply: "Happy to. I'll send the link right now. So I know what to include, what would you want to see on a site like this?",
                why: "Agree, then keep the conversation going with a question. Get the email address either way.",
              },
              {
                says: "I need to talk to my partner.",
                reply: "Of course, it's a shared decision. What do you think they'll like about it? … And what might they worry about? Let's book 10 minutes tomorrow with both of you, and I'll go through it.",
                why: "Find out where the partner stands, and book the next step instead of waiting.",
              },
              {
                says: "We get enough work through word of mouth.",
                reply: "That's the best kind of business to have. When someone gets your name from a friend, what do you think they do next? … They Google you. This makes sure they find you, not the next company.",
                why: "Word of mouth now runs through Google. Make that connection for them.",
              },
              {
                says: "I had a bad experience with a web guy.",
                reply: "I'm sorry, that's sadly common. What went wrong? … That's exactly why I build it first: you see the finished site before you pay anything, and if you don't like it, you don't pay.",
                why: "Let them vent, then show how your way removes the risk that burned them.",
              },
              {
                says: "I'm too busy right now.",
                reply: "Totally get it. That's why I've done all of it already. It takes 30 seconds to look. Shall I text it and call you back at 5 when things are quieter?",
                why: "Busy is a timing problem, not a no. Book a specific time.",
              },
              {
                says: "I don't need a website.",
                reply: "Fair enough, can I ask why? … Out of interest, when people search for you, what do you want them to find?",
                why: "Ask rather than tell. Often they've just never thought about how customers search.",
              },
              {
                says: "How did you get my number?",
                reply: "It's on your Google listing. I was looking for [Trade]s in [City] and yours had some of the best reviews, which is why I built this for you.",
                why: "Be straight, and turn it into a compliment.",
              },
            ],
          },
          {
            type: "callout",
            tone: "tip",
            title: "Practise out loud",
            md: "Reading rebuttals isn't the same as saying them under pressure. The practice simulator throws these objections at you, so try a few calls on \"skeptical\".",
          },
        ],
      },
      {
        id: "calling/practice",
        title: "Practise with an AI prospect",
        minutes: 10,
        summary: "Call a realistic business owner, get pushed back on, and get scored.",
        blocks: [
          {
            type: "text",
            md: `The fastest way to get good is reps. In the **practice simulator** you call an AI business owner: pick their trade, their mood and how hard they are. They'll object, interrupt and only agree to a next step if you earn it.

When you hang up, you get a scorecard out of 100: how you opened, whether you asked questions, how you handled objections, whether you closed for a next step, and the line you should've said at your weakest moment.`,
          },
          {
            type: "callout",
            tone: "tip",
            title: "Practise on real leads",
            md: "Pick a business from your Agents list and the prospect will play that exact business, with its name, trade, town and reviews. Do a practice call right before the real one.",
          },
          { type: "task", task: "practiced" },
        ],
      },
      {
        id: "calling/email",
        title: "Email and follow-ups",
        minutes: 6,
        summary: "Let Octa follow up by email while you're on the phone.",
        blocks: [
          {
            type: "text",
            md: `Not everyone picks up. Email is your second channel, and follow-ups are where most deals actually happen: plenty of people only reply on the second or third message.

In **Agents → Outreach**, connect your own mailbox (Outlook for now). Octa sends the first email and the follow-ups from *your* address, on weekdays during business hours, and stops as soon as they reply.`,
          },
          {
            type: "script",
            title: "First email",
            when: "Short and plain. No images, no attachments, one link.",
            lines: [
              "Subject: Website for [Business]",
              "Hi [Owner],",
              "I came across [Business] on Google: great reviews, but I couldn't find a website, so I built you one. Here it is: [Link]",
              "If you like it, it's yours. If not, no worries at all.",
              "[Your name]",
            ],
          },
          {
            type: "script",
            title: "Follow-up",
            when: "2–3 days later, in the same thread.",
            lines: [
              "Hi [Owner], just bumping this up in case it got buried. Did you get a chance to look at the site? Happy to change anything you don't like.",
              "[Your name]",
            ],
          },
          {
            type: "callout",
            tone: "warning",
            title: "Stay on the right side of the rules",
            md: "Every email needs your real name and a mailing address, and an unsubscribe link (Octa adds it). Don't buy email lists. Email businesses about their business only.",
          },
          { type: "task", task: "mailbox" },
          { type: "task", task: "emailed" },
        ],
      },
    ],
  },
  {
    id: "close",
    title: "Close & get paid",
    tagline: "Price it, ask for the sale, and keep clients for years.",
    lessons: [
      {
        id: "close/pricing",
        title: "Pricing that works",
        minutes: 6,
        summary: "What to charge, and how to make it an easy yes.",
        blocks: [
          {
            type: "text",
            md: `Charge a **setup fee** for the site and a **monthly fee** for hosting and small changes. Price on what the site is worth to the business, not on how long it took you. (It took you minutes. That's your edge, not their discount.)`,
          },
          {
            type: "text",
            md: `| | Starter | Standard | Premium |
|---|---|---|---|
| Setup | $300–500 | $750–1,200 | $1,500–3,000 |
| Monthly | $49–79 | $99–149 | $199–299 |
| Good for | Cafés, barbers, cleaners | Trades, salons, gyms | Dentists, law firms, clinics |

Higher-value trades can pay more because one extra customer is worth more to them. A dentist's new patient is worth thousands.`,
          },
          {
            type: "steps",
            items: [
              { title: "Offer three options", body: "Most people pick the middle one. The top option makes the middle one look reasonable." },
              { title: "Say the price, then stop", body: "Don't apologise or explain. Silence is fine; let them answer." },
              { title: "Discount the setup, never the monthly", body: "If you must give, take money off the one-off fee. The monthly fee is your business." },
            ],
          },
          {
            type: "callout",
            tone: "tip",
            title: "What you keep",
            md: `Octacore keeps ${fee} of the site price and of each hosting payment; the rest goes to your payout account (before Whop's processing fees).`,
          },
        ],
      },
      {
        id: "close/the-close",
        title: "Asking for the sale",
        minutes: 6,
        summary: "When they like it, close on the call with a checkout link.",
        blocks: [
          {
            type: "text",
            md: `If they're looking at the site and saying nice things, they're ready. Most people lose the sale here by waiting for the owner to ask "so how do I buy it?". They won't. **You ask.**`,
          },
          {
            type: "script",
            title: "The close",
            when: "They've seen the site and they like it.",
            lines: [
              "So it sounds like you like it. Here's how it works: it's [Setup price] to make it yours, and [Monthly price] a month after that for hosting and any changes you want.",
              "I can send you the checkout link now; you'll see the site full-screen, pay securely, and it's yours. Shall I send it to this email?",
              "(If yes) Sent. Open it while I'm on the line, and I'll stay on in case anything's unclear.",
            ],
            practice: { mood: "friendly", difficulty: "normal" },
          },
          {
            type: "callout",
            tone: "tip",
            title: "Stay on the line",
            md: "Deals that are \"I'll do it later\" often never happen. Stay on while they pay; it takes two minutes.",
          },
        ],
      },
      {
        id: "close/get-paid",
        title: "Payouts and checkout links",
        minutes: 5,
        summary: "Set up payouts once, then sell any site from the builder.",
        blocks: [
          {
            type: "steps",
            items: [
              { title: "Set up payouts", body: "In Sales, connect a payout account (through Whop) and verify your identity. You only do this once." },
              { title: "Open the site and press Sell", body: "Set the one-off price, an optional monthly hosting fee, and the buyer's name and email." },
              { title: "They get an email", body: `Their checkout link works for ${INVITE_DAYS} days. You can resend or cancel it in Sales.` },
              { title: "They pay and own it", body: "They see the site full-screen, pay, and get an invite to sign in as the owner. You keep building it for them." },
            ],
          },
          { type: "task", task: "payouts" },
          { type: "task", task: "sent" },
          { type: "task", task: "sold" },
        ],
      },
      {
        id: "close/keep",
        title: "Keep clients and grow",
        minutes: 5,
        summary: "Turn one sale into years of monthly income, and referrals.",
        blocks: [
          {
            type: "steps",
            items: [
              { title: "Make changes fast", body: "New menu, holiday hours, a seasonal offer: each is one sentence in the builder. Same-day changes are why people keep paying." },
              { title: "Check in monthly", body: "A two-line message: \"Anything you want updated this month?\" It reminds them you're there." },
              { title: "Upsell what helps them", body: "A booking page, a second location page, a domain, a seasonal landing page." },
              { title: "Ask for referrals", body: "Right after they pay, while they're happiest: \"Who else do you know who needs one?\" Offer a free month for each referral that buys." },
            ],
          },
          {
            type: "callout",
            tone: "story",
            title: "Where it adds up",
            md: "Touseef went from $500 a month to $20k MRR by doing this again and again. Every client who stays is income you don't have to find again.",
          },
        ],
      },
    ],
  },
];

export const LESSONS: (Lesson & { moduleId: string })[] = MODULES.flatMap((m) => m.lessons.map((l) => ({ ...l, moduleId: m.id })));

export function findLesson(id: string) {
  const index = LESSONS.findIndex((l) => l.id === id);
  if (index === -1) return null;
  return { lesson: LESSONS[index], module: MODULES.find((m) => m.id === LESSONS[index].moduleId)!, prev: LESSONS[index - 1], next: LESSONS[index + 1] };
}

// The tasks a lesson must see done to complete itself (optional ones don't count).
export const lessonTasks = (lesson: Lesson) =>
  lesson.blocks.flatMap((b) => (b.type === "task" && !b.optional ? [b.task] : []));

// A lesson is done when it was marked done, or when it has required tasks and all of them are done.
export function isLessonDone(lesson: Lesson, completed: Set<string>, tasks: Record<TaskId, boolean>) {
  if (completed.has(lesson.id)) return true;
  const required = lessonTasks(lesson);
  return required.length > 0 && required.every((t) => tasks[t]);
}

// Lesson text as plain prose, for Coach's prompt.
export function lessonText(lesson: Lesson) {
  return lesson.blocks
    .map((b) => {
      switch (b.type) {
        case "text":
          return b.md;
        case "task":
          return `Task: ${TASKS[b.task].label}${b.optional ? " (optional)" : ""}`;
        case "steps":
          return b.items.map((i, n) => `${n + 1}. ${i.title}: ${i.body}`).join("\n");
        case "callout":
          return `${b.title}: ${b.md}`;
        case "script":
          return `Script "${b.title}" (${b.when}):\n${b.lines.join("\n")}`;
        case "objections":
          return b.items.map((i) => `Objection "${i.says}" → "${i.reply}" (${i.why})`).join("\n");
        case "funnel":
          return `${b.stages.map((s) => `${s.value} ${s.label.toLowerCase()}`).join(" → ")}. ${b.note}`;
        case "compare":
          return `${b.bad.label}: ${b.bad.text}\n${b.good.label}: ${b.good.text}`;
      }
    })
    .join("\n\n");
}
