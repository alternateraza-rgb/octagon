// Deployed sites live in KV, keyed by slug, so public traffic never touches D1 or Next.
const key = (slug: string) => `site:${slug}`;

export function siteUrl(env: CloudflareEnv, slug: string) {
  return `https://${slug}.${env.SITES_DOMAIN}`;
}

export function makeSlug(title: string | null) {
  const base = (title ?? "site")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’]/g, "")
    .split(/\s[—–|·-]\s/)[0]
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/, "");
  const suffix = Array.from(crypto.getRandomValues(new Uint8Array(4)), (b) => "abcdefghijkmnpqrstuvwxyz23456789"[b % 32]).join("");
  return `${base || "site"}-${suffix}`;
}

export async function publish(env: CloudflareEnv, slug: string, html: string) {
  await env.SITES.put(key(slug), html);
}

export async function unpublish(env: CloudflareEnv, slug: string) {
  await env.SITES.delete(key(slug));
}

const RESERVED = new Set(["www", "api", "app", "admin", "mail", "dashboard"]);

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
