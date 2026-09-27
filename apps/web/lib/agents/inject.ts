// Real business data in sites built from a lead. The model never writes reviews, the phone number,
// address or hours: it leaves empty placeholders, and these blocks are dropped in on save. That keeps
// the details exact, and reviews word for word with the attribution Google's terms require.
//
// Each block is one element carrying data-octa, with no element of the same tag inside, so it can be
// found again in any later version. Edits send the model the page with blocks collapsed back to
// placeholders, and each save puts the previous version's blocks back.
import type { PlaceDetails, Review } from "./places";

export type Blocks = { reviews: string; contact: string };
type Kind = keyof Blocks;

const TAG: Record<Kind, string> = { reviews: "section", contact: "aside" };
const KINDS = Object.keys(TAG) as Kind[];

const placeholder = (kind: Kind) => `<${TAG[kind]} data-octa="${kind}"></${TAG[kind]}>`;
const find = (kind: Kind) => new RegExp(`<${TAG[kind]}\\b[^>]*\\bdata-octa=["']${kind}["'][^>]*>[\\s\\S]*?</${TAG[kind]}>`, "i");

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const safeUrl = (u: string | undefined) => (u && /^https:\/\//i.test(u) ? esc(u) : null);
const month = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" });

// Inherits the page's fonts and colours so it sits in any design.
const STYLE = `<style>
.octa-rv{display:grid;gap:20px;grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr));margin:0;padding:0;list-style:none}
.octa-rv li{display:flex;flex-direction:column;gap:12px;padding:24px;border-radius:18px;border:1px solid color-mix(in srgb,currentColor 14%,transparent);background:color-mix(in srgb,currentColor 3%,transparent)}
.octa-rv header{display:flex;align-items:center;gap:12px}
.octa-rv img{width:40px;height:40px;border-radius:50%;object-fit:cover;flex:none}
.octa-rv a{color:inherit}
.octa-rv .by{font-weight:600;text-decoration:none}
.octa-rv .when,.octa-src{font-size:.85em;opacity:.7}
.octa-rv .stars{color:#f5a623;letter-spacing:2px}
.octa-rv blockquote{margin:0;line-height:1.55}
.octa-src{margin-top:20px}
.octa-ct{display:grid;gap:14px;font-style:normal;line-height:1.5}
.octa-ct a{color:inherit}
.octa-ct dl{display:grid;grid-template-columns:auto 1fr;gap:4px 16px;margin:0}
.octa-ct dt{font-weight:600}
.octa-ct dd{margin:0}
</style>`;

function review(r: Review) {
  const text = r.text?.text?.trim() || r.originalText?.text?.trim();
  if (!text) return "";
  const author = r.authorAttribution ?? {};
  const name = esc(author.displayName?.trim() || "Google user");
  const profile = safeUrl(author.uri);
  const photo = safeUrl(author.photoUri);
  const stars = Math.max(0, Math.min(5, Math.round(r.rating ?? 0)));
  const when = r.publishTime ? month.format(new Date(r.publishTime)) : (r.relativePublishTimeDescription ?? "");
  const link = safeUrl(r.googleMapsUri);
  return `<li>
<header>${photo ? `<img src="${photo}" alt="" referrerpolicy="no-referrer" loading="lazy">` : ""}<div>${
    profile ? `<a class="by" href="${profile}" target="_blank" rel="noopener nofollow">${name}</a>` : `<span class="by">${name}</span>`
  }<div class="when">${esc(when)}</div></div></header>
${stars ? `<div class="stars" role="img" aria-label="${stars} out of 5 stars">${"★".repeat(stars)}${"☆".repeat(5 - stars)}</div>` : ""}
<blockquote>${esc(text).replace(/\n+/g, "<br>")}</blockquote>
${link ? `<a class="when" href="${link}" target="_blank" rel="noopener nofollow">View on Google Maps</a>` : ""}
</li>`;
}

export function renderReviews(details: PlaceDetails) {
  const items = (details.reviews ?? []).map(review).filter(Boolean);
  if (!items.length) return "";
  const maps = safeUrl(details.googleMapsUri);
  const total = details.userRatingCount ?? 0;
  const summary =
    details.rating && total
      ? `${details.rating.toFixed(1)} ★ from ${total.toLocaleString("en-US")} review${total === 1 ? "" : "s"} on `
      : "Reviews from ";
  const source = maps ? `<a href="${maps}" target="_blank" rel="noopener">Google Maps</a>` : "Google Maps";
  return `<section data-octa="reviews" data-fetched="${new Date().toISOString().slice(0, 10)}">${STYLE}
<ul class="octa-rv">${items.join("")}</ul>
<p class="octa-src">${summary}${source}</p>
</section>`;
}

export function renderContact(details: PlaceDetails, socialUrl: string | null) {
  const phone = details.nationalPhoneNumber;
  const tel = (details.internationalPhoneNumber ?? phone ?? "").replace(/[^\d+]/g, "");
  const maps = safeUrl(details.googleMapsUri);
  const social = safeUrl(socialUrl ?? undefined);
  const hours = details.regularOpeningHours?.weekdayDescriptions ?? [];
  const rows = hours
    .map((line) => {
      const [day, ...rest] = line.split(": ");
      return `<dt>${esc(day)}</dt><dd>${esc(rest.join(": ") || "")}</dd>`;
    })
    .join("");
  const parts = [
    phone && tel ? `<p><a href="tel:${esc(tel)}">${esc(phone)}</a></p>` : "",
    details.formattedAddress
      ? `<p>${esc(details.formattedAddress)}${maps ? `<br><a href="${maps}" target="_blank" rel="noopener">Get directions</a>` : ""}</p>`
      : "",
    rows ? `<dl>${rows}</dl>` : "",
    social ? `<p><a href="${social}" target="_blank" rel="noopener">Follow us</a></p>` : "",
  ].filter(Boolean);
  if (!parts.length) return "";
  return `<aside data-octa="contact">${STYLE}<address class="octa-ct">${parts.join("\n")}</address></aside>`;
}

export function renderBlocks(details: PlaceDetails, socialUrl: string | null): Blocks {
  return { reviews: renderReviews(details), contact: renderContact(details, socialUrl) };
}

// The blocks as they are in a saved page, to carry into the next version.
export function extractBlocks(html: string): Blocks {
  const out: Blocks = { reviews: "", contact: "" };
  for (const kind of KINDS) {
    const block = html.match(find(kind))?.[0] ?? "";
    // An empty placeholder means there was nothing to show last time either.
    if (block && block !== placeholder(kind)) out[kind] = block;
  }
  return out;
}

// What the model sees when editing: placeholders instead of the blocks it mustn't rewrite.
export function collapseBlocks(html: string) {
  return KINDS.reduce((page, kind) => page.replace(find(kind), placeholder(kind)), html);
}

export const hasPlaceholders = (html: string) => KINDS.some((kind) => find(kind).test(html));

// Puts each block where the model left its placeholder; a block with nothing to show removes its
// placeholder. On a first build, a block the model forgot goes just above the footer; after that, a
// missing placeholder means the user asked for the section to go.
export function applyBlocks(html: string, blocks: Blocks, { insertMissing = false } = {}) {
  let page = html;
  for (const kind of KINDS) {
    const block = blocks[kind];
    if (find(kind).test(page)) {
      page = page.replace(find(kind), () => block);
    } else if (block && insertMissing) {
      const at = page.search(/<footer\b/i) >= 0 ? page.search(/<footer\b/i) : page.search(/<\/body>/i);
      page = at >= 0 ? `${page.slice(0, at)}${block}\n${page.slice(at)}` : `${page}${block}`;
    }
  }
  return page;
}

// Appended to the builder's input for a site built from a lead.
export const CREATE_NOTE = `This site is for a real business, built from its Google listing. Its real reviews and contact details are added automatically, so:
- In the testimonials section, write a heading and short intro, then leave exactly ${placeholder("reviews")} where the reviews go. Don't write any testimonials yourself.
- In the contact section, leave exactly ${placeholder("contact")} where the phone number, address and opening hours go. You may add a contact form or call-to-action beside it.
- Use only the phone number given above for any call buttons (tel: links). Never invent reviews, awards, prices, staff names or other facts.`;

export const EDIT_NOTE = `The page contains ${placeholder("reviews")} and/or ${placeholder("contact")} placeholders, which are filled automatically with the business's real Google reviews and contact details. Keep them exactly as they are, in place, unless asked to remove that section.`;
