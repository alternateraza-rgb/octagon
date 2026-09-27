"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  destructive,
  busy,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const reduce = useReducedMotion();
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[95] grid place-items-center px-4" onKeyDown={(e) => e.key === "Escape" && onCancel()}>
          <motion.div
            className="absolute inset-0 bg-black/30 backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
          />
          <motion.div
            role="alertdialog"
            aria-modal
            aria-labelledby="confirm-title"
            initial={reduce ? false : { opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className="relative w-full max-w-[400px] rounded-[24px] bg-elevated p-6 shadow-float ring-1 ring-hairline"
          >
            <h2 id="confirm-title" className="text-[19px] font-semibold tracking-[-0.015em]">
              {title}
            </h2>
            <p className="mt-2 text-[15px] leading-[1.47] text-fg-2">{body}</p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                autoFocus
                onClick={onCancel}
                className="h-11 rounded-full px-5 text-[15px] font-medium text-fg-2 hover:bg-fg/5"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={busy}
                className={`h-11 rounded-full px-5 text-[15px] font-medium text-white disabled:opacity-60 ${
                  destructive ? "bg-red-600 hover:bg-red-500" : "bg-octa-600 hover:bg-octa-500"
                }`}
              >
                {busy ? "Working…" : confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
