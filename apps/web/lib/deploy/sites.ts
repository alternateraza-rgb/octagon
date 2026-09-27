// Deployed sites live in KV, keyed by slug, so public traffic never touches D1 or Next.
const key = (slug: string) => `site:${slug}`;

export function siteUrl(env: CloudflareEnv, slug: string) {
  return `https://${slug}.${env.SITES_DOMAIN}`;
}

// Subdomains that belong to Octacore itself.
const RESERVED = new Set([
  "www", "api", "app", "admin", "mail", "email", "dashboard", "s", "img", "static", "assets", "cdn",
  "blog", "docs", "help", "support", "status", "billing", "login", "signup", "auth", "dev", "staging",
]);

// When the plain name is taken: pakeeza-core, pakeeza-studio, … then pakeeza-2 … then random.
const SUFFIXES = ["core", "studio", "hq", "co", "online", "site"];

export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/, "");
}

// The business name from a title like "Pakeeza | Custom South Asian Wedding Attire".
export function slugBase(title: string | null) {
  const name = (title ?? "").split(/\s[—–|·-]\s|:\s|,/)[0];
  const base = slugify(name);
  return base.length >= 3 ? base : slugify(title ?? "") || "site";
}

export function slugProblem(slug: string) {
  if (slug.length < 3 || slug.length > 40) return "Use 3 to 40 characters.";
  if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(slug)) return "Use lowercase letters, numbers and dashes, starting and ending with a letter or number.";
  if (RESERVED.has(slug)) return "That address is reserved.";
  return null;
}

function slugCandidates(base: string) {
  const random = Array.from(crypto.getRandomValues(new Uint8Array(4)), (b) => "abcdefghijkmnpqrstuvwxyz23456789"[b % 32]).join("");
  const trimmed = base.slice(0, 32).replace(/-+$/, "");
  return [
    ...(slugProblem(base) ? [] : [base]),
    ...SUFFIXES.map((s) => `${trimmed}-${s}`),
    ...Array.from({ length: 8 }, (_, i) => `${trimmed}-${i + 2}`),
    `${trimmed}-${random}`,
  ].filter((c) => !slugProblem(c));
}

// Picks the first free address for a site, in order of preference.
export async function pickSlug(db: D1Database, title: string | null) {
  const candidates = slugCandidates(slugBase(title));
  const placeholders = candidates.map(() => "?").join(",");
  const { results } = await db.prepare(`select slug from site where slug in (${placeholders})`).bind(...candidates).all<{ slug: string }>();
  const taken = new Set(results.map((r) => r.slug));
  return candidates.find((c) => !taken.has(c)) ?? candidates.at(-1)!;
}

export async function publish(env: CloudflareEnv, slug: string, html: string) {
  await env.SITES.put(key(slug), html);
}

export async function unpublish(env: CloudflareEnv, slug: string) {
  await env.SITES.delete(key(slug));
}

// Returns the slug when a request is for a deployed site:
// https://<slug>.octacore.app or https://octacore.app/s/<slug>
export function deployedSlug(url: URL, sitesDomain: string) {
  const suffix = `.${sitesDomain}`;
  if (url.hostname.endsWith(suffix)) {
    const sub = url.hostname.slice(0, -suffix.length);
    if (/^[a-z0-9-]+$/.test(sub) && !RESERVED.has(sub)) return sub;
  }
  const match = url.pathname.match(/^\/s\/([a-z0-9-]+)\/?$/);
  return match?.[1] ?? null;
}

const NOT_FOUND = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Site not found</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;font:17px/1.47 -apple-system,BlinkMacSystemFont,system-ui,sans-serif;background:#f9f8f6;color:#0f0f0f;text-align:center}p{color:#5f5f63}a{color:#c2410c}</style></head>
<body><main><h1 style="font-size:40px;letter-spacing:-.03em;margin:0">Nothing here yet</h1><p>This site isn't deployed. <a href="https://octacore.app">Build one with Octacore ›</a></p></main></body></html>`;

// Generated HTML is untrusted: the CSP sandbox gives it an opaque origin, so its
// scripts can't read or set cookies on octacore.app.
export const SANDBOX_CSP = "sandbox allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals";

export async function serveDeployedSite(env: CloudflareEnv, slug: string) {
  const html = await env.SITES.get(key(slug), { cacheTtl: 60 });
  return new Response(html ?? NOT_FOUND, {
    status: html ? 200 : 404,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "content-security-policy": SANDBOX_CSP,
      "cache-control": "public, max-age=60",
      "x-robots-tag": html ? "all" : "noindex",
    },
  });
}
