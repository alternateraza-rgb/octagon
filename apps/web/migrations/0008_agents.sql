-- Octa Agents: Lead Finder searches Google Places for businesses without a website.
create table "agent_search" (
  "id" text not null primary key,
  "userId" text not null references "user" ("id") on delete cascade,
  "niche" text not null,
  "location" text not null,
  "country" text not null,
  "found" integer not null default 0,
  "qualified" integer not null default 0,
  "added" integer not null default 0,
  "createdAt" integer not null
);
create index "agent_search_userId_createdAt_idx" on "agent_search" ("userId", "createdAt");

-- One row per business a user has found. Google's terms allow keeping the place ID indefinitely;
-- the other fields are a snapshot, refreshed from Place Details whenever the lead is opened.
create table "lead" (
  "id" text not null primary key,
  "userId" text not null references "user" ("id") on delete cascade,
  "searchId" text references "agent_search" ("id") on delete set null,
  "placeId" text not null,
  "name" text not null,
  "category" text,
  "phone" text,
  "address" text,
  "country" text not null,
  "rating" real,
  "reviewCount" integer not null default 0,
  -- 'none' or 'social' (only a Facebook, Instagram, Yelp… page, kept in socialUrl).
  "webPresence" text not null,
  "socialUrl" text,
  "mapsUrl" text,
  "score" integer not null,
  "reasons" text not null,
  -- 'new', 'saved', 'dismissed' or 'built'.
  "status" text not null default 'new',
  "siteId" text references "site" ("id") on delete set null,
  "snapshotAt" integer not null,
  "createdAt" integer not null
);
create unique index "lead_userId_placeId_idx" on "lead" ("userId", "placeId");
create index "lead_userId_createdAt_idx" on "lead" ("userId", "createdAt");
create index "lead_siteId_idx" on "lead" ("siteId");
