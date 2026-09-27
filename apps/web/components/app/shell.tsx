"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  Bot,
  CreditCard,
  Globe,
  LogOut,
  Menu,
  MessageCircle,
  Monitor,
  Moon,
  PanelLeft,
  Pencil,
  Settings,
  Search,
  SquarePen,
  Sun,
  Trash2,
} from "lucide-react";
import { OctacoreLogo, OctacoreMark } from "@octacore/ui/logo";
import { authClient } from "@/lib/auth/client";
import type { Conversation } from "@/lib/chat/store";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { CommandPalette } from "./command-palette";
import { WorkspaceProvider, useWorkspace, type BillingSummary, type Me, type Theme } from "./workspace";
import { Paywall } from "@/components/billing/paywall";
import { planById } from "@/lib/billing/plans";

const NAV = [
  {
    href: "/dashboard",
    label: "Home",
    icon: MessageCircle,
    match: (p: string) => p === "/dashboard" || p.startsWith("/dashboard/chat"),
  },
  { href: "/dashboard/sites", label: "Websites", icon: Globe, match: (p: string) => p.startsWith("/dashboard/sites") },
  { href: "/dashboard/agents", label: "Agents", icon: Bot, match: (p: string) => p.startsWith("/dashboard/agents") },
  { href: "/dashboard/settings", label: "Settings", icon: Settings, match: (p: string) => p.startsWith("/dashboard/settings") },
];

// Pages that share one transition, so switching chats or a new chat getting its URL doesn't re-animate.
function section(pathname: string) {
  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/chat")) return "home";
  if (/^\/dashboard\/sites\/[^/]+/.test(pathname)) return "builder";
  return pathname;
}

export function AppShell({
  me,
  conversations,
  theme,
  collapsed,
  billing,
  children,
}: {
  me: Me;
  conversations: Conversation[];
  theme: Theme;
  collapsed: boolean;
  billing: BillingSummary;
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <WorkspaceProvider me={me} initialConversations={conversations} initialTheme={theme} initialBilling={billing}>
        <Frame initialCollapsed={collapsed}>{children}</Frame>
      </WorkspaceProvider>
    </ToastProvider>
  );
}

function Frame({ initialCollapsed, children }: { initialCollapsed: boolean; children: React.ReactNode }) {
  const { theme, billing } = useWorkspace();
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [drawer, setDrawer] = useState(false);
  const [palette, setPalette] = useState(false);

  const toggleCollapsed = () =>
    setCollapsed((c) => {
      document.cookie = `sidebar=${c ? "open" : "collapsed"}; path=/; max-age=31536000; samesite=lax`;
      return !c;
    });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette((p) => !p);
      } else if ((e.metaKey || e.ctrlKey) && e.key === "\\") {
        e.preventDefault();
        toggleCollapsed();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div data-theme={theme === "system" ? undefined : theme} className="flex h-dvh overflow-hidden bg-canvas text-fg">
      <aside
        className={`relative hidden shrink-0 border-r border-hairline bg-canvas-2/50 transition-[width] duration-300 ease-[var(--ease-spring)] lg:flex ${
          collapsed ? "w-[76px]" : "w-[272px]"
        }`}
      >
        <Sidebar collapsed={collapsed} onToggle={toggleCollapsed} onSearch={() => setPalette(true)} onNavigate={() => {}} />
      </aside>

      <AnimatePresence>
        {drawer && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.button
              aria-label="Close menu"
              className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawer(false)}
            />
            <motion.aside
              className="absolute inset-y-0 left-0 flex w-[min(300px,85vw)] border-r border-hairline bg-canvas shadow-float"
              initial={reduce ? false : { x: "-100%" }}
              animate={{ x: 0 }}
              exit={reduce ? undefined : { x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 32 }}
            >
              <Sidebar
                collapsed={false}
                onSearch={() => {
                  setDrawer(false);
                  setPalette(true);
                }}
                onNavigate={() => setDrawer(false)}
              />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-1 border-b border-hairline px-2 lg:hidden">
          <button
            aria-label="Open menu"
            onClick={() => setDrawer(true)}
            className="grid size-11 place-items-center rounded-full hover:bg-fg/5"
          >
            <Menu size={20} strokeWidth={1.5} />
          </button>
          <Link href="/dashboard" aria-label="Octacore home">
            <OctacoreLogo size={22} />
          </Link>
          <button
            aria-label="Search"
            onClick={() => setPalette(true)}
            className="ml-auto grid size-11 place-items-center rounded-full hover:bg-fg/5"
          >
            <Search size={19} strokeWidth={1.5} />
          </button>
        </header>
        <main className="relative min-h-0 flex-1">
          <motion.div
            key={section(pathname)}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
            className="h-full"
          >
            {/* Without a plan, everything but Settings shows the plans (pay upfront). */}
            {billing.active || pathname.startsWith("/dashboard/settings") ? children : <Paywall />}
          </motion.div>
        </main>
      </div>

      <CommandPalette open={palette} onClose={() => setPalette(false)} />
    </div>
  );
}

function Sidebar({
  collapsed,
  onToggle,
  onSearch,
  onNavigate,
}: {
  collapsed: boolean;
  onToggle?: () => void;
  onSearch: () => void;
  onNavigate: () => void;
}) {
  const pathname = usePathname();
  const { conversations } = useWorkspace();

  return (
    <nav aria-label="Workspace" className="flex min-h-0 w-full flex-col px-3 py-3">
      <div className={`flex h-11 items-center ${collapsed ? "justify-center" : "justify-between pl-2"}`}>
        {!collapsed && (
          <Link href="/dashboard" onClick={onNavigate} aria-label="Octacore home">
            <OctacoreLogo size={22} />
          </Link>
        )}
        {onToggle && (
          <button
            onClick={onToggle}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={`${collapsed ? "Expand" : "Collapse"} sidebar (⌘\\)`}
            className="group grid size-11 place-items-center rounded-full text-fg-2 hover:bg-fg/5 hover:text-fg"
          >
            {collapsed ? (
              <>
                <OctacoreMark size={22} className="group-hover:hidden" />
                <PanelLeft size={18} strokeWidth={1.5} className="hidden group-hover:block" />
              </>
            ) : (
              <PanelLeft size={18} strokeWidth={1.5} />
            )}
          </button>
        )}
      </div>

      <div className={`mt-3 flex gap-2 ${collapsed ? "flex-col items-center" : ""}`}>
        <Link
          href="/dashboard"
          onClick={onNavigate}
          title="New chat"
          className={`flex h-11 items-center gap-2.5 rounded-full bg-elevated text-[14px] font-medium shadow-soft ring-1 ring-hairline transition-transform active:scale-[.98] ${
            collapsed ? "w-11 justify-center" : "flex-1 px-4"
          }`}
        >
          <SquarePen size={16} strokeWidth={1.75} className="text-octa-600" />
          {!collapsed && "New chat"}
        </Link>
        <button
          onClick={onSearch}
          aria-label="Search"
          title="Search (⌘K)"
          className="grid size-11 shrink-0 place-items-center rounded-full text-fg-2 ring-1 ring-hairline hover:bg-fg/5 hover:text-fg"
        >
          <Search size={17} strokeWidth={1.75} />
        </button>
      </div>

      <ul className="mt-5 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <li key={href}>
              <Link
                href={href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                title={collapsed ? label : undefined}
                className={`relative flex h-11 items-center gap-3 rounded-[12px] text-[15px] transition-colors ${
                  collapsed ? "justify-center" : "px-3"
                } ${active ? "font-medium text-fg" : "text-fg-2 hover:bg-fg/[.04] hover:text-fg"}`}
              >
                {active && (
                  <motion.span
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-[12px] bg-fg/[.07]"
                    transition={{ type: "spring", stiffness: 420, damping: 36 }}
                  />
                )}
                <Icon size={18} strokeWidth={1.5} className={`relative ${active ? "text-octa-600" : ""}`} />
                {!collapsed && <span className="relative">{label}</span>}
              </Link>
            </li>
          );
        })}
      </ul>

      {!collapsed ? (
        <>
          <p className="mt-7 px-3 text-[12px] font-medium text-fg-3">Recent chats</p>
          <ul className="mt-1.5 min-h-0 flex-1 space-y-0.5 overflow-y-auto [mask-image:linear-gradient(to_bottom,black_85%,transparent)]">
            {conversations.length === 0 && <li className="px-3 py-2 text-[13px] text-fg-3">Your chats will show up here.</li>}
            <AnimatePresence initial={false}>
              {conversations.map((c) => (
                <ChatRow key={c.id} conversation={c} active={pathname === `/dashboard/chat/${c.id}`} onNavigate={onNavigate} />
              ))}
            </AnimatePresence>
          </ul>
        </>
      ) : (
        <div className="flex-1" />
      )}

      <AccountMenu collapsed={collapsed} />
    </nav>
  );
}

function ChatRow({
  conversation: c,
  active,
  onNavigate,
}: {
  conversation: Conversation;
  active: boolean;
  onNavigate: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const { upsertConversation, removeConversation } = useWorkspace();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(c.title);

  async function rename() {
    setEditing(false);
    const value = title.trim();
    if (!value || value === c.title) return setTitle(c.title);
    upsertConversation({ ...c, title: value });
    const res = await fetch(`/api/chat/${c.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: value }),
    }).catch(() => null);
    if (!res?.ok) toast.error("Couldn't rename that chat");
  }

  async function remove() {
    removeConversation(c.id);
    if (active) router.push("/dashboard");
    const res = await fetch(`/api/chat/${c.id}`, { method: "DELETE" }).catch(() => null);
    if (res?.ok) toast.success("Chat deleted");
    else {
      upsertConversation(c);
      toast.error("Couldn't delete that chat");
    }
  }

  return (
    <motion.li
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 34 }}
      className="group relative"
    >
      {editing ? (
        <input
          autoFocus
          value={title}
          aria-label="Chat title"
          onChange={(e) => setTitle(e.target.value)}
          onBlur={rename}
          onKeyDown={(e) => {
            if (e.key === "Enter") rename();
            if (e.key === "Escape") {
              setTitle(c.title);
              setEditing(false);
            }
          }}
          className="h-10 w-full rounded-[10px] bg-elevated px-3 text-[14px] ring-2 ring-octa-600 focus:outline-none"
        />
      ) : (
        <>
          <Link
            href={`/dashboard/chat/${c.id}`}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`flex h-10 items-center rounded-[10px] pl-3 pr-[4.5rem] text-[14px] transition-colors ${
              active ? "bg-fg/[.07] text-fg" : "text-fg-2 hover:bg-fg/[.04] hover:text-fg"
            }`}
          >
            <span className="truncate">{c.title}</span>
          </Link>
          <div className="absolute right-1 top-1/2 flex -translate-y-1/2 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
            <button
              aria-label={`Rename “${c.title}”`}
              onClick={() => setEditing(true)}
              className="grid size-8 place-items-center rounded-full text-fg-3 hover:bg-fg/5 hover:text-fg"
            >
              <Pencil size={13} strokeWidth={1.75} />
            </button>
            <button
              aria-label={`Delete “${c.title}”`}
              onClick={remove}
              className="grid size-8 place-items-center rounded-full text-fg-3 hover:bg-fg/5 hover:text-red-600"
            >
              <Trash2 size={13} strokeWidth={1.75} />
            </button>
          </div>
        </>
      )}
    </motion.li>
  );
}

const THEMES: { id: Theme; label: string; icon: typeof Sun }[] = [
  { id: "system", label: "System", icon: Monitor },
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
];

function AccountMenu({ collapsed }: { collapsed: boolean }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const { me, theme, setTheme, billing } = useWorkspace();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const planLabel = billing.comped
    ? "Agency · complimentary"
    : billing.active
      ? `${planById(billing.plan)?.name} plan`
      : billing.pausesAt
        ? "Plan ended"
        : "No plan yet";
  // Shown once most of the month's builds are used.
  const share = billing.builds && billing.builds.limit ? billing.builds.used / billing.builds.limit : 0;

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  const initial = (me.name || me.email)[0]?.toUpperCase();

  return (
    <div ref={ref} className="relative mt-3 border-t border-hairline pt-3">
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={reduce ? false : { opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className="material absolute bottom-full left-0 z-20 mb-2 w-[248px] origin-bottom-left rounded-[18px] p-2 shadow-float ring-1 ring-hairline"
          >
            <div className="px-2.5 py-2">
              <p className="truncate text-[14px] font-medium">{me.name}</p>
              <p className="truncate text-[12px] text-fg-3">{me.email}</p>
            </div>
            <p className="mt-1 px-2.5 text-[12px] font-medium text-fg-3">Appearance</p>
            <div role="radiogroup" aria-label="Theme" className="mt-1.5 grid grid-cols-3 gap-1 rounded-[12px] bg-fg/[.05] p-1">
              {THEMES.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  role="radio"
                  aria-checked={theme === id}
                  onClick={() => setTheme(id)}
                  className={`relative flex h-9 items-center justify-center gap-1.5 rounded-[9px] text-[12px] font-medium ${
                    theme === id ? "text-fg" : "text-fg-2 hover:text-fg"
                  }`}
                >
                  {theme === id && (
                    <motion.span
                      layoutId="theme-pill"
                      className="absolute inset-0 rounded-[9px] bg-elevated shadow-soft"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    />
                  )}
                  <Icon size={14} strokeWidth={1.75} className="relative" />
                  <span className="relative">{label}</span>
                </button>
              ))}
            </div>
            <div className="my-2 h-px bg-hairline" />
            <Link
              role="menuitem"
              href="/dashboard/settings#billing"
              onClick={() => setOpen(false)}
              className="flex h-10 w-full items-center gap-2.5 rounded-[10px] px-2.5 text-[14px] text-fg-2 hover:bg-fg/5 hover:text-fg"
            >
              <CreditCard size={16} strokeWidth={1.5} /> Plan and billing
            </Link>
            <Link
              role="menuitem"
              href="/dashboard/settings"
              onClick={() => setOpen(false)}
              className="flex h-10 w-full items-center gap-2.5 rounded-[10px] px-2.5 text-[14px] text-fg-2 hover:bg-fg/5 hover:text-fg"
            >
              <Settings size={16} strokeWidth={1.5} /> Settings
            </Link>
            <button
              role="menuitem"
              onClick={async () => {
                await authClient.signOut();
                router.replace("/login");
                router.refresh();
              }}
              className="flex h-10 w-full items-center gap-2.5 rounded-[10px] px-2.5 text-[14px] text-fg-2 hover:bg-fg/5 hover:text-fg"
            >
              <LogOut size={16} strokeWidth={1.5} /> Sign out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Account"
        className={`flex h-12 w-full items-center gap-2.5 rounded-[14px] text-left transition-colors hover:bg-fg/5 ${collapsed ? "justify-center" : "px-1.5"}`}
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-octa-500 to-octa-700 text-[14px] font-semibold text-white shadow-soft">
          {initial}
        </span>
        {!collapsed && (
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[14px] font-medium">{me.name}</span>
            <span className={`block truncate text-[12px] ${billing.active ? "text-fg-3" : "text-octa-600"}`}>{planLabel}</span>
          </span>
        )}
        {!collapsed && share >= 0.8 && (
          <UsageRing share={share} label={`${billing.builds!.used} of ${billing.builds!.limit} builds used`} />
        )}
      </button>
    </div>
  );
}

function UsageRing({ share, label }: { share: number; label: string }) {
  const r = 9;
  const c = 2 * Math.PI * r;
  return (
    <span title={label} aria-label={label} role="img" className="mr-1 shrink-0">
      <svg width="24" height="24" viewBox="0 0 24 24" className="-rotate-90">
        <circle cx="12" cy="12" r={r} fill="none" strokeWidth="3" className="stroke-fg/10" />
        <circle
          cx="12"
          cy="12"
          r={r}
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.min(share, 1))}
          className={share >= 1 ? "stroke-red-500" : "stroke-octa-600"}
        />
      </svg>
    </span>
  );
}
