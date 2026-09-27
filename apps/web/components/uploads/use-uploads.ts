"use client";

import { useState } from "react";
import type { Attachment } from "@/lib/attachments";

export const ACCEPT = "image/png,image/jpeg,image/webp,image/gif,image/svg+xml,application/pdf";
const MAX_BYTES = 10 * 1024 * 1024;
const MAX_FILES = 8;

export type PendingFile = {
  key: string;
  name: string;
  type: string;
  preview: string | null;
  status: "uploading" | "done" | "error";
  error?: string;
  attachment?: Attachment;
};

// Uploads files as soon as they're picked, so sending never waits on them.
export function useUploads() {
  const [files, setFiles] = useState<PendingFile[]>([]);
  const update = (key: string, patch: Partial<PendingFile>) => setFiles((fs) => fs.map((f) => (f.key === key ? { ...f, ...patch } : f)));

  function add(list: FileList | File[]) {
    const picked = Array.from(list).slice(0, Math.max(0, MAX_FILES - files.length));
    for (const file of picked) {
      const key = crypto.randomUUID();
      const preview = file.type.startsWith("image/") ? URL.createObjectURL(file) : null;
      const entry: PendingFile = { key, name: file.name, type: file.type, preview, status: "uploading" };
      if (!ACCEPT.split(",").includes(file.type)) Object.assign(entry, { status: "error", error: "Unsupported file type" });
      else if (file.size > MAX_BYTES) Object.assign(entry, { status: "error", error: "Larger than 10 MB" });
      setFiles((fs) => [...fs, entry]);
      if (entry.status === "error") continue;
      fetch("/api/uploads", { method: "POST", headers: { "content-type": file.type, "x-file-name": encodeURIComponent(file.name) }, body: file })
        .then(async (res) => {
          const body = (await res.json().catch(() => null)) as (Attachment & { error?: string }) | null;
          if (!res.ok || !body?.id) throw new Error(body?.error ?? "Upload failed");
          update(key, { status: "done", attachment: body });
        })
        .catch((e: Error) => update(key, { status: "error", error: e.message }));
    }
  }

  return {
    files,
    add,
    remove: (key: string) => setFiles((fs) => fs.filter((f) => f.key !== key)),
    clear: () => setFiles([]),
    uploading: files.some((f) => f.status === "uploading"),
    attachments: files.flatMap((f) => (f.attachment ? [f.attachment] : [])),
  };
}
