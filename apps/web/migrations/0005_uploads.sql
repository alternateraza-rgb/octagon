-- Files people upload (images, logos, PDFs). The bytes live in the UPLOADS KV namespace.
create table "upload" (
  "id" text not null primary key,
  "userId" text not null references "user" ("id") on delete cascade,
  "name" text not null,
  "type" text not null,
  "size" integer not null,
  "url" text not null,
  "createdAt" integer not null
);
create index "upload_userId_createdAt_idx" on "upload" ("userId", "createdAt");

-- Attachments as JSON arrays of { id, url, name, type }.
alter table "message" add column "attachments" text;
alter table "site" add column "attachments" text;
alter table "site_version" add column "attachments" text;
