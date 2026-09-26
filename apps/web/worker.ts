// Worker entry: serves deployed sites straight from KV and hands everything else to Next.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore `.open-next/worker.js` is generated at build time.
import { default as nextHandler } from "./.open-next/worker.js";
import { deployedSlug, serveDeployedSite } from "./lib/deploy/sites";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore generated at build time.
export { DOQueueHandler, DOShardedTagCache, BucketCachePurge } from "./.open-next/worker.js";

export default {
  async fetch(request, env, ctx) {
    const slug = deployedSlug(new URL(request.url), env.SITES_DOMAIN);
    if (slug) return serveDeployedSite(env, slug);
    return nextHandler.fetch(request, env, ctx);
  },
} satisfies ExportedHandler<CloudflareEnv>;
