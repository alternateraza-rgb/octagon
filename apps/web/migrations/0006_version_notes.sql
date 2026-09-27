-- Octa's note for each version: what it built or changed, and suggested next edits (JSON array).
alter table "site_version" add column "summary" text;
alter table "site_version" add column "suggestions" text;
