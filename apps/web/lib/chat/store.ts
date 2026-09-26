export type Conversation = { id: string; title: string; updatedAt: number };
export type ChatMessage = { id: string; role: "user" | "assistant"; content: string };

export async function listConversations(db: D1Database, userId: string, limit = 30) {
  const { results } = await db
    .prepare(`select id, title, updatedAt from conversation where userId = ? order by updatedAt desc limit ?`)
    .bind(userId, limit)
    .all<Conversation>();
  return results;
}

export function getConversation(db: D1Database, id: string, userId: string) {
  return db.prepare(`select id, title, updatedAt from conversation where id = ? and userId = ?`).bind(id, userId).first<Conversation>();
}

export async function listMessages(db: D1Database, conversationId: string) {
  const { results } = await db
    .prepare(`select id, role, content from message where conversationId = ? order by createdAt asc`)
    .bind(conversationId)
    .all<ChatMessage>();
  return results;
}

export async function createConversation(db: D1Database, userId: string, firstMessage: string) {
  const id = crypto.randomUUID();
  const now = Date.now();
  const title = firstMessage.replace(/\s+/g, " ").trim().slice(0, 60);
  await db
    .prepare(`insert into conversation (id, userId, title, createdAt, updatedAt) values (?, ?, ?, ?, ?)`)
    .bind(id, userId, title, now, now)
    .run();
  return id;
}

export async function addMessage(db: D1Database, conversationId: string, role: ChatMessage["role"], content: string) {
  const now = Date.now();
  await db.batch([
    db
      .prepare(`insert into message (id, conversationId, role, content, createdAt) values (?, ?, ?, ?, ?)`)
      .bind(crypto.randomUUID(), conversationId, role, content, now),
    db.prepare(`update conversation set updatedAt = ? where id = ?`).bind(now, conversationId),
  ]);
}

export async function deleteConversation(db: D1Database, id: string, userId: string) {
  await db.prepare(`delete from conversation where id = ? and userId = ?`).bind(id, userId).run();
}
