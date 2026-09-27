import { betterAuth } from "better-auth";
import { createAuthMiddleware } from "better-auth/api";
import { magicLink } from "better-auth/plugins";
import { sendEmail } from "@/lib/email/send";
import { ownerSignInEmail, ownerWelcomeEmail, passwordChangedEmail, resetPasswordEmail, welcomeEmail } from "@/lib/email/templates";
import { getSaleView } from "@/lib/sales/store";
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
    // Links in emails use the host the request came from; emails sent outside a request (a Whop
    // webhook sending a buyer their sign-in link) use octacore.app.
    baseURL: {
      allowedHosts: ["octacore.app", "www.octacore.app", "octacore.fortnitekhan111.workers.dev", "localhost:*"],
      fallback: "https://octacore.app",
      protocol: "auto",
    },
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
      // 'builder' for Octacore's users; 'owner' for clients who bought a site and only manage it.
      additionalFields: { role: { type: "string", defaultValue: "builder", input: false } },
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
    plugins: [
      // Clients who bought a site sign in with a link sent to their email. Only existing accounts
      // (created when they pay) can sign in this way.
      magicLink({
        disableSignUp: true,
        expiresIn: 3 * 24 * 60 * 60,
        sendMagicLink: async ({ email, url, metadata }) => {
          const sale = typeof metadata?.saleId === "string" ? await getSaleView(env.DB, metadata.saleId) : null;
          await sendEmail(
            env,
            sale && sale.buyerEmail.toLowerCase() === email.toLowerCase()
              ? ownerWelcomeEmail({
                  to: email,
                  buyerName: sale.buyerName,
                  sellerName: sale.sellerName,
                  siteTitle: sale.siteTitle ?? "Your website",
                  url,
                  needsHosting: !!sale.monthlyCents && sale.hostingStatus !== "active",
                })
              : ownerSignInEmail({ to: email, url }),
          );
        },
      }),
    ],
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
