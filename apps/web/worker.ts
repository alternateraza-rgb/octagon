// Worker entry: serves deployed sites (on octacore.app and custom domains) from KV, the streaming AI endpoints and Whop's webhooks
// directly; everything else goes to Next. The daily cron pauses sites of lapsed plans.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore `.open-next/worker.js` is generated at build time.
import { default as nextHandler } from "./.open-next/worker.js";
import { routeStreamingApi } from "./lib/api/streaming";
import { deployedSite, serveDeployedSite } from "./lib/deploy/sites";
import { domainSlug } from "./lib/domains/store";
import { serveImage } from "./lib/images";
import { routeUploads } from "./lib/uploads";
import { runBillingCron } from "./lib/billing/cron";
import { routeWhopWebhook } from "./lib/billing/webhook";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore generated at build time.
export { DOQueueHandler, DOShardedTagCache, BucketCachePurge } from "./.open-next/worker.js";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    // Stock photos for generated sites, on every host (dashboard previews and deployed sites).
    if (url.pathname === "/img") return serveImage(request, env);
    // Uploaded files, also on every host so deployed sites can use them.
    const uploads = routeUploads(request, env);
    if (uploads) return uploads;
    const site = deployedSite(url, env.SITES_DOMAIN);
    if (site) return serveDeployedSite(env, site.slug, { index: !site.onPath });
    // Custom domains connected to a site (Cloudflare for SaaS sends them here through the `*/*` route).
    const hostSlug = await domainSlug(env, url);
    if (hostSlug) return serveDeployedSite(env, hostSlug);
    const webhook = routeWhopWebhook(request, env, ctx);
    if (webhook) return webhook;
    const streaming = routeStreamingApi(request, env);
    if (streaming) return streaming;
    return nextHandler.fetch(request, env, ctx);
  },
  async scheduled(_controller, env, ctx) {
    await runBillingCron(env, ctx);
  },
} satisfies ExportedHandler<CloudflareEnv>;
