"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { AgentsIcon } from "./agents-icon";
import { CornerDownLeft, Globe, KeyRound, MessageCircle, Monitor, Moon, Plus, Search, Settings, SquarePen, Sun } from "lucide-react";
import { useWorkspace } from "./workspace";

type Item = { id: string; group: string; label: string; hint?: string; icon: typeof Search | typeof AgentsIcon; run: () => void };
type SiteRow = { id: string; title: string | null; slug: string | null };

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  return <AnimatePresence>{open && <Palette onClose={onClose} />}</AnimatePresence>;
}

// Mounted only while open, so the query and selection start fresh each time.
function Palette({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const { conversations, setTheme } = useWorkspace();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [sites, setSites] = useState<SiteRow[]>([]);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/sites")
      .then((r) => (r.ok ? (r.json() as Promise<SiteRow[]>) : []))
      .then((rows) => setSites(rows))
      .catch(() => {});
  }, []);

  const go = (href: string) => () => {
    onClose();
    router.push(href);
  };

  const items = useMemo<Item[]>(() => {
    const all: Item[] = [
      { id: "new-chat", group: "Actions", label: "New chat", icon: SquarePen, run: go("/dashboard") },
      { id: "new-site", group: "Actions", label: "New website", icon: Plus, run: go("/dashboard/sites#new") },
      { id: "sites", group: "Actions", label: "Go to Websites", icon: Globe, run: go("/dashboard/sites") },
      { id: "agents", group: "Actions", label: "Go to Agents", icon: AgentsIcon, run: go("/dashboard/agents") },
      { id: "settings", group: "Actions", label: "Settings", icon: Settings, run: go("/dashboard/settings") },
      { id: "password", group: "Actions", label: "Change password", icon: KeyRound, run: go("/dashboard/settings#security") },
      { id: "light", group: "Appearance", label: "Light theme", icon: Sun, run: () => (setTheme("light"), onClose()) },
      { id: "dark", group: "Appearance", label: "Dark theme", icon: Moon, run: () => (setTheme("dark"), onClose()) },
      {
        id: "system",
        group: "Appearance",
        label: "Match system theme",
        icon: Monitor,
        run: () => (setTheme("system"), onClose()),
      },
      ...conversations.map((c) => ({
        id: `chat-${c.id}`,
        group: "Chats",
        label: c.title,
        icon: MessageCircle,
        run: go(`/dashboard/chat/${c.id}`),
      })),
      ...sites.map((s) => ({
        id: `site-${s.id}`,
        group: "Websites",
        label: s.title ?? "New website",
        hint: s.slug ?? undefined,
        icon: Globe,
        run: go(`/dashboard/sites/${s.id}`),
      })),
    ];
    const q = query.trim().toLowerCase();
    if (!q) {
      // Without a query, show the actions plus the five most recent chats and sites.
      const recent = new Set([
        ...conversations.slice(0, 5).map((c) => `chat-${c.id}`),
        ...sites.slice(0, 5).map((s) => `site-${s.id}`),
      ]);
      return all.filter((i) => (i.group !== "Chats" && i.group !== "Websites") || recent.has(i.id));
    }
    return all.filter((i) => `${i.label} ${i.hint ?? ""}`.toLowerCase().includes(q));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, conversations, sites]);

  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  let index = -1;
  const groups = [...new Set(items.map((i) => i.group))];

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center px-4 pt-[12vh]">
      <motion.div
        className="absolute inset-0 bg-black/25 backdrop-blur-[3px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        role="dialog"
        aria-label="Search"
        initial={reduce ? false : { opacity: 0, y: -8, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98 }}
        transition={{ type: "spring", stiffness: 420, damping: 34 }}
        className="relative w-full max-w-[600px] overflow-hidden rounded-[22px] bg-elevated shadow-float ring-1 ring-hairline"
      >
        <div className="flex h-14 items-center gap-3 border-b border-hairline px-5">
          <Search size={18} strokeWidth={1.75} className="text-fg-3" />
          <input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((a) => Math.min(a + 1, items.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((a) => Math.max(a - 1, 0));
              } else if (e.key === "Enter") {
                e.preventDefault();
                items[active]?.run();
              } else if (e.key === "Escape") onClose();
            }}
            placeholder="Search chats, websites and actions…"
            aria-label="Search"
            className="h-full flex-1 bg-transparent text-[16px] placeholder:text-fg-3 focus:outline-none"
          />
          <kbd className="rounded-[6px] bg-fg/[.06] px-1.5 py-0.5 text-[11px] font-medium text-fg-3">esc</kbd>
        </div>
        <div ref={listRef} role="listbox" className="max-h-[min(420px,60vh)] overflow-y-auto p-2">
          {items.length === 0 && <p className="px-3 py-8 text-center text-[14px] text-fg-3">No results for “{query}”</p>}
          {groups.map((group) => (
            <div key={group} className="mb-1">
              <p className="px-3 pb-1 pt-2 text-[12px] font-medium text-fg-3">{group}</p>
              {items
                .filter((i) => i.group === group)
                .map((item) => {
                  index++;
                  const i = index;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      data-index={i}
                      role="option"
                      aria-selected={active === i}
                      onMouseMove={() => setActive(i)}
                      onClick={item.run}
                      className={`relative flex h-11 w-full items-center gap-3 rounded-[12px] px-3 text-left text-[14px] ${active === i ? "text-fg" : "text-fg-2"}`}
                    >
                      {active === i && (
                        <motion.span
                          layoutId="palette-active"
                          className="absolute inset-0 rounded-[12px] bg-fg/[.06]"
                          transition={{ type: "spring", stiffness: 500, damping: 40 }}
                        />
                      )}
                      <Icon size={16} strokeWidth={1.75} className={`relative shrink-0 ${active === i ? "text-octa-600" : ""}`} />
                      <span className="relative min-w-0 flex-1 truncate">{item.label}</span>
                      {item.hint && <span className="relative truncate text-[12px] text-fg-3">{item.hint}</span>}
                      {active === i && <CornerDownLeft size={14} className="relative text-fg-3" />}
                    </button>
                  );
                })}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
