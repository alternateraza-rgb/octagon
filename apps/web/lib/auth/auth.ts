import { betterAuth } from "better-auth";
import { createAuthMiddleware } from "better-auth/api";
import { sendEmail } from "@/lib/email/send";
import { passwordChangedEmail, resetPasswordEmail, welcomeEmail } from "@/lib/email/templates";
import { hashPassword, verifyPassword } from "./password";

// Removes what a deleted account left outside D1 (its rows cascade): live sites and uploaded files.
async function removeUserFiles(env: CloudflareEnv, userId: string) {
  const [sites, uploads] = await Promise.all([
    env.DB.prepare(`select slug from site where userId = ? and slug is not null`).bind(userId).all<{ slug: string }>(),
    env.DB.prepare(`select id from upload where userId = ?`).bind(userId).all<{ id: string }>(),
  ]);
  await Promise.all([
    ...sites.results.map((s) => env.SITES.delete(`site:${s.slug}`)),
    ...uploads.results.map((u) => env.UPLOADS.delete(u.id)),
  ]);
}

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
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, url }) => {
        await sendEmail(env, resetPasswordEmail({ to: user.email, name: user.name, url }));
      },
      onPasswordReset: async ({ user }) => {
        await sendEmail(env, passwordChangedEmail({ to: user.email, name: user.name }));
      },
    },
    user: {
      deleteUser: {
        enabled: true,
        beforeDelete: (user) => removeUserFiles(env, user.id),
      },
    },
    databaseHooks: {
      user: {
        create: {
          after: async (user) => {
            await sendEmail(env, welcomeEmail({ to: user.email, name: user.name }));
          },
        },
      },
    },
    hooks: {
      // Let people know when their password is changed from settings (resets are covered above).
      after: createAuthMiddleware(async (ctx) => {
        if (ctx.path !== "/change-password") return;
        const user = ctx.context.session?.user;
        if (user && !(ctx.context.returned instanceof Error)) {
          await sendEmail(env, passwordChangedEmail({ to: user.email, name: user.name }));
        }
      }),
    },
    // Rate limits key on the client IP; behind Cloudflare that's cf-connecting-ip.
    // Always the __Secure- cookie, whichever route (Next or the Worker entry) reads it.
    advanced: { useSecureCookies: true, ipAddress: { ipAddressHeaders: ["cf-connecting-ip"] } },
    telemetry: { enabled: false },
  });
}
