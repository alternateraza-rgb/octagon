import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getSession } from "@/lib/auth/server";
import { isComped } from "@/lib/billing/entitlements";

// Academy is open to comped accounts only while it's being finished. Returns the session and env,
// or null for everyone else (pages 404, API routes answer 404).
export async function academyAccess() {
  const session = await getSession();
  if (!session) return null;
  const { env } = await getCloudflareContext({ async: true });
  if (!isComped(env, session.user.email)) return null;
  return { session, env, user: session.user };
}

export const notFound = () => Response.json({ error: "Not found." }, { status: 404 });
