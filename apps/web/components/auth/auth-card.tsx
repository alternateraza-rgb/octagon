import Link from "next/link";
import { OctacoreLogo } from "@octacore/ui/logo";

// Shared frame for the log in, forgot and reset password pages.
export function AuthCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div data-theme="light" className="dots flex min-h-dvh flex-col bg-canvas px-5 py-6 text-fg sm:px-10">
      <header>
        <Link href="/" aria-label="Octacore home">
          <OctacoreLogo size={24} />
        </Link>
      </header>
      <main className="mx-auto flex w-full max-w-[440px] flex-1 flex-col justify-center py-12">
        <h1 className="font-[family-name:var(--font-display)] text-[40px] font-semibold leading-[1] tracking-[-0.04em]">
          {title}
        </h1>
        <p className="mt-3 text-[16px] text-fg-2">{subtitle}</p>
        {children}
      </main>
    </div>
  );
}
