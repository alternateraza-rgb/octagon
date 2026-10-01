// The contact hunt: a public email for a business with no website. The phone number comes with the
// Maps listing; the email has to be found. In order, stopping at the first good one:
// 1. The page the listing links to, when it's one that can be read (Linktree, a booking page…).
//    Facebook and Instagram need a login, so they're skipped.
// 2. One Google search for the business and "email": result snippets often quote the email from its
//    Facebook "About" page, Yelp, or a local directory.
// Candidates are filtered, ranked by how well they match the business, and kept only if their domain
// takes mail (MX record, checked over Cloudflare's DNS-over-HTTPS).
import { saveContact, type Business, type Confidence } from "./business";
import { serpWebSearch } from "./serp";

const EMAIL = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,24}/gi;

// Addresses that are never the business's own.
const JUNK_DOMAINS = [
  "example.com",
  "example.org",
  "domain.com",
  "email.com",
  "sentry.io",
  "sentry-next.wixpress.com",
  "wixpress.com",
  "wix.com",
  "godaddy.com",
  "squarespace.com",
  "yelp.com",
  "facebook.com",
  "instagram.com",
  "google.com",
  "linktr.ee",
  "yellowpages.com",
  "yellowpages.ca",
  "bbb.org",
  "mapquest.com",
  "angi.com",
  "homeadvisor.com",
  "thumbtack.com",
  "houzz.com",
  "nextdoor.com",
];
const JUNK_LOCAL = /^(noreply|no-reply|donotreply|privacy|abuse|webmaster|postmaster|support|press|legal|example|your|name|user|email)$/i;
const FREE_MAIL = ["gmail.com", "yahoo.com", "yahoo.ca", "hotmail.com", "outlook.com", "live.com", "icloud.com", "aol.com", "msn.com", "rogers.com", "shaw.ca", "bell.net", "sympatico.ca", "telus.net", "videotron.ca", "comcast.net", "att.net", "verizon.net", "protonmail.com", "me.com"];
// Hosts worth fetching directly: public pages without a login wall.
const READABLE = ["linktr.ee", "linkin.bio", "booksy.com", "vagaro.com", "squareup.com", "square.site", "business.site", "carrd.co", "beacons.ai"];

// `aboutThem`: the page or search result the address came from is about this business (its title
// names them), not a directory or a neighbour that happens to mention them.
type Candidate = { email: string; source: string | null; aboutThem: boolean };

function emailsIn(text: string, source: string | null, aboutThem: boolean): Candidate[] {
  const out: Candidate[] = [];
  for (const match of text.matchAll(EMAIL)) {
    const email = match[0].toLowerCase().replace(/\.+$/, "");
    const [local, domain] = email.split("@");
    if (!local || !domain) continue;
    if (/\.(png|jpe?g|gif|webp|svg|css|js)$/.test(email)) continue;
    if (JUNK_DOMAINS.some((d) => domain === d || domain.endsWith(`.${d}`))) continue;
    if (JUNK_LOCAL.test(local)) continue;
    out.push({ email, source, aboutThem });
  }
  return out;
}

// Words in a business name that don't tell it apart from others in its trade or town: "Dallas
// Plumbing Pros" shares "plumbing" with every plumber, so only its distinctive words count.
const GENERIC = new Set(
  (
    "inc ltd llc corp company co services service the and pros pro plus group shop store center centre " +
    "plumbing plumber plumbers heating cooling hvac roofing roofer electric electrical electrician landscape landscaping " +
    "lawn cleaning cleaners auto repair repairs mechanic dental dentist clinic salon spa barber cafe restaurant pizza pizzeria " +
    "kitchen grill bakery provisions bistro construction contracting contractors painting painters moving movers " +
    "rooter drain sewer pest control towing detailing fitness studio family local best quality"
  ).split(" "),
);

function distinctive(b: Business) {
  const place = `${b.city ?? ""} ${b.region ?? ""}`.toLowerCase();
  return b.name
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 4 && !GENERIC.has(t) && !place.includes(t));
}

// A result is about the business when its title carries the business's distinctive words (or, for a
// name made only of generic words, the whole name).
function about(text: string | undefined, b: Business, tokens: string[]) {
  const t = (text ?? "").toLowerCase();
  if (!tokens.length) return t.includes(b.name.toLowerCase());
  return tokens.filter((k) => t.includes(k)).length >= Math.min(2, tokens.length);
}

// Whether an address can be trusted as this business's, and how far. A company address has to carry
// the business's name; a Gmail-style address has to come from a result about them.
function rank(c: Candidate, tokens: string[]): { score: number; confidence: Confidence } | null {
  const [local, domain] = c.email.split("@");
  const compact = (local + domain).replace(/[^a-z0-9]/g, "");
  const matchesName = tokens.some((t) => compact.includes(t));
  const freeMail = FREE_MAIL.includes(domain);
  if (!freeMail && !matchesName) return null;
  if (freeMail && !c.aboutThem) return null;
  let score = (matchesName ? 3 : 0) + (c.aboutThem ? 2 : 0) + (freeMail ? 0 : 1);
  if (/^(info|contact|hello|office|admin|book|bookings|service|sales)$/.test(local)) score += 1;
  return { score, confidence: matchesName && c.aboutThem ? "high" : "medium" };
}

async function acceptsMail(domain: string) {
  const res = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=MX`, {
    headers: { accept: "application/dns-json" },
    signal: AbortSignal.timeout(4000),
  }).catch(() => null);
  if (!res?.ok) return true; // Unknown: don't throw away a likely address over a DNS hiccup.
  const body = (await res.json().catch(() => null)) as { Status?: number; Answer?: unknown[] } | null;
  return body?.Status === 0 && !!body.Answer?.length;
}

async function readPage(url: string) {
  const res = await fetch(url, {
    headers: { "user-agent": "Mozilla/5.0 (compatible; OctacoreBot/1.0; +https://octacore.app)", accept: "text/html" },
    redirect: "follow",
    signal: AbortSignal.timeout(5000),
  }).catch(() => null);
  if (!res?.ok || !(res.headers.get("content-type") ?? "").includes("html")) return "";
  const html = (await res.text().catch(() => "")).slice(0, 400_000);
  // mailto: links are the strongest signal, so they're listed first.
  const mailtos = [...html.matchAll(/mailto:([^"'?>\s]+)/gi)].map((m) => decodeURIComponent(m[1])).join(" ");
  return `${mailtos} ${html.replace(/<[^>]+>/g, " ")}`;
}

function readable(url: string | null) {
  if (!url) return false;
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return READABLE.some((h) => host === h || host.endsWith(`.${h}`));
  } catch {
    return false;
  }
}

async function pick(candidates: Candidate[], tokens: string[]) {
  const seen = new Map<string, Candidate>();
  for (const c of candidates) {
    const prev = seen.get(c.email);
    if (!prev || (!prev.aboutThem && c.aboutThem)) seen.set(c.email, c);
  }
  const ranked = [...seen.values()]
    .map((c) => ({ c, r: rank(c, tokens) }))
    // An address nothing ties to the business probably belongs to someone else: better none than wrong.
    .filter((x): x is { c: Candidate; r: NonNullable<ReturnType<typeof rank>> } => x.r !== null)
    .map(({ c, r }) => ({ c, ...r }))
    .sort((a, b) => b.score - a.score);
  for (const r of ranked.slice(0, 3)) {
    if (await acceptsMail(r.c.email.split("@")[1])) return { email: r.c.email, source: r.c.source, confidence: r.confidence };
  }
  return null;
}

// Finds and saves the business's email. Returns what was saved (null when nothing public was found).
export async function huntContacts(env: CloudflareEnv, userId: string | null, b: Business) {
  const tokens = distinctive(b);
  if (b.contactStatus !== "pending") {
    await env.DB.prepare(`update business set contactStatus = 'pending' where placeId = ?`).bind(b.placeId).run();
  }
  let found: Awaited<ReturnType<typeof pick>> = null;
  try {
    if (readable(b.socialUrl)) {
      const text = await readPage(b.socialUrl!);
      // Their own page (a Linktree, a booking page): what's on it is theirs.
      found = await pick(emailsIn(text, b.socialUrl, true), tokens);
    }
    if (!found) {
      const place = [b.city, b.region].filter(Boolean).join(" ");
      const results = await serpWebSearch(env, userId, `"${b.name}" ${place} email`, b.country);
      const candidates = results.flatMap((r) => emailsIn(r.text, r.link ?? null, about(r.title, b, tokens)));
      found = await pick(candidates, tokens);
    }
  } catch (error) {
    // Out of searches or Google didn't answer: leave it pending so the next pick tries again.
    console.error("Contact hunt failed", b.placeId, error);
    return undefined;
  }
  await saveContact(env.DB, b.placeId, found);
  return found;
}

// "(905) 555-0134" → "+19055550134", for tel: links.
export function telOf(phone: string | null) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return digits ? `+${digits}` : null;
}
