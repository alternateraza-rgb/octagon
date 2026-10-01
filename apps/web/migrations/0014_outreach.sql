-- Outreach: Octa emails businesses from the user's own mailbox (Outlook for now), as a short sequence:
-- a first email, then follow-ups in the same thread until they reply.

-- The user's connected mailbox. Tokens are encrypted (lib/outreach/crypto.ts).
create table "mailbox" (
  "id" text not null primary key,
  "userId" text not null references "user" ("id") on delete cascade,
  -- 'microsoft' ('google' once Gmail is approved).
  "provider" text not null,
  "email" text not null,
  "name" text,
  "refreshToken" text not null,
  "accessToken" text,
  "accessExpiresAt" integer,
  -- 'connected', or 'error' when the provider stopped accepting the tokens.
  "status" text not null default 'connected',
  "error" text,
  "connectedAt" integer not null
);
create unique index "mailbox_userId_idx" on "mailbox" ("userId");

create table "outreach_settings" (
  "userId" text not null primary key references "user" ("id") on delete cascade,
  "senderName" text not null,
  -- Required in every email's footer (CAN-SPAM, CASL).
  "mailingAddress" text not null,
  -- What the user offers, in their words: "a free preview of their new website".
  "offer" text not null,
  "dailyCap" integer not null default 20,
  "followUps" integer not null default 1,
  -- Emails every business that gets an email, without the user starting each one.
  "autopilot" integer not null default 0,
  "paused" integer not null default 0,
  -- IANA zone; emails go out on weekdays between 9am and 5pm there.
  "timezone" text not null default 'America/Toronto',
  "updatedAt" integer not null
);

-- One sequence per business per user.
create table "sequence" (
  "id" text not null primary key,
  "userId" text not null references "user" ("id") on delete cascade,
  "leadId" text not null references "lead" ("id") on delete cascade,
  "toEmail" text not null,
  -- 'active', 'replied', 'bounced', 'unsubscribed', 'stopped', 'finished' or 'failed'.
  "status" text not null default 'active',
  "unsubToken" text not null,
  -- The first email as the provider knows it: follow-ups reply to it, and replies are found by its conversation.
  "threadMessageId" text,
  "conversationId" text,
  "lastCheckedAt" integer,
  "createdAt" integer not null,
  "endedAt" integer
);
create unique index "sequence_leadId_idx" on "sequence" ("leadId");
create unique index "sequence_unsubToken_idx" on "sequence" ("unsubToken");
create index "sequence_userId_status_idx" on "sequence" ("userId", "status");

create table "sequence_step" (
  "id" text not null primary key,
  "sequenceId" text not null references "sequence" ("id") on delete cascade,
  "userId" text not null,
  -- 0 = first email, 1 and 2 = follow-ups.
  "step" integer not null,
  "subject" text not null,
  "body" text not null,
  -- 'scheduled', 'sent', 'failed' or 'canceled'.
  "status" text not null default 'scheduled',
  "scheduledAt" integer not null,
  "sentAt" integer,
  "error" text
);
create index "sequence_step_due_idx" on "sequence_step" ("status", "scheduledAt");
create index "sequence_step_userId_sentAt_idx" on "sequence_step" ("userId", "sentAt");

-- Addresses that asked not to be emailed again, by anyone on Octacore.
create table "suppression" (
  "email" text not null primary key,
  "reason" text not null,
  "createdAt" integer not null
);
