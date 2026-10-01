import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { OctacoreMark } from "@octacore/ui/logo";
import { getSequenceByToken, unsubscribe } from "@/lib/outreach/store";

export const metadata: Metadata = { title: "Unsubscribe", robots: { index: false, follow: false } };

// Public: the unsubscribe link at the bottom of every outreach email. It takes a click on the page
// (not just opening the link), so email security scanners that follow links don't unsubscribe people.
export default async function UnsubscribePage({ params, searchParams }: PageProps<"/u/[token]">) {
  const [{ token }, { done }] = await Promise.all([params, searchParams]);
  const { env } = await getCloudflareContext({ async: true });
  const sequence = await getSequenceByToken(env.DB, token);

  async function confirm() {
    "use server";
    const { env } = await getCloudflareContext({ async: true });
    await unsubscribe(env.DB, token);
    redirect(`/u/${token}?done=1`);
  }

  const finished = done === "1" || sequence?.status === "unsubscribed";
  return (
    <main className="grid min-h-dvh place-items-center bg-canvas px-5 py-16 text-fg">
      <div className="w-full max-w-[440px] rounded-[28px] bg-elevated p-8 text-center shadow-soft ring-1 ring-hairline dark:shadow-none sm:p-10">
        <OctacoreMark size={40} className="mx-auto" />
        {!sequence ? (
          <>
            <h1 className="mt-6 text-[28px] font-semibold tracking-[-0.02em]">This link has expired</h1>
            <p className="mt-2 text-[15px] text-fg-2">Reply to the email and ask not to be contacted again.</p>
          </>
        ) : finished ? (
          <>
            <h1 className="mt-6 text-[28px] font-semibold tracking-[-0.02em]">You&apos;re unsubscribed</h1>
            <p className="mt-2 text-[15px] text-fg-2">
              {sequence.toEmail} won&apos;t get any more emails from {sequence.sender} or anyone else sending through Octacore.
            </p>
          </>
        ) : (
          <>
            <h1 className="mt-6 text-[28px] font-semibold tracking-[-0.02em] text-balance">Stop emails from {sequence.sender}?</h1>
            <p className="mt-2 text-[15px] text-fg-2">{sequence.toEmail} won&apos;t be emailed again through Octacore.</p>
            <form action={confirm} className="mt-7">
              <button
                type="submit"
                className="h-12 w-full rounded-full bg-fg text-[16px] font-medium text-canvas transition-opacity hover:opacity-85"
              >
                Unsubscribe
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
