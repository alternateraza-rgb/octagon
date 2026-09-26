import Link from "next/link";
import { redirect } from "next/navigation";
import { OctacoreLogo } from "@octacore/ui/logo";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { getSession } from "@/lib/auth/server";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/dashboard");

  return (
    <div data-theme="light" className="flex min-h-dvh flex-col bg-canvas px-5 py-6 text-fg sm:px-10">
      <header className="flex items-center justify-between">
        <Link href="/" aria-label="Octacore home">
          <OctacoreLogo size={24} />
        </Link>
        <SignOutButton />
      </header>
      <main className="mx-auto flex w-full max-w-[680px] flex-1 flex-col justify-center py-12">
        <h1 className="font-[family-name:var(--font-display)] text-[40px] font-semibold leading-[1] tracking-[-0.04em]">
          Your sites
        </h1>
        <p className="mt-3 text-[16px] text-fg-2">
          Signed in as <span className="text-fg">{session.user.email}</span>. The builder is the next piece we&apos;re
          shipping.
        </p>
      </main>
    </div>
  );
}
