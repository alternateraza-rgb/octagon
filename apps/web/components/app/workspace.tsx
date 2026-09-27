"use client";

import { createContext, useContext, useState } from "react";
import type { Conversation } from "@/lib/chat/store";

export type Theme = "system" | "light" | "dark";
export type Me = { name: string; email: string };

type Workspace = {
  me: Me;
  conversations: Conversation[];
  // Chats are kept here on the client so replies don't have to re-render the whole layout.
  upsertConversation: (c: Conversation) => void;
  removeConversation: (id: string) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const WorkspaceContext = createContext<Workspace | null>(null);

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace outside WorkspaceProvider");
  return ctx;
}

export function WorkspaceProvider({
  me,
  initialConversations,
  initialTheme,
  children,
}: {
  me: Me;
  initialConversations: Conversation[];
  initialTheme: Theme;
  children: React.ReactNode;
}) {
  const [conversations, setConversations] = useState(initialConversations);
  const [theme, setThemeState] = useState(initialTheme);

  return (
    <WorkspaceContext.Provider
      value={{
        me,
        conversations,
        upsertConversation: (c) => setConversations((list) => [c, ...list.filter((x) => x.id !== c.id)].sort((a, b) => b.updatedAt - a.updatedAt)),
        removeConversation: (id) => setConversations((list) => list.filter((x) => x.id !== id)),
        theme,
        setTheme: (t) => {
          setThemeState(t);
          document.cookie = `theme=${t}; path=/; max-age=31536000; samesite=lax`;
        },
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}
