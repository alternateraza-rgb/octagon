-- Yearly billing: each Whop plan Octacore creates, and each subscription, is monthly or yearly.
alter table "whop_plan" add column "interval" text not null default 'month';
alter table "subscription" add column "interval" text not null default 'month';
