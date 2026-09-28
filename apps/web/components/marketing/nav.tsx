"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { OctacoreLogo } from "@octacore/ui/logo";

const LINKS = [
  { href: "/features", label: "Features" },
  { href: "/templates", label: "Templates" },
  { href: "/agents", label: "Octa Agents" },
  { href: "/pricing", label: "Pricing" },
  { href: "/guides", label: "Guides" },
];

export function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-[background-color,border-color] duration-300 ${
        scrolled || open ? "material border-b border-hairline" : "border-b border-transparent bg-transparent"
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 sm:px-8">
        <Link href="/" aria-label="Octacore home" className="text-fg">
          <OctacoreLogo size={26} />
        </Link>
        <ul className="hidden items-center gap-8 text-[14px] text-fg lg:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="opacity-80 transition-opacity hover:opacity-100">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-1 sm:gap-3">
          <Link href="/login" className="hidden px-3 py-2 text-[14px] sm:block">
            Log in
          </Link>
          <Link
            href="/start"
            className="whitespace-nowrap rounded-[10px] bg-[#0f0f0f] px-3.5 py-2 text-[14px] font-medium text-white sm:px-4 transition-colors hover:bg-octa-700"
          >
            Start building
          </Link>
          <button
            className="grid size-11 place-items-center lg:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>
      {open && (
        <ul className="px-4 pb-6 lg:hidden">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                onClick={() => setOpen(false)}
                className="block border-b border-hairline py-4 font-[family-name:var(--font-display)] text-[24px] font-semibold tracking-tight"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </header>
  );
}
