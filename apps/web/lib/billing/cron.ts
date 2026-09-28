// Daily job: pauses the live sites of accounts whose plan ended more than 14 days ago, and brings
// back any paused site whose owner has an active plan again (in case a webhook couldn't). Also
// re-checks custom domains still waiting on DNS.
import { refreshPendingDomains } from "@/lib/domains/store";
import { sendEmail } from "@/lib/email/send";
import { sitesPausedEmail } from "@/lib/email/templates";
import { ACTIVE, GRACE_DAYS, isComped } from "./entitlements";
import { pauseSites, resumeSites } from "./site-access";

// Accounts handled per run; anything left over is picked up the next day.
const BATCH = 25;

export async function runBillingCron(env: CloudflareEnv, ctx: ExecutionContext) {
  const cutoff = Date.now() - GRACE_DAYS * 24 * 60 * 60 * 1000;
  const { results: lapsed } = await env.DB.prepare(
    `select distinct u.id, u.name, u.email from subscription b join user u on u.id = b.userId
     join site s on s.userId = b.userId and s.deployedVersionId is not null and s.pausedAt is null
     where b.endedAt is not null and b.endedAt < ? limit ${BATCH}`,
  )
    .bind(cutoff)
    .all<{ id: string; name: string; email: string }>();
  for (const user of lapsed) {
    if (isComped(env, user.email)) continue;
    const count = await pauseSites(env, user.id);
    if (count) ctx.waitUntil(sendEmail(env, sitesPausedEmail({ to: user.email, name: user.name, count })));
  }

  const active = [...ACTIVE].map(() => "?").join(",");
  const { results: back } = await env.DB.prepare(
    `select distinct b.userId from subscription b join site s on s.userId = b.userId and s.pausedAt is not null
     where b.endedAt is null and b.status in (${active}) limit ${BATCH}`,
  )
    .bind(...ACTIVE)
    .all<{ userId: string }>();
  for (const { userId } of back) await resumeSites(env, userId);
  console.log(`Billing cron: paused sites for ${lapsed.length} accounts, resumed ${back.length}`);

  const domains = await refreshPendingDomains(env);
  console.log(`Domains cron: checked ${domains.checked} pending domains, dropped ${domains.failed}`);
}
