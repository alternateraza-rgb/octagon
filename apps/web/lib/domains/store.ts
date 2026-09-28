// Custom domains: a builder connects a domain they own to a deployed site. Cloudflare for SaaS
// validates it and issues its certificate; once active, KV maps `host:<hostname>` to the site's slug
// so the Worker serves it straight from KV, like <slug>.octacore.app.
import { getAccess } from "@/lib/billing/entitlements";
import { CloudflareError, createCustomHostname, deleteCustomHostname, getCustomHostname, type CustomHostname } from "./cloudflare";

// A site can have its apex and www.
export const MAX_DOMAINS_PER_SITE = 2;
// Domains whose DNS never pointed at us are dropped after this long.
export const PENDING_DAYS = 14;

export type DomainStatus = "pending" | "active" | "failed";
export type DnsRecord = { type: "CNAME" | "TXT"; name: string; value: string };
export type CustomDomain = {
  id: string;
  siteId: string;
  hostname: string;
  cfHostnameId: string | null;
  status: DomainStatus;
  sslStatus: string | null;
  verification: string | null;
  error: string | null;
  source: "connected" | "purchased";
  checkedAt: number | null;
  createdAt: number;
  updatedAt: number;
};
// What the dashboard sees: the records the customer has to add at their DNS provider.
export type DomainView = Pick<CustomDomain, "id" | "hostname" | "status" | "sslStatus" | "error"> & { records: DnsRecord[] };

const hostKey = (hostname: string) => `host:${hostname}`;

// Turns what someone typed ("https://www.Example.com/about") into a hostname, or explains what's wrong.
export function normalizeHostname(input: string, sitesDomain: string): { hostname: string } | { error: string } {
  const raw = input
    .trim()
    .toLowerCase()
    .replace(/^[a-z]+:\/\//, "")
    .replace(/[/?#].*$/, "")
    .replace(/:\d+$/, "")
    .replace(/\.$/, "");
  if (!raw) return { error: "Enter a domain, like www.example.com." };
  let hostname: string;
  try {
    hostname = new URL(`https://${raw}`).hostname;
  } catch {
    return { error: "That doesn't look like a domain." };
  }
  if (hostname.length > 253 || !hostname.includes(".") || hostname.startsWith("[")) {
    return { error: "That doesn't look like a domain." };
  }
  if (!hostname.split(".").every((label) => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label))) {
    return { error: "That doesn't look like a domain." };
  }
  // Bare IP addresses end in a number; real top-level domains never do.
  if (/^\d+$/.test(hostname.split(".").at(-1)!)) return { error: "That doesn't look like a domain." };
  if (hostname === sitesDomain || hostname.endsWith(`.${sitesDomain}`)) {
    return { error: `Use the address editor for ${sitesDomain} addresses.` };
  }
  return { hostname };
}

// Sold sites whose client pays for hosting, and sites of builders on Pro or Agency, can use custom
// domains. Returns an error Response (the same shape checkLimit uses) or null when allowed.
export async function customDomainRefusal(env: CloudflareEnv, user: { id: string; email: string }, siteId: string) {
  const hosted = await env.DB.prepare(`select 1 from sale where siteId = ? and hostingStatus = 'active' limit 1`)
    .bind(siteId)
    .first();
  if (hosted) return null;
  const access = await getAccess(env, user);
  if (access.active && (access.plan === "pro" || access.plan === "agency")) return null;
  return Response.json(
    {
      error: "Custom domains come with the Pro and Agency plans, and with sites your clients pay hosting for.",
      upgrade: true,
      reason: "domains",
      plan: access.plan,
    },
    { status: 402 },
  );
}

export async function listDomains(db: D1Database, siteId: string) {
  const { results } = await db
    .prepare(`select * from custom_domain where siteId = ? order by createdAt asc`)
    .bind(siteId)
    .all<CustomDomain>();
  return results;
}

export function getDomain(db: D1Database, id: string, siteId: string) {
  return db.prepare(`select * from custom_domain where id = ? and siteId = ?`).bind(id, siteId).first<CustomDomain>();
}

// The first active custom domain, for showing a site's address.
export async function primaryDomain(db: D1Database, siteId: string) {
  const row = await db
    .prepare(`select hostname from custom_domain where siteId = ? and status = 'active' order by createdAt asc limit 1`)
    .bind(siteId)
    .first<{ hostname: string }>();
  return row?.hostname ?? null;
}

export function toView(env: CloudflareEnv, domain: CustomDomain): DomainView {
  const records: DnsRecord[] = [{ type: "CNAME", name: domain.hostname, value: env.CUSTOM_DOMAIN_TARGET }];
  if (domain.status !== "active" && domain.verification) {
    records.push(...(JSON.parse(domain.verification) as DnsRecord[]));
  }
  return { id: domain.id, hostname: domain.hostname, status: domain.status, sslStatus: domain.sslStatus, error: domain.error, records };
}

// TXT records Cloudflare will also accept, for DNS providers where the CNAME can't go in yet.
function verificationRecords(ch: CustomHostname): DnsRecord[] {
  const records: DnsRecord[] = [];
  const own = ch.ownership_verification;
  if (own?.type === "txt" && own.name && own.value) records.push({ type: "TXT", name: own.name, value: own.value });
  for (const r of ch.ssl?.validation_records ?? []) {
    if (r.txt_name && r.txt_value) records.push({ type: "TXT", name: r.txt_name, value: r.txt_value });
  }
  return records;
}

function readErrors(ch: CustomHostname) {
  const messages = [...(ch.verification_errors ?? []), ...(ch.ssl?.validation_errors ?? []).map((e) => e.message ?? "")];
  return messages.filter(Boolean).join(" ").slice(0, 300) || null;
}

// Connects a hostname to a site. Returns the new row, or an error message and status.
export async function addDomain(
  env: CloudflareEnv,
  siteId: string,
  hostname: string,
): Promise<{ domain: CustomDomain } | { error: string; status: number }> {
  const count = await env.DB.prepare(`select count(*) as n from custom_domain where siteId = ?`).bind(siteId).first<{ n: number }>();
  if ((count?.n ?? 0) >= MAX_DOMAINS_PER_SITE) {
    return { error: `A site can have up to ${MAX_DOMAINS_PER_SITE} domains. Remove one first.`, status: 400 };
  }
  const id = crypto.randomUUID();
  const now = Date.now();
  try {
    await env.DB.prepare(`insert into custom_domain (id, siteId, hostname, status, createdAt, updatedAt) values (?, ?, ?, 'pending', ?, ?)`)
      .bind(id, siteId, hostname, now, now)
      .run();
  } catch {
    return { error: `${hostname} is already connected to a site.`, status: 409 };
  }
  let ch: CustomHostname;
  try {
    ch = await createCustomHostname(env, hostname);
  } catch (error) {
    await env.DB.prepare(`delete from custom_domain where id = ?`).bind(id).run();
    console.error("Custom hostname create failed", error);
    const message = error instanceof CloudflareError && error.cloudflareMessage;
    return { error: message || "Couldn't connect that domain. Try again.", status: 502 };
  }
  await env.DB.prepare(`update custom_domain set cfHostnameId = ?, sslStatus = ?, verification = ?, checkedAt = ?, updatedAt = ? where id = ?`)
    .bind(ch.id, ch.ssl?.status ?? null, JSON.stringify(verificationRecords(ch)), now, now, id)
    .run();
  return { domain: (await env.DB.prepare(`select * from custom_domain where id = ?`).bind(id).first<CustomDomain>())! };
}

// Reads the domain's state from Cloudflare. Once the domain and its certificate are active, it's
// mapped to the site's slug in KV and starts serving.
export async function refreshDomain(env: CloudflareEnv, domain: CustomDomain): Promise<CustomDomain> {
  if (!domain.cfHostnameId) return domain;
  let ch: CustomHostname;
  try {
    ch = await getCustomHostname(env, domain.cfHostnameId);
  } catch (error) {
    console.error("Custom hostname read failed", error);
    return domain;
  }
  const sslStatus = ch.ssl?.status ?? null;
  const live = ch.status === "active" && sslStatus === "active";
  const blocked = ch.status === "blocked" || ch.status === "moved" || ch.status === "deleted";
  const status: DomainStatus = live ? "active" : blocked ? "failed" : domain.status === "failed" ? "failed" : "pending";
  const error = live ? null : blocked ? `Cloudflare marked this domain ${ch.status}.` : readErrors(ch);

  if (live) {
    const site = await env.DB.prepare(`select slug from site where id = ?`).bind(domain.siteId).first<{ slug: string | null }>();
    if (site?.slug) await env.SITES.put(hostKey(domain.hostname), site.slug);
  } else if (domain.status === "active") {
    await env.SITES.delete(hostKey(domain.hostname));
  }
  const now = Date.now();
  const verification = JSON.stringify(verificationRecords(ch));
  await env.DB.prepare(
    `update custom_domain set status = ?, sslStatus = ?, verification = ?, error = ?, checkedAt = ?, updatedAt = ? where id = ?`,
  )
    .bind(status, sslStatus, verification, error, now, now, domain.id)
    .run();
  return { ...domain, status, sslStatus, verification, error, checkedAt: now, updatedAt: now };
}

export async function removeDomain(env: CloudflareEnv, domain: CustomDomain) {
  if (domain.cfHostnameId) await deleteCustomHostname(env, domain.cfHostnameId);
  await env.SITES.delete(hostKey(domain.hostname));
  await env.DB.prepare(`delete from custom_domain where id = ?`).bind(domain.id).run();
}

export async function removeSiteDomains(env: CloudflareEnv, siteId: string) {
  for (const domain of await listDomains(env.DB, siteId)) await removeDomain(env, domain);
}

// Points a site's active domains at its new slug after its address changes.
export async function remapDomains(env: CloudflareEnv, siteId: string, slug: string) {
  for (const domain of await listDomains(env.DB, siteId)) {
    if (domain.status === "active") await env.SITES.put(hostKey(domain.hostname), slug);
  }
}

// The slug a custom domain serves, or null when the request isn't for one.
export async function domainSlug(env: CloudflareEnv, url: URL) {
  const host = url.hostname;
  if (host === env.SITES_DOMAIN || host.endsWith(`.${env.SITES_DOMAIN}`)) return null;
  if (host === "localhost" || host.endsWith(".workers.dev") || !host.includes(".")) return null;
  return env.SITES.get(hostKey(host), { cacheTtl: 60 });
}

// Daily: checks pending domains, and drops the ones whose DNS never pointed at us.
export async function refreshPendingDomains(env: CloudflareEnv, batch = 50) {
  const { results } = await env.DB.prepare(`select * from custom_domain where status = 'pending' order by checkedAt asc limit ?`)
    .bind(batch)
    .all<CustomDomain>();
  const cutoff = Date.now() - PENDING_DAYS * 24 * 60 * 60 * 1000;
  let failed = 0;
  for (const row of results) {
    const domain = await refreshDomain(env, row);
    if (domain.status === "pending" && domain.createdAt < cutoff) {
      if (domain.cfHostnameId) await deleteCustomHostname(env, domain.cfHostnameId).catch((e) => console.error(e));
      await env.DB.prepare(
        `update custom_domain set status = 'failed', cfHostnameId = null, error = ?, updatedAt = ? where id = ?`,
      )
        .bind(`The DNS records weren't found within ${PENDING_DAYS} days. Remove the domain and add it again once DNS is set up.`, Date.now(), domain.id)
        .run();
      failed++;
    }
  }
  return { checked: results.length, failed };
}
