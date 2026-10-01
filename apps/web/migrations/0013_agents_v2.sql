-- Octa Agents v2: businesses come from SerpApi (Google Maps) and are kept in Octacore's own shared
-- table, so a business found by one search is reused by every later search and contact hunt.

-- One row per business Octa has seen, across all accounts.
create table "business" (
  "placeId" text not null primary key,
  -- SerpApi's id for the Maps listing, needed to fetch its reviews.
  "dataId" text,
  "name" text not null,
  "category" text,
  "phone" text,
  "address" text,
  "city" text,
  "region" text,
  "country" text not null,
  "lat" real,
  "lng" real,
  "rating" real,
  "reviewCount" integer not null default 0,
  -- 'none' or 'social'; null once a later check finds a website of its own.
  "webPresence" text,
  -- The link on the listing as Google has it (a social page, or the website that disqualifies it).
  "website" text,
  "socialUrl" text,
  "mapsUrl" text,
  "photoUrl" text,
  -- A short review quoted on the search card.
  "snippet" text,
  -- JSON: "Monday: 9 AM–5 PM" lines.
  "hoursJson" text,
  "closed" integer not null default 0,
  -- JSON array of reviews in lib/agents/places.ts's Review shape, and when they were fetched.
  "reviewsJson" text,
  "reviewsAt" integer,
  "email" text,
  "emailSource" text,
  -- 'high', 'medium' or 'low'.
  "emailConfidence" text,
  -- 'pending', 'found' or 'none'.
  "contactStatus" text not null default 'pending',
  "huntedAt" integer,
  "firstSeenAt" integer not null,
  "lastSeenAt" integer not null
);
create index "business_city_idx" on "business" ("country", "city");

-- Which businesses a search page returned, so the same niche and city isn't paid for twice.
create table "business_query" (
  "key" text not null primary key,
  "placeIds" text not null,
  "more" integer not null default 0,
  "fetchedAt" integer not null
);

-- Every paid call to a data provider, for the per-account daily cap and the monthly budget.
create table "api_call" (
  "id" text not null primary key,
  "userId" text,
  "provider" text not null,
  "kind" text not null,
  "createdAt" integer not null
);
create index "api_call_createdAt_idx" on "api_call" ("createdAt");
create index "api_call_userId_createdAt_idx" on "api_call" ("userId", "createdAt");

-- Leads are now businesses a user picked (status 'saved' or 'built') or skipped ('dismissed').
alter table "lead" add column "photoUrl" text;
alter table "lead" add column "snippet" text;
alter table "lead" add column "city" text;
-- The user's own correction wins over what the hunt found.
alter table "lead" add column "emailOverride" text;
alter table "lead" add column "phoneOverride" text;
alter table "lead" add column "notes" text;
-- 'added', 'built', 'emailed' or 'replied'.
alter table "lead" add column "stage" text not null default 'added';
create index "lead_placeId_createdAt_idx" on "lead" ("placeId", "createdAt");
-- 'new' leads from Lead Finder v1 were never reviewed; they count as picked.
update "lead" set "status" = 'saved' where "status" = 'new';
