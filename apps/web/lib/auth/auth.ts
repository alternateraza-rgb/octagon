import { betterAuth } from "better-auth";
import { hashPassword, verifyPassword } from "./password";

// No Next.js imports here: the Worker entry uses this directly for its streaming endpoints.
export function createAuth(env: CloudflareEnv) {
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
    // Always the __Secure- cookie, whichever route (Next or the Worker entry) reads it.
    advanced: { useSecureCookies: true, ipAddress: { ipAddressHeaders: ["cf-connecting-ip"] } },
    telemetry: { enabled: false },
  });
}
