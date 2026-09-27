"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowUp } from "lucide-react";
import { AttachButton, PendingTray } from "@/components/uploads/attachments";
import { useUploads } from "@/components/uploads/use-uploads";

const EXAMPLES = [
  "A barbershop in LA called Barber Boys — bold and fun",
  "Bridal couture studio in Toronto, elegant and warm",
  "24/7 plumber in Cheyenne with online booking",
  "Neighbourhood coffee roaster in Austin",
];

export function NewSiteForm({ initialPrompt = "", autoFocus }: { initialPrompt?: string; autoFocus?: boolean }) {
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
      className="relative rounded-[24px] bg-elevated p-3 shadow-[0_1px_2px_rgba(0,0,0,.06),0_12px_40px_-8px_rgba(0,0,0,.12)] ring-1 ring-hairline transition-shadow duration-500 focus-within:shadow-[0_1px_2px_rgba(0,0,0,.06),0_24px_70px_-12px_rgba(194,65,12,.35)]"
    >
      <label htmlFor="site-prompt" className="sr-only">
        Describe the website you want to build
      </label>
      <textarea
        id="site-prompt"
        autoFocus={autoFocus}
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
        placeholder="Describe the business — name, city, vibe and what it sells…"
        className="block w-full resize-none bg-transparent px-2 pt-1 text-[17px] leading-[1.5] placeholder:text-fg-3 focus:outline-none disabled:opacity-60"
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
      {!prompt && (
        <div className="absolute inset-x-0 top-full mt-4 hidden flex-wrap gap-2 sm:flex">
          {EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => setPrompt(example)}
              className="h-9 rounded-full bg-fg/[.05] px-3.5 text-[13px] text-fg-2 transition-colors hover:bg-fg/[.09] hover:text-fg"
            >
              {example}
            </button>
          ))}
        </div>
      )}
    </form>
  );
}
