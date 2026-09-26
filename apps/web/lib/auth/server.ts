import { cache } from "react";
import { headers } from "next/headers";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createAuth } from "./auth";

// Bindings are per request on Workers, so the auth instance is too.
export async function getAuth() {
  const { env } = await getCloudflareContext({ async: true });
  return createAuth(env);
}

export const getSession = cache(async () => {
  const auth = await getAuth();
  return auth.api.getSession({ headers: await headers() });
});
