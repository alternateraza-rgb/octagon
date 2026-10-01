import Link from "next/link";
import { redirect } from "next/navigation";
import { OctacoreLogo } from "@octacore/ui/logo";
import { LoginForm } from "@/components/auth/login-form";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getSession } from "@/lib/auth/server";
import { googleEnabled } from "@/lib/auth/auth";

export const metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next, reset, error } = await searchParams;
  // Only same-site paths, so ?next= can't bounce people to another site.
  const target = typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
  if (await getSession()) redirect(target);
  const { env } = await getCloudflareContext({ async: true });

  return (
    <div data-theme="light" className="dots flex min-h-dvh flex-col bg-canvas px-5 py-6 text-fg sm:px-10">
      <header>
        <Link href="/" aria-label="Octacore home">
          <OctacoreLogo size={24} />
        </Link>
      </header>
      <main className="mx-auto flex w-full max-w-[440px] flex-1 flex-col justify-center py-12">
        <h1 className="font-[family-name:var(--font-display)] text-[40px] font-semibold leading-[1] tracking-[-0.04em]">
          Welcome back
        </h1>
        <p className="mt-3 text-[16px] text-fg-2">Log in to keep building.</p>
        {reset && (
          <p role="status" className="mt-6 rounded-[12px] bg-emerald-500/10 px-4 py-3 text-[14px] text-emerald-800">
            Your password was changed. Log in with the new one.
          </p>
        )}
        {error && (
          <p role="alert" className="mt-6 rounded-[12px] bg-red-500/10 px-4 py-3 text-[14px] text-red-800">
            Google sign-in didn&apos;t go through. Try again, or log in with your email.
          </p>
        )}
        <LoginForm next={target} google={googleEnabled(env)} />
      </main>
    </div>
  );
}
