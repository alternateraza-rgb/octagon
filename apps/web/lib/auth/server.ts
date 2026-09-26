import { cache } from "react";
import { headers } from "next/headers";
import { betterAuth } from "better-auth";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { hashPassword, verifyPassword } from "./password";

function createAuth(env: CloudflareEnv) {
  return betterAuth({
    database: env.DB,
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: [
      "https://octacore.app",
      "https://www.octacore.app",
      "https://octacore.fortnitekhan111.workers.dev",
      "http://localhost:3000",
      "http://localhost:8787",
    ],
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      password: { hash: hashPassword, verify: verifyPassword },
    },
    // Rate limits key on the client IP; behind Cloudflare that's cf-connecting-ip.
    advanced: { ipAddress: { ipAddressHeaders: ["cf-connecting-ip"] } },
    telemetry: { enabled: false },
  });
}

// Bindings are per request on Workers, so the auth instance is too.
export async function getAuth() {
  const { env } = await getCloudflareContext({ async: true });
  return createAuth(env);
}

export const getSession = cache(async () => {
  const auth = await getAuth();
  return auth.api.getSession({ headers: await headers() });
});
