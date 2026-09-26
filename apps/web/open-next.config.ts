import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Pages are static today, so no incremental cache yet. Add R2 here once pages revalidate.
export default defineCloudflareConfig({});
