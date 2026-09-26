"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Bot, Globe, LogOut, Menu, MessageCircle, SquarePen, Trash2 } from "lucide-react";
import { OctacoreLogo } from "@octacore/ui/logo";
import { authClient } from "@/lib/auth/client";
import type { Conversation } from "@/lib/chat/store";

const NAV = [
  { href: "/dashboard", label: "Home", icon: MessageCircle, match: (p: string) => p === "/dashboard" || p.startsWith("/dashboard/chat") },
  { href: "/dashboard/sites", label: "Websites", icon: Globe, match: (p: string) => p.startsWith("/dashboard/sites") },
  { href: "/dashboard/agents", label: "Agents", icon: Bot, match: (p: string) => p.startsWith("/dashboard/agents"), soon: true },
];

export function AppShell({ email, conversations, children }: { email: string; conversations: Conversation[]; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  return (
    <div className="flex h-dvh overflow-hidden bg-canvas text-fg">
      <aside className="hidden w-[272px] shrink-0 border-r border-hairline bg-canvas-2/60 lg:flex">
        <Sidebar email={email} conversations={conversations} onNavigate={() => {}} />
      </aside>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.button
              aria-label="Close menu"
              className="absolute inset-0 bg-black/30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.aside
              className="absolute inset-y-0 left-0 flex w-[min(300px,85vw)] border-r border-hairline bg-canvas shadow-float"
              initial={reduce ? false : { x: "-100%" }}
              animate={{ x: 0 }}
              exit={reduce ? undefined : { x: "-100%" }}
              transition={{ type: "spring", stiffness: 260, damping: 30 }}
            >
              <Sidebar email={email} conversations={conversations} onNavigate={() => setOpen(false)} />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-hairline px-2 lg:hidden">
          <button aria-label="Open menu" onClick={() => setOpen(true)} className="grid size-11 place-items-center rounded-full hover:bg-fg/5">
            <Menu size={20} strokeWidth={1.5} />
          </button>
          <Link href="/dashboard" aria-label="Octacore home">
            <OctacoreLogo size={22} />
          </Link>
        </header>
        <main className="min-h-0 flex-1">{children}</main>
      </div>
    </div>
  );
}

function Sidebar({ email, conversations, onNavigate }: { email: string; conversations: Conversation[]; onNavigate: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

  async function remove(id: string) {
    await fetch(`/api/chat/${id}`, { method: "DELETE" });
    if (pathname === `/dashboard/chat/${id}`) router.push("/dashboard");
    router.refresh();
  }

  return (
    <nav aria-label="Workspace" className="flex min-h-0 w-full flex-col px-3 py-3">
      <div className="flex h-11 items-center justify-between pl-2">
        <Link href="/dashboard" onClick={onNavigate} aria-label="Octacore home">
          <OctacoreLogo size={22} />
        </Link>
        <Link
          href="/dashboard"
          onClick={onNavigate}
          aria-label="New chat"
          title="New chat"
          className="grid size-11 place-items-center rounded-full text-fg-2 hover:bg-fg/5 hover:text-fg"
        >
          <SquarePen size={18} strokeWidth={1.5} />
        </Link>
      </div>

      <ul className="mt-4 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon, match, soon }) => {
          const active = match(pathname);
          return (
            <li key={href}>
              <Link
                href={href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={`flex h-11 items-center gap-3 rounded-[12px] px-3 text-[15px] transition-colors ${
                  active ? "bg-fg/[.07] font-medium text-fg" : "text-fg-2 hover:bg-fg/5 hover:text-fg"
                }`}
              >
                <Icon size={18} strokeWidth={1.5} />
                {label}
                {soon && <span className="ml-auto rounded-full bg-fg/[.07] px-2 py-0.5 text-[11px] text-fg-3">Soon</span>}
              </Link>
            </li>
          );
        })}
      </ul>

      <p className="mt-7 px-3 text-[12px] font-medium text-fg-3">Recent chats</p>
      <ul className="mt-1.5 min-h-0 flex-1 space-y-0.5 overflow-y-auto">
        {conversations.length === 0 && <li className="px-3 py-2 text-[13px] text-fg-3">Your chats will show up here.</li>}
        {conversations.map((c) => {
          const active = pathname === `/dashboard/chat/${c.id}`;
          return (
            <li key={c.id} className="group relative">
              <Link
                href={`/dashboard/chat/${c.id}`}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={`flex h-10 items-center rounded-[10px] pl-3 pr-10 text-[14px] ${
                  active ? "bg-fg/[.07] text-fg" : "text-fg-2 hover:bg-fg/5 hover:text-fg"
                }`}
              >
                <span className="truncate">{c.title}</span>
              </Link>
              <button
                aria-label={`Delete “${c.title}”`}
                onClick={() => remove(c.id)}
                className="absolute right-1 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-fg-3 opacity-0 hover:bg-fg/5 hover:text-fg focus-visible:opacity-100 group-hover:opacity-100"
              >
                <Trash2 size={14} strokeWidth={1.5} />
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-3 flex items-center gap-2 border-t border-hairline pt-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-octa-600 text-[13px] font-medium text-white">
          {email[0]?.toUpperCase()}
        </span>
        <span className="min-w-0 flex-1 truncate text-[13px] text-fg-2">{email}</span>
        <button
          aria-label="Sign out"
          title="Sign out"
          onClick={async () => {
            await authClient.signOut();
            router.replace("/login");
            router.refresh();
          }}
          className="grid size-11 shrink-0 place-items-center rounded-full text-fg-3 hover:bg-fg/5 hover:text-fg"
        >
          <LogOut size={16} strokeWidth={1.5} />
        </button>
      </div>
    </nav>
  );
}

