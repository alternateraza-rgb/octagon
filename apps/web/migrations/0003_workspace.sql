-- Chat, site versions and deployments.
create table "conversation" (
  "id" text not null primary key,
  "userId" text not null references "user" ("id") on delete cascade,
  "title" text not null,
  "createdAt" integer not null,
  "updatedAt" integer not null
);
create index "conversation_userId_updatedAt_idx" on "conversation" ("userId", "updatedAt");

create table "message" (
  "id" text not null primary key,
  "conversationId" text not null references "conversation" ("id") on delete cascade,
  "role" text not null,
  "content" text not null,
  "createdAt" integer not null
);
create index "message_conversationId_createdAt_idx" on "message" ("conversationId", "createdAt");

-- Every generation or edit of a site is an immutable version.
create table "site_version" (
  "id" text not null primary key,
  "siteId" text not null references "site" ("id") on delete cascade,
  "instruction" text not null,
  "html" text not null,
  "createdAt" integer not null
);
create index "site_version_siteId_createdAt_idx" on "site_version" ("siteId", "createdAt");

insert into "site_version" ("id", "siteId", "instruction", "html", "createdAt")
  select lower(hex(randomblob(16))), "id", "prompt", "html", "updatedAt" from "site" where "html" is not null;

-- Public address, e.g. rosas-bakery-x7k2.octacore.app, assigned on first deploy.
alter table "site" add column "slug" text;
create unique index "site_slug_idx" on "site" ("slug");
alter table "site" add column "deployedVersionId" text;

create table "deployment" (
  "id" text not null primary key,
  "siteId" text not null references "site" ("id") on delete cascade,
  "versionId" text not null references "site_version" ("id") on delete cascade,
  "createdAt" integer not null
);
create index "deployment_siteId_createdAt_idx" on "deployment" ("siteId", "createdAt");
