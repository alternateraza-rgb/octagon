import { notFound } from "next/navigation";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { Chat } from "@/components/chat/chat";
import { getSession } from "@/lib/auth/server";
import { getConversation, listMessages } from "@/lib/chat/store";

export default async function ChatPage({ params }: PageProps<"/dashboard/chat/[id]">) {
  const { id } = await params;
  const session = (await getSession())!;
  const { env } = await getCloudflareContext({ async: true });
  const conversation = await getConversation(env.DB, id, session.user.id);
  if (!conversation) notFound();
  const messages = await listMessages(env.DB, id);
  return <Chat key={id} conversationId={id} initialMessages={messages} />;
}

export async function generateMetadata({ params }: PageProps<"/dashboard/chat/[id]">) {
  const { id } = await params;
  const session = await getSession();
  const { env } = await getCloudflareContext({ async: true });
  const conversation = session && (await getConversation(env.DB, id, session.user.id));
  return { title: conversation?.title ?? "Chat" };
}
