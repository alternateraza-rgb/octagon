"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowUp, Sparkles, Square } from "lucide-react";
import { AttachButton, PendingTray } from "@/components/uploads/attachments";
import type { useUploads } from "@/components/uploads/use-uploads";

type Uploads = ReturnType<typeof useUploads>;

// The message box used by chat and the website builder: attachments, paste and drop, send/stop,
// and optional as-you-type suggestions.
export function Composer({
  id,
  value,
  onChange,
  onSubmit,
  onStop,
  uploads,
  busy,
  disabled,
  placeholder,
  label,
  suggest,
  size = "lg",
  autoFocus,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  onStop?: () => void;
  uploads: Uploads;
  busy?: boolean;
  disabled?: boolean;
  placeholder: string;
  label: string;
  suggest?: (query: string) => string[];
  size?: "lg" | "md";
  autoFocus?: boolean;
}) {
  const reduce = useReducedMotion();
  const [highlight, setHighlight] = useState(-1);
  const [dismissed, setDismissed] = useState("");
  const [focused, setFocused] = useState(false);
  const textarea = useRef<HTMLTextAreaElement>(null);

  const suggestions =
    suggest && focused && !value.includes("\n") && dismissed !== value ? suggest(value).filter((s) => s !== value) : [];
  const canSend = !disabled && !busy && !uploads.uploading && (!!value.trim() || uploads.attachments.length > 0);

  function accept(text: string) {
    onChange(text);
    setHighlight(-1);
    textarea.current?.focus();
  }

  function send() {
    if (!canSend) return;
    setHighlight(-1);
    onSubmit(value);
  }

  return (
    <div className="relative">
      <AnimatePresence>
        {suggestions.length > 0 && (
          <motion.ul
            role="listbox"
            aria-label="Suggestions"
            initial={reduce ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ type: "spring", stiffness: 480, damping: 36 }}
            className="absolute inset-x-2 bottom-full z-20 mb-2 overflow-hidden rounded-[18px] bg-elevated p-1.5 shadow-float ring-1 ring-hairline"
          >
            {suggestions.map((s, i) => (
              <li key={s}>
                <button
                  type="button"
                  role="option"
                  aria-selected={highlight === i}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setHighlight(i)}
                  onClick={() => accept(s)}
                  className={`flex min-h-10 w-full items-center gap-2.5 rounded-[12px] px-3 py-2 text-left text-[14px] ${
                    highlight === i ? "bg-fg/[.06] text-fg" : "text-fg-2"
                  }`}
                >
                  <Sparkles size={14} strokeWidth={1.75} className="shrink-0 text-octa-600" />
                  <Highlighted text={s} query={value} />
                </button>
              </li>
            ))}
            <li className="px-3 pb-1 pt-1.5 text-[11px] text-fg-3">↑↓ to choose · Tab to use · Esc to hide</li>
          </motion.ul>
        )}
      </AnimatePresence>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files.length && !disabled) uploads.add(e.dataTransfer.files);
        }}
        className={`bg-elevated ring-1 ring-hairline transition-[box-shadow] duration-500 ${
          size === "lg" ? "rounded-[26px] p-2" : "rounded-[20px] p-1.5"
        } ${
          focused
            ? "shadow-[0_1px_2px_rgba(0,0,0,.06),0_24px_70px_-12px_rgba(194,65,12,.30)]"
            : "shadow-[0_1px_2px_rgba(0,0,0,.05),0_12px_40px_-12px_rgba(0,0,0,.14)]"
        }`}
      >
        <PendingTray files={uploads.files} onRemove={uploads.remove} />
        <div className="flex items-end gap-1">
          <AttachButton onFiles={uploads.add} disabled={disabled || busy} />
          <label htmlFor={id} className="sr-only">
            {label}
          </label>
          <textarea
            ref={textarea}
            id={id}
            rows={1}
            value={value}
            autoFocus={autoFocus}
            disabled={disabled}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onChange={(e) => {
              onChange(e.target.value);
              setHighlight(-1);
            }}
            onPaste={(e) => {
              if (e.clipboardData.files.length) {
                e.preventDefault();
                uploads.add(e.clipboardData.files);
              }
            }}
            onKeyDown={(e) => {
              if (suggestions.length) {
                if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                  e.preventDefault();
                  const n = suggestions.length;
                  setHighlight((h) => (e.key === "ArrowDown" ? (h + 1) % n : (h - 1 + n) % n));
                  return;
                }
                if (e.key === "Tab") {
                  e.preventDefault();
                  accept(suggestions[Math.max(highlight, 0)]);
                  return;
                }
                if (e.key === "Escape") {
                  setDismissed(value);
                  return;
                }
                if (e.key === "Enter" && !e.shiftKey && highlight >= 0) {
                  e.preventDefault();
                  accept(suggestions[highlight]);
                  return;
                }
              }
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                send();
              }
            }}
            placeholder={placeholder}
            className={`field-sizing-content min-h-11 flex-1 resize-none bg-transparent px-1 py-2.5 leading-[1.5] placeholder:text-fg-3 focus:outline-none disabled:opacity-60 ${
              size === "lg" ? "max-h-[220px] text-[16px]" : "max-h-[160px] text-[15px]"
            }`}
          />
          <AnimatePresence mode="popLayout" initial={false}>
            {busy && onStop ? (
              <motion.button
                key="stop"
                type="button"
                aria-label="Stop"
                onClick={onStop}
                initial={reduce ? false : { scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.6, opacity: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="grid size-11 shrink-0 place-items-center rounded-full bg-fg text-canvas"
              >
                <Square size={13} fill="currentColor" />
              </motion.button>
            ) : (
              <motion.button
                key="send"
                type="submit"
                aria-label="Send"
                disabled={!canSend}
                initial={reduce ? false : { scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.6, opacity: 0 }}
                whileTap={{ scale: 0.92 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="grid size-11 shrink-0 place-items-center rounded-full bg-octa-600 text-white shadow-[0_6px_16px_-6px_rgba(194,65,12,.7)] transition-colors hover:bg-octa-500 disabled:bg-fg/10 disabled:text-fg-3 disabled:shadow-none"
              >
                <ArrowUp size={19} strokeWidth={2.25} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </form>
    </div>
  );
}

function Highlighted({ text, query }: { text: string; query: string }) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return <span className="truncate">{text}</span>;
  const pattern = new RegExp(`(${words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "ig");
  return (
    <span className="truncate">
      {text.split(pattern).map((part, i) =>
        words.includes(part.toLowerCase()) ? (
          <mark key={i} className="bg-transparent font-semibold text-fg">
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </span>
  );
}
