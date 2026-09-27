import type { Metadata } from "next";
import { LegalPage, LegalSection, SupportLink } from "@/components/marketing/legal";

export const metadata: Metadata = {
  title: "Refund policy",
  description: "How cancellations and refunds work for Octacore plans and for websites you sell to clients.",
};

export default function RefundsPage() {
  return (
    <LegalPage
      title="Refund policy"
      updated="27 September 2026"
      intro={
        <p>
          We want Octacore to pay for itself. If it doesn&apos;t work out, here&apos;s how cancelling and refunds work.
        </p>
      }
    >
      <LegalSection title="Cancel any time">
        <p>
          You can cancel your plan whenever you like from <strong>Settings › Plan and billing</strong>. Your plan stays
          active until the end of the period you&apos;ve already paid for, and you won&apos;t be charged again. When it
          ends, your live sites are paused (apart from any whose hosting a client pays for), but your account, sites and
          addresses stay in place, and everything comes back when you renew.
        </p>
      </LegalSection>

      <LegalSection title="14-day refund on your first payment">
        <p>
          If Octacore isn&apos;t right for you, email <SupportLink /> within 14 days of your first payment for a full
          refund. This applies once per customer, to the first charge on a monthly or yearly plan.
        </p>
      </LegalSection>

      <LegalSection title="Renewals">
        <p>
          <strong>Monthly plans.</strong> Monthly renewals aren&apos;t refunded, but you can cancel at any time to stop the
          next one.
        </p>
        <p>
          <strong>Yearly plans.</strong> If a yearly renewal catches you by surprise, email us within 14 days of the charge
          and you haven&apos;t used Octacore since it renewed, and we&apos;ll refund it in full.
        </p>
      </LegalSection>

      <LegalSection title="Changing plans">
        <p>
          When you switch plans, the new plan starts straight away and your previous plan ends. We don&apos;t prorate the
          remaining time. If switching left you paying twice by mistake, email us and we&apos;ll sort it out.
        </p>
      </LegalSection>

      <LegalSection title="When we don't refund">
        <ul>
          <li>Accounts suspended for breaking our terms or abusing the service.</li>
          <li>Partial months, or time left on a plan after cancelling.</li>
          <li>Requests made after the windows above, except where the law says otherwise.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Websites you sell to clients">
        <p>
          When you sell a website through Octacore, your client pays you directly through a Whop checkout on your payout
          account, and Octacore keeps a 10% platform fee. You set the price and your own refund terms with your client,
          and you handle any refund to them from your Whop account.
        </p>
        <p>
          If you refund a sale, our platform fee isn&apos;t returned, except where the refund is caused by a fault on our
          side. If you&apos;re a business that bought a website and can&apos;t reach the person who sold it to you, email
          us and we&apos;ll help.
        </p>
      </LegalSection>

      <LegalSection title="Charged by mistake">
        <p>
          If you were charged twice, charged after cancelling, or charged because of an error on our side, we&apos;ll refund
          it in full, whenever you tell us.
        </p>
      </LegalSection>

      <LegalSection title="How to ask for a refund">
        <p>
          Email <SupportLink /> from the address on your account and tell us which charge it&apos;s about. We reply within
          two business days. Approved refunds go back to your original payment method through Whop and usually arrive
          within 5–10 business days, depending on your bank.
        </p>
        <p>
          Nothing in this policy limits any rights you have under consumer protection law where you live.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
