"use client";

import { useRef } from "react";
import { AlertCircle, FileText, Paperclip, X } from "lucide-react";
import type { Attachment } from "@/lib/attachments";
import { ACCEPT, type PendingFile } from "./use-uploads";

export function AttachButton({ onFiles, disabled }: { onFiles: (files: FileList) => void; disabled?: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <>
      <button
        type="button"
        aria-label="Attach images or files"
        title="Attach images or files"
        disabled={disabled}
        onClick={() => input.current?.click()}
        className="grid size-11 shrink-0 place-items-center rounded-full text-fg-2 transition-colors hover:bg-fg/5 hover:text-fg disabled:opacity-40"
      >
        <Paperclip size={19} strokeWidth={1.5} />
      </button>
      <input
        ref={input}
        type="file"
        multiple
        accept={ACCEPT}
        hidden
        onChange={(e) => {
          if (e.target.files?.length) onFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </>
  );
}

// Files picked for the next message, with upload progress and a remove button.
export function PendingTray({ files, onRemove }: { files: PendingFile[]; onRemove: (key: string) => void }) {
  if (!files.length) return null;
  return (
    <ul className="flex flex-wrap gap-2 px-2 pt-2">
      {files.map((f) => (
        <li key={f.key} className="group relative" title={f.error ?? f.name}>
          <div
            className={`relative grid size-16 place-items-center overflow-hidden rounded-[12px] bg-canvas-2 ring-1 ${f.status === "error" ? "ring-red-500/60" : "ring-hairline"}`}
          >
            {f.preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={f.preview} alt={f.name} className="size-full object-cover" />
            ) : (
              <FileText size={22} strokeWidth={1.5} className="text-fg-2" />
            )}
            {f.status === "uploading" && (
              <span className="absolute inset-0 grid place-items-center bg-black/35" role="status" aria-label={`Uploading ${f.name}`}>
                <span className="size-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              </span>
            )}
            {f.status === "error" && (
              <span className="absolute inset-0 grid place-items-center bg-black/45 text-white">
                <AlertCircle size={20} />
              </span>
            )}
          </div>
          <button
            type="button"
            aria-label={`Remove ${f.name}`}
            onClick={() => onRemove(f.key)}
            className="absolute -right-2 -top-2 grid size-6 place-items-center rounded-full bg-fg text-canvas shadow-soft"
          >
            <X size={12} strokeWidth={2.5} />
          </button>
        </li>
      ))}
    </ul>
  );
}

// Files already sent with a message.
export function AttachmentList({ items, align = "end" }: { items: Attachment[]; align?: "start" | "end" }) {
  if (!items.length) return null;
  return (
    <ul className={`flex flex-wrap gap-2 ${align === "end" ? "justify-end" : ""}`}>
      {items.map((a) => (
        <li key={a.id}>
          <a href={a.url} target="_blank" rel="noopener" title={a.name} className="block">
            {a.type.startsWith("image/") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={a.url} alt={a.name} className="h-28 max-w-[200px] rounded-[12px] bg-canvas-2 object-cover ring-1 ring-hairline" />
            ) : (
              <span className="flex h-11 max-w-[240px] items-center gap-2 rounded-[12px] bg-elevated px-3 text-[13px] ring-1 ring-hairline">
                <FileText size={16} strokeWidth={1.5} className="shrink-0 text-octa-600" />
                <span className="truncate">{a.name}</span>
              </span>
            )}
          </a>
        </li>
      ))}
    </ul>
  );
}
