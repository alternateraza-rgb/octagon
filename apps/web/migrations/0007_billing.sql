-- Paid plans through Whop. One row per account, kept in sync by Whop's webhooks.
create table "subscription" (
  "userId" text not null primary key references "user" ("id") on delete cascade,
  "plan" text,
  "status" text not null,
  "whopMembershipId" text,
  "whopUserId" text,
  "periodStart" integer,
  "periodEnd" integer,
  "cancelAtPeriodEnd" integer not null default 0,
  "manageUrl" text,
  -- When access ended; live sites pause 14 days later.
  "endedAt" integer,
  "updatedAt" integer not null
);
create unique index "subscription_whopMembershipId_idx" on "subscription" ("whopMembershipId");

-- Webhook message ids already handled, so retries are processed once.
create table "billing_event" (
  "id" text not null primary key,
  "type" text not null,
  "receivedAt" integer not null
);

-- Chat messages count against plans too, so the log now records what each entry was.
alter table "generation" add column "kind" text not null default 'build';
create index "generation_userId_kind_createdAt_idx" on "generation" ("userId", "kind", "createdAt");

-- Set while a live site shows the "paused" page because its owner's plan ended.
alter table "site" add column "pausedAt" integer;

-- Accounts that already have live sites get the same 14 days of grace as a lapsed plan.
insert into "subscription" ("userId", "status", "endedAt", "updatedAt")
  select distinct "userId", 'none', unixepoch() * 1000, unixepoch() * 1000 from "site" where "deployedVersionId" is not null;
