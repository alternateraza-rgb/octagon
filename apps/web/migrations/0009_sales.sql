-- Selling sites: an Octacore user invites their client by email, the client pays through Whop on
-- the seller's own connected Whop account, and Octacore keeps a 10% application fee.

-- The seller's connected Whop account (biz_…), created when they set up payouts.
create table "seller_account" (
  "userId" text not null primary key references "user" ("id") on delete cascade,
  "whopAccountId" text not null,
  -- Whop's identity verification status: not_started, pending, manual_review, approved, rejected.
  "verification" text not null default 'not_started',
  "createdAt" integer not null,
  "updatedAt" integer not null
);

-- One invite to buy one site. Paying for the site and paying for hosting are separate Whop
-- checkouts, so each carries its own 10% fee (a Whop fee is a fixed amount per plan).
create table "sale" (
  "id" text not null primary key,
  "siteId" text not null references "site" ("id") on delete cascade,
  "sellerId" text not null references "user" ("id") on delete cascade,
  -- The secret in the invite link.
  "token" text not null unique,
  "buyerEmail" text not null,
  "buyerName" text not null,
  "message" text,
  "priceCents" integer not null,
  -- Monthly hosting; null when the seller keeps hosting the site on their own plan.
  "monthlyCents" integer,
  "currency" text not null default 'usd',
  -- 'sent', 'viewed', 'paid', 'canceled'.
  "status" text not null,
  "siteCheckoutId" text,
  "hostingCheckoutId" text,
  "hostingMembershipId" text,
  -- 'none', 'active' or 'ended'.
  "hostingStatus" text not null default 'none',
  "manageUrl" text,
  "viewedAt" integer,
  "paidAt" integer,
  "expiresAt" integer not null,
  "createdAt" integer not null,
  "updatedAt" integer not null
);
create index "sale_sellerId_createdAt_idx" on "sale" ("sellerId", "createdAt");
create index "sale_siteId_idx" on "sale" ("siteId");
create index "sale_hostingMembershipId_idx" on "sale" ("hostingMembershipId");

-- A sold site's owner: the client who bought it. The seller keeps building it.
alter table "site" add column "ownerId" text references "user" ("id") on delete set null;
alter table "site" add column "saleId" text;
create index "site_ownerId_idx" on "site" ("ownerId");

-- 'builder' for Octacore's own users; 'owner' for clients who only own sites they bought.
alter table "user" add column "role" text not null default 'builder';
