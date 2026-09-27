// Pausing and resuming an account's live sites when its plan ends or comes back. A paused site keeps
// its address and versions; only what its address serves changes.
import { publish } from "@/lib/deploy/sites";

export const PAUSED_PAGE = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>This site is paused</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;box-sizing:border-box;font:17px/1.5 -apple-system,BlinkMacSystemFont,system-ui,sans-serif;background:#f9f8f6;color:#0f0f0f;text-align:center}h1{font-size:40px;letter-spacing:-.03em;margin:0 0 8px}p{color:#5f5f63;margin:0}a{color:#c2410c}</style></head>
<body><main><h1>This site is paused</h1><p>It'll be back soon. Own this site? <a href="https://octacore.app/dashboard/settings#billing">Renew your plan ›</a></p></main></body></html>`;

// Swaps every live site of the account (apart from client-hosted ones) for the paused page. Returns how many were paused.
export async function pauseSites(env: CloudflareEnv, userId: string) {
  const { results } = await env.DB.prepare(
    // Sites a client pays hosting for stay up: they're paused only when that hosting ends.
    `select s.id, s.slug from site s where s.userId = ? and s.slug is not null and s.deployedVersionId is not null
       and s.pausedAt is null and not exists (select 1 from sale where sale.id = s.saleId and sale.hostingStatus = 'active')`,
  )
    .bind(userId)
    .all<{ id: string; slug: string }>();
  const now = Date.now();
  for (const site of results) {
    await publish(env, site.slug, PAUSED_PAGE);
    await env.DB.prepare(`update site set pausedAt = ? where id = ?`).bind(now, site.id).run();
  }
  return results.length;
}

// Puts each paused site's deployed version back on its address.
export async function resumeSites(env: CloudflareEnv, userId: string) {
  const { results } = await env.DB.prepare(
    `select s.id, s.slug, v.html from site s join site_version v on v.id = s.deployedVersionId
     where s.userId = ? and s.slug is not null and s.pausedAt is not null
       -- A site paused because its client stopped paying for hosting comes back with that hosting.
       and not exists (select 1 from sale where sale.id = s.saleId and sale.hostingStatus = 'ended')`,
  )
    .bind(userId)
    .all<{ id: string; slug: string; html: string }>();
  for (const site of results) {
    await publish(env, site.slug, site.html);
    await env.DB.prepare(`update site set pausedAt = null where id = ?`).bind(site.id).run();
  }
  return results.length;
}
