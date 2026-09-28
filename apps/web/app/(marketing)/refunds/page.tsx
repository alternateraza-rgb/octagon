import type { Metadata } from "next";
import { DocLink, LegalPage, LegalSection, SupportLink } from "@/components/marketing/legal";

export const metadata: Metadata = {
  title: "Refund policy",
  description: "Octacore purchases are generally non-refundable. Here's how cancelling works and who to contact.",
  alternates: { canonical: "/refunds" },
};

export default function RefundsPage() {
  return (
    <LegalPage
      title="Refund policy"
      updated="28 September 2026"
      intro={
        <p>
          All purchases on Octacore are generally non-refundable. If you&apos;re asking for a refund because of an issue
          with using Octacore, please contact us directly at <SupportLink />.
        </p>
      }
    >
      <LegalSection title="What this covers">
        <p>
          This policy applies to everything you buy from Octacore, including monthly and yearly plans and their renewals,
          whether you pay monthly or once a year.
        </p>
      </LegalSection>

      <LegalSection title="Issues with usage">
        <p>
          If something isn&apos;t working as it should and you&apos;d like a refund because of it, email <SupportLink /> from
          the address on your account. Tell us which charge it&apos;s about and what went wrong. We review every request
          individually.
        </p>
      </LegalSection>

      <LegalSection title="Cancelling">
        <p>
          You can cancel your plan at any time from <strong>Settings › Plan and billing</strong> to stop future renewals.
          Cancelling doesn&apos;t refund the current period. Your plan stays active until the end of the period you&apos;ve
          paid for. After that, your live sites are paused (apart from any whose hosting a client pays for), and your
          account and sites stay in place for when you renew.
        </p>
      </LegalSection>

      <LegalSection title="Websites you sell to clients">
        <p>
          When you sell a website through Octacore, your client pays you through a Whop checkout on your own payout account.
          Any refund to your client is between you and them, and you issue it from your Whop account. Octacore&apos;s
          platform fee on the sale is non-refundable.
        </p>
      </LegalSection>

      <LegalSection title="More information">
        <p>
          This policy is part of our <DocLink href="/terms">Terms of Service</DocLink>. Nothing in it limits rights you
          have under the consumer protection laws where you live. Questions: <SupportLink />.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
