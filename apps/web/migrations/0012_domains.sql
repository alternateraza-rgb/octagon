-- Custom domains: a site can also be served on a domain its builder connects. Cloudflare for SaaS
-- checks the domain and issues its certificate; once it's active, KV maps `host:<hostname>` to the
-- site's slug so the Worker serves it like <slug>.octacore.app.
create table "custom_domain" (
  "id" text not null primary key,
  "siteId" text not null references "site" ("id") on delete cascade,
  -- Lowercase, punycode, no trailing dot.
  "hostname" text not null unique,
  -- Cloudflare's custom hostname id.
  "cfHostnameId" text,
  -- 'pending', 'active' or 'failed'.
  "status" text not null default 'pending',
  -- Cloudflare's certificate status (initializing, pending_validation, active, …).
  "sslStatus" text,
  -- JSON: DNS records Cloudflare still needs to see, [{ type, name, value }].
  "verification" text,
  "error" text,
  -- 'connected' (the builder owns it) or 'purchased' (bought through Octacore).
  "source" text not null default 'connected',
  "checkedAt" integer,
  "createdAt" integer not null,
  "updatedAt" integer not null
);
create index "custom_domain_siteId_idx" on "custom_domain" ("siteId");
create index "custom_domain_status_idx" on "custom_domain" ("status", "createdAt");
