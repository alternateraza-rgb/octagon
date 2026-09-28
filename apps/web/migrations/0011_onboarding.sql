-- First-run tour and "Getting started" checklist. Progress through the checklist is derived from
-- sites and sales, so only the two "seen" flags are stored.
alter table "user" add column "tourCompletedAt" integer;
alter table "user" add column "checklistDismissedAt" integer;

-- Existing accounts already know their way around: only people who sign up from now on get the
-- tour automatically (anyone can replay it from the account menu).
update "user" set "tourCompletedAt" = unixepoch() * 1000;
