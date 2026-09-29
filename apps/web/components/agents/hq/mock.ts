// Stand-in data for the Octa Agents prototype, built relative to the render time so "2h ago" labels
// stay stable between the server render and hydration. Replaced by the outreach API once it lands.
import type { Agent, AgentEvent, FieldLead, Stage, Thread } from "./types";

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

// A small deterministic PRNG, so the scattered pins land in the same places on every render.
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

const HAMILTON: [number, number] = [-79.8711, 43.2557];
const AUSTIN: [number, number] = [-97.7431, 30.2672];
const CALGARY: [number, number] = [-114.0719, 51.0447];

const PLUMBERS = [
  "Joe's Plumbing & Drain",
  "Barton Street Plumbers",
  "Mountain Brow Plumbing",
  "Ancaster Pipe Works",
  "Dundas Valley Drains",
  "Stoney Creek Rooter",
  "Locke St Plumbing Co.",
  "Westdale Water Heaters",
  "Harbourfront Plumbing",
  "Kirkendall Pipe & Gas",
  "Gage Park Plumbing",
  "Concession Street Plumbers",
  "Red Hill Drain Pros",
  "Binbrook Plumbing",
  "Waterdown Plumbing & Heating",
  "Crown Point Plumbing",
  "Corktown Pipe Co.",
  "Albion Falls Plumbing",
  "Winona Plumbing Services",
  "Upper James Plumbing",
  "Durand Drain Doctors",
  "Beasley Plumbing",
  "Rosedale Rooter",
  "Chedoke Plumbing",
  "Sherman Cut Plumbing",
  "Garth St Pipe & Drain",
];

const STREETS = ["King St E", "Barton St E", "Locke St S", "Upper James St", "Concession St", "Main St W", "James St N", "Ottawa St N"];

// How the 26 plumbers are spread across the pipeline: a wide top, a narrow bottom.
const SPREAD: Stage[] = [
  ...Array<Stage>(9).fill("found"),
  ...Array<Stage>(7).fill("email"),
  ...Array<Stage>(6).fill("contacted"),
  ...Array<Stage>(2).fill("replied"),
  ...Array<Stage>(2).fill("interested"),
];

// The businesses the sample activity feed and replies talk about sit at the matching stage.
const PINNED: Record<string, Stage> = {
  "Joe's Plumbing & Drain": "interested",
  "Barton Street Plumbers": "replied",
  "Locke St Plumbing Co.": "contacted",
  "Red Hill Drain Pros": "contacted",
  "Westdale Water Heaters": "email",
  "Garth St Pipe & Drain": "found",
};

const SOURCES = ["facebook.com", "yellowpages.ca", "instagram.com", "411.ca", "facebook.com", "nextdoor.com"];

function slug(name: string) {
  return name.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "").slice(0, 18);
}

export function mockLeads(now: number, agentId = "scout"): FieldLead[] {
  const rand = rng(agentId.length * 97 + 11);
  const center = agentId === "scout" ? HAMILTON : agentId === "atlas" ? AUSTIN : CALGARY;
  const city = agentId === "scout" ? "Hamilton, ON" : agentId === "atlas" ? "Austin, TX" : "Calgary, AB";
  return PLUMBERS.map((name, i) => {
    const stage = PINNED[name] ?? SPREAD[i];
    const angle = rand() * Math.PI * 2;
    const radius = 0.012 + rand() * 0.07;
    const hasEmail = stage !== "found";
    return {
      id: `${agentId}-${i}`,
      name,
      category: "Plumber",
      address: `${100 + Math.floor(rand() * 900)} ${STREETS[i % STREETS.length]}, ${city}`,
      lng: center[0] + Math.cos(angle) * radius * 1.4,
      lat: center[1] + Math.sin(angle) * radius,
      stage,
      score: Math.round(52 + rand() * 45),
      email: hasEmail ? `${slug(name)}@${i % 3 ? "gmail.com" : "outlook.com"}` : null,
      emailSource: hasEmail ? SOURCES[i % SOURCES.length] : null,
      at: now - Math.floor(rand() * 5 * DAY),
    };
  });
}

export function mockAgents(): Agent[] {
  return [
    {
      id: "scout",
      name: "Scout",
      niche: "Plumbers",
      locations: ["Hamilton, ON", "Burlington, ON"],
      country: "CA",
      center: HAMILTON,
      dailyCap: 20,
      senderName: "Raza from Octa Studio",
      pitch: "A fast, modern site in 48 hours for $499, with a free preview first.",
      status: "active",
      now: "Writing to Locke St Plumbing Co.",
      sentToday: 13,
      stats: { found: 26, emails: 17, contacted: 10, replies: 4, interested: 2 },
    },
    {
      id: "atlas",
      name: "Atlas",
      niche: "Landscapers",
      locations: ["Austin, TX", "Round Rock, TX"],
      country: "US",
      center: AUSTIN,
      dailyCap: 30,
      senderName: "Raza from Octa Studio",
      pitch: "A site that brings in quote requests while you're out on a job.",
      status: "active",
      now: "Scouting Round Rock for landscapers",
      sentToday: 22,
      stats: { found: 64, emails: 38, contacted: 31, replies: 6, interested: 3 },
    },
    {
      id: "echo",
      name: "Echo",
      niche: "Hair salons",
      locations: ["Calgary, AB"],
      country: "CA",
      center: CALGARY,
      dailyCap: 15,
      senderName: "Raza from Octa Studio",
      pitch: "Online booking and a gallery of your best work, live this week.",
      status: "paused",
      now: "Paused by you on Monday",
      sentToday: 0,
      stats: { found: 18, emails: 9, contacted: 9, replies: 1, interested: 0 },
    },
  ];
}

export function mockEvents(now: number): AgentEvent[] {
  return [
    { id: "e1", at: now - 2 * MIN, kind: "sent", text: "Sent the first email to Locke St Plumbing Co.", detail: "“A new site for Locke St Plumbing?”", leadId: "scout-6" },
    { id: "e2", at: now - 9 * MIN, kind: "email", text: "Found an email for Westdale Water Heaters", detail: "Listed on facebook.com", leadId: "scout-7" },
    { id: "e3", at: now - 26 * MIN, kind: "reply", text: "Joe's Plumbing & Drain replied", detail: "Interested: “How soon could it be up?”", leadId: "scout-0" },
    { id: "e4", at: now - 48 * MIN, kind: "found", text: "Found Garth St Pipe & Drain on Garth St", detail: "No website · Facebook page only", leadId: "scout-25" },
    { id: "e5", at: now - 1.3 * HOUR, kind: "followup", text: "Followed up with Red Hill Drain Pros", detail: "Second email, 3 days after the first", leadId: "scout-12" },
    { id: "e6", at: now - 2.1 * HOUR, kind: "search", text: "Scouted Hamilton for plumbers", detail: "41 businesses · 9 without a website" },
    { id: "e7", at: now - 5 * HOUR, kind: "reply", text: "Barton Street Plumbers replied", detail: "Question: “Do you do the hosting too?”", leadId: "scout-1" },
    { id: "e8", at: now - 20 * HOUR, kind: "sent", text: "Sent 20 emails", detail: "Today's limit reached at 3:40pm" },
  ];
}

export function mockThreads(now: number): Thread[] {
  return [
    {
      id: "t1",
      agentId: "scout",
      leadId: "scout-0",
      business: "Joe's Plumbing & Drain",
      contact: "Joe Marchetti",
      category: "Plumber · Hamilton, ON",
      intent: "interested",
      unread: true,
      messages: [
        {
          from: "agent",
          at: now - 2 * DAY,
          body: "Hi Joe,\n\nI came across Joe's Plumbing & Drain on Facebook: 4.9 stars from 112 reviews is a great reputation. When people search “plumber Hamilton”, though, there's no site to land on, so those calls go to someone else.\n\nI build fast, simple sites for trades. I can have yours live in 48 hours for $499, and I'll show you a free preview before you pay anything.\n\nWant me to put one together?\n\nRaza, Octa Studio",
        },
        { from: "them", at: now - 26 * MIN, body: "Hey Raza, yeah we've been meaning to do this for years. How soon could it be up? And can people book a call from it?" },
      ],
      draft:
        "Hi Joe, glad to hear it. I can have a preview ready today, with a big “Call now” button and a short form for booking a visit. Here's a first look built from your Facebook page: [preview link]\n\nIf you like it, it can be live by Thursday.\n\nRaza",
    },
    {
      id: "t2",
      agentId: "scout",
      leadId: "scout-1",
      business: "Barton Street Plumbers",
      contact: "Priya Nair",
      category: "Plumber · Hamilton, ON",
      intent: "question",
      unread: true,
      messages: [
        {
          from: "agent",
          at: now - 3 * DAY,
          body: "Hi Priya,\n\nBarton Street Plumbers has a loyal following on Yellow Pages but no website of its own. I build clean, fast sites for local trades: live in 48 hours for $499, with a free preview first.\n\nWould you like to see one?\n\nRaza, Octa Studio",
        },
        { from: "them", at: now - 5 * HOUR, body: "Maybe. Do you do the hosting too, or is that extra? We don't want another monthly bill we forget about." },
      ],
      draft:
        "Hi Priya, good question. Hosting, security and updates are included for the first year, then it's $15/month, and you can cancel any time. No surprises. Want me to send a preview?\n\nRaza",
    },
    {
      id: "t3",
      agentId: "atlas",
      leadId: "atlas-3",
      business: "Greenline Lawn & Garden",
      contact: "Marcus Webb",
      category: "Landscaper · Austin, TX",
      intent: "interested",
      unread: false,
      messages: [
        { from: "agent", at: now - 4 * DAY, body: "Hi Marcus,\n\nGreenline's before-and-after photos on Instagram are excellent. A simple site would turn them into quote requests while you're out on a job.\n\nI can have one live in 48 hours for $499.\n\nRaza" },
        { from: "them", at: now - 1 * DAY, body: "Sounds good. Send me something to look at." },
        { from: "agent", at: now - 20 * HOUR, body: "Here you go: greenline.octacore.app. Let me know what you'd change." },
      ],
      draft: "Hi Marcus, just checking you got the preview. Happy to swap photos or add a quote form.\n\nRaza",
    },
    {
      id: "t4",
      agentId: "scout",
      leadId: "scout-12",
      business: "Red Hill Drain Pros",
      contact: "Dan Kowalski",
      category: "Plumber · Hamilton, ON",
      intent: "not_now",
      unread: false,
      messages: [
        { from: "agent", at: now - 6 * DAY, body: "Hi Dan,\n\nRed Hill Drain Pros doesn't have a website yet. I can build one in 48 hours for $499, with a free preview first.\n\nRaza" },
        { from: "them", at: now - 2 * DAY, body: "Not right now, we're booked solid until spring. Maybe then." },
      ],
      draft: "Totally understand, Dan. I'll check back in March. Good luck with the busy season.\n\nRaza",
    },
  ];
}
