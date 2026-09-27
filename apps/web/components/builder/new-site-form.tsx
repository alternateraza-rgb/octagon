"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowUp } from "lucide-react";
import { AttachButton, PendingTray } from "@/components/uploads/attachments";
import { useUploads } from "@/components/uploads/use-uploads";

export function NewSiteForm({ initialPrompt = "" }: { initialPrompt?: string }) {
  const router = useRouter();
  const [prompt, setPrompt] = useState(initialPrompt);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const uploads = useUploads();

  async function create() {
    const value = prompt.trim();
    if (!value || creating || uploads.uploading) return;
    setCreating(true);
    setError("");
    const res = await fetch("/api/sites", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ prompt: value, attachments: uploads.attachments.map((a) => a.id) }),
    }).catch(() => null);
    const body = (await res?.json().catch(() => null)) as { id?: string; error?: string } | null;
    if (res?.ok && body?.id) {
      router.push(`/dashboard/sites/${body.id}?new=1`);
      return;
    }
    setCreating(false);
    setError(body?.error ?? "Something went wrong. Try again.");
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        create();
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        if (e.dataTransfer.files.length) uploads.add(e.dataTransfer.files);
      }}
      className="rounded-[22px] bg-elevated p-3 shadow-soft ring-1 ring-hairline transition-shadow focus-within:shadow-[0_1px_2px_rgba(0,0,0,.06),0_20px_60px_-10px_rgba(194,65,12,.28)]"
    >
      <label htmlFor="site-prompt" className="sr-only">
        Describe the website you want to build
      </label>
      <textarea
        id="site-prompt"
        rows={3}
        value={prompt}
        disabled={creating}
        onChange={(e) => {
          setPrompt(e.target.value);
          setError("");
        }}
        onPaste={(e) => {
          if (e.clipboardData.files.length) {
            e.preventDefault();
            uploads.add(e.clipboardData.files);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            create();
          }
        }}
        placeholder="A sourdough bakery in Lisbon with online pre-orders…"
        className="block w-full resize-none bg-transparent px-2 pt-1 text-[16px] leading-[1.5] placeholder:text-fg-3 focus:outline-none disabled:opacity-60"
      />
      <PendingTray files={uploads.files} onRemove={uploads.remove} />
      <div className="mt-2 flex items-center gap-3">
        <AttachButton onFiles={uploads.add} disabled={creating} />
        {error && (
          <p role="alert" className="text-[13px] text-red-600">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={creating || !prompt.trim() || uploads.uploading}
          className="ml-auto flex h-11 items-center gap-2 rounded-full bg-octa-600 pl-5 pr-4 text-[15px] font-medium text-white transition-all hover:bg-octa-500 active:scale-[.98] disabled:bg-fg/10 disabled:text-fg-3"
        >
          {creating ? "Starting…" : "Build website"} <ArrowUp size={16} strokeWidth={2} />
        </button>
      </div>
    </form>
  );
}
