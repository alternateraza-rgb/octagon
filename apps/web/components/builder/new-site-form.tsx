"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowUpRight } from "lucide-react";

export function NewSiteForm({ initialPrompt = "" }: { initialPrompt?: string }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [prompt, setPrompt] = useState(initialPrompt);
  const [error, setError] = useState("");
  const [building, setBuilding] = useState(false);

  async function build() {
    const value = prompt.trim();
    if (!value || building) return;
    setBuilding(true);
    setError("");
    const res = await fetch("/api/sites", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ prompt: value }),
    }).catch(() => null);
    const body = (await res?.json().catch(() => null)) as { id?: string; error?: string } | null;
    if (res?.ok && body?.id) {
      router.push(`/sites/${body.id}`);
      return;
    }
    setBuilding(false);
    setError(body?.error ?? "Something went wrong. Try again.");
    router.refresh();
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        build();
      }}
      aria-busy={building}
      className="rounded-[18px] bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,.06),0_12px_40px_-8px_rgba(0,0,0,.12)] ring-1 ring-black/5 transition-shadow focus-within:shadow-[0_1px_2px_rgba(0,0,0,.06),0_20px_60px_-10px_rgba(194,65,12,.28)]"
    >
      <label htmlFor="site-prompt" className="sr-only">
        Describe the website you want to build
      </label>
      <textarea
        id="site-prompt"
        rows={3}
        value={prompt}
        disabled={building}
        onChange={(e) => {
          setPrompt(e.target.value);
          setError("");
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            build();
          }
        }}
        placeholder="A bakery in Lisbon that sells sourdough and pastel de nata…"
        className="block w-full resize-none bg-transparent px-2 pt-1 text-[16px] leading-[1.5] text-[#0f0f0f] placeholder:text-[#8a8a8e] focus:outline-none disabled:opacity-60"
      />
      <div className="mt-2 flex items-center gap-3 pl-2">
        {building ? (
          <p role="status" className="flex items-center gap-2 text-[14px] text-fg-2">
            <motion.span
              aria-hidden
              className="size-2 rounded-full bg-octa-600"
              animate={reduce ? undefined : { opacity: [1, 0.25, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
            Designing your site — usually under a minute
          </p>
        ) : (
          error && (
            <p role="alert" className="text-[13px] text-red-700">
              {error}
            </p>
          )
        )}
        <button
          type="submit"
          disabled={building || !prompt.trim()}
          aria-label="Build website"
          className="ml-auto grid size-10 shrink-0 place-items-center rounded-[10px] bg-octa-600 text-white transition-all hover:bg-octa-500 active:scale-95 disabled:opacity-50"
        >
          <ArrowUpRight size={20} strokeWidth={2} />
        </button>
      </div>
    </form>
  );
}
