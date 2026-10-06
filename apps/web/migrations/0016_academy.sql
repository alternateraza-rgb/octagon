-- Academy: Octacore's in-app training, from building a first site to closing a client. Lessons with
-- do-it-live tasks complete themselves from real account data; this table only records the lessons
-- someone marked done by hand.
create table "academy_progress" (
  "userId" text not null references "user" ("id") on delete cascade,
  -- A lesson id from lib/academy/curriculum.ts, e.g. 'calling/opener'.
  "lessonId" text not null,
  "completedAt" integer not null,
  primary key ("userId", "lessonId")
);

-- Every voice session started with ElevenLabs (the Coach or a practice prospect), for the monthly cap.
create table "academy_voice" (
  "id" text not null primary key,
  "userId" text not null references "user" ("id") on delete cascade,
  -- 'coach' or 'prospect'.
  "kind" text not null,
  "createdAt" integer not null
);
create index "academy_voice_userId_createdAt_idx" on "academy_voice" ("userId", "createdAt");

-- Practice cold calls and their scorecards.
create table "academy_call" (
  "id" text not null primary key,
  "userId" text not null references "user" ("id") on delete cascade,
  -- JSON: { trade, mood, difficulty } as picked in the simulator.
  "scenario" text not null,
  -- The real Octa Agents business the prospect played, if one was picked.
  "leadId" text references "lead" ("id") on delete set null,
  "prospectName" text not null,
  -- ElevenLabs' conversation id, null for calls practised by text.
  "conversationId" text,
  -- JSON: [{ role: 'user' | 'prospect', text }].
  "transcript" text not null,
  "durationSec" integer not null default 0,
  -- 0–100, from the grader.
  "score" integer not null,
  -- JSON: lib/academy/grade.ts's Scorecard.
  "feedback" text not null,
  "createdAt" integer not null
);
create index "academy_call_userId_createdAt_idx" on "academy_call" ("userId", "createdAt");
