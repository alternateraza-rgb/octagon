-- One row per AI build or edit started, for the daily limit. Builds are streamed straight to the
-- browser and saved by a second request, so saved versions alone can't be counted.
create table "generation" (
  "id" text not null primary key,
  "userId" text not null references "user" ("id") on delete cascade,
  "createdAt" integer not null
);
create index "generation_userId_createdAt_idx" on "generation" ("userId", "createdAt");
