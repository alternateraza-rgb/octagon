// Worker entry: serves deployed sites from KV and the streaming AI endpoints directly;
// everything else goes to Next.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore `.open-next/worker.js` is generated at build time.
import { default as nextHandler } from "./.open-next/worker.js";
import { routeStreamingApi } from "./lib/api/streaming";
import { deployedSlug, serveDeployedSite } from "./lib/deploy/sites";
import { serveImage } from "./lib/images";
import { routeUploads } from "./lib/uploads";

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
    const slug = deployedSlug(url, env.SITES_DOMAIN);
    if (slug) return serveDeployedSite(env, slug);
    const streaming = routeStreamingApi(request, env);
    if (streaming) return streaming;
    return nextHandler.fetch(request, env, ctx);
  },
} satisfies ExportedHandler<CloudflareEnv>;
