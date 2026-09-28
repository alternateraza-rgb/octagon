import type { Metadata } from "next";
import { DocLink, LegalPage, LegalSection, SupportLink } from "@/components/marketing/legal";

const CONTENTS: [string, string][] = [
  ["who", "Who we are"],
  ["collect", "What we collect"],
  ["owners", "Site owners and their clients"],
  ["use", "How we use it"],
  ["sharing", "Who we share it with"],
  ["public", "What's public"],
  ["cookies", "Cookies"],
  ["retention", "How long we keep it"],
  ["rights", "Your rights"],
  ["security", "Security"],
  ["transfers", "International transfers"],
  ["children", "Children"],
  ["changes", "Changes to this policy"],
  ["contact", "Contact"],
];

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "What Octacore collects, why, who it's shared with, and how to access or delete it.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy policy"
      updated="28 September 2026"
      contents={CONTENTS}
      intro={
        <p>
          Octacore is an app for building, hosting and selling websites. This policy explains what we collect when you use
          octacore.app, the sites we host and the emails we send, why we collect it, and the choices you have. We don&apos;t
          sell your personal information, and we don&apos;t use advertising or tracking cookies.
        </p>
      }
    >
      <LegalSection id="who" title="1. Who we are">
        <p>
          &ldquo;Octacore&rdquo;, &ldquo;we&rdquo; and &ldquo;us&rdquo; mean the operator of octacore.app. For anything
          in this policy, including requests about your data, email <SupportLink />. Your use of Octacore is also
          governed by our <DocLink href="/terms">Terms of Service</DocLink>.
        </p>
      </LegalSection>

      <LegalSection id="collect" title="2. What we collect">
        <p>
          <strong>Your account.</strong> Your name, email address and a hashed version of your password. We never store
          your password itself.
        </p>
        <p>
          <strong>Sign-in sessions.</strong> When you sign in, we record the session along with the IP address and browser
          (user agent) it came from, so we can keep you signed in and protect your account.
        </p>
        <p>
          <strong>What you create.</strong> The prompts and chat messages you send, the websites Octacore builds for you,
          their saved versions and notes, and any files you upload, such as logos, images and PDFs.
        </p>
        <p>
          <strong>Billing.</strong> Payments are handled by Whop. We receive your plan, billing interval, subscription
          status and renewal dates, but never your card details.
        </p>
        <p>
          <strong>Selling sites.</strong> When you sell a website, we store your client&apos;s name and email address,
          the price and hosting fee you set, and the payment status. When you set up payouts, we store a reference to your
          Whop payout account.
        </p>
        <p>
          <strong>Lead Finder.</strong> If you use Octa Agents, we store the searches you run and publicly listed business
          details from Google Maps, such as a business&apos;s name, address, phone number, rating and reviews.
        </p>
        <p>
          <strong>Usage and logs.</strong> We count builds, messages, sites, uploads and searches to apply your
          plan&apos;s limits. Our hosting provider keeps short-lived request and error logs that we use to run and debug
          the service.
        </p>
      </LegalSection>

      <LegalSection id="owners" title="3. Site owners and their clients">
        <p>
          When one of our users sells you a website, they give us your name and email address so we can send you an
          invite. When you claim the site, we create an owner account for you, and your purchase is processed by Whop on
          the seller&apos;s account. We use your details only to give you access to your site, send service emails about
          it, and handle your requests. The seller is responsible for their own use of your information.
        </p>
      </LegalSection>

      <LegalSection id="use" title="4. How we use it">
        <ul>
          <li>To provide Octacore: build, edit, host and deploy your websites, and run your chats.</li>
          <li>To manage your account and subscription, and enforce plan limits and fair use.</li>
          <li>
            To process site sales: create checkout links, invite your client to claim their site, and pay you out.
          </li>
          <li>
            To send service emails, such as password resets, ownership invites and billing notices. We don&apos;t send
            marketing email without your consent.
          </li>
          <li>To keep Octacore secure, prevent abuse and fix problems.</li>
          <li>To meet our legal obligations.</li>
        </ul>
        <p>
          Where laws like the GDPR apply, we rely on performing our contract with you, our legitimate interest in running a
          secure and reliable service, your consent where we ask for it, and our legal obligations.
        </p>
      </LegalSection>

      <LegalSection id="sharing" title="5. Who we share it with">
        <p>
          We share data only with the service providers that run Octacore, and only what each one needs to do its job:
        </p>
        <ul>
          <li>
            <strong>Cloudflare</strong> for hosting, databases, file storage and the sites you publish.
          </li>
          <li>
            <strong>OpenAI</strong> to generate and edit websites and answer chat messages. It receives your prompts,
            messages and the files you attach to them.
          </li>
          <li>
            <strong>Whop</strong> for subscription payments, site-sale checkouts and payouts.
          </li>
          <li>
            <strong>Resend</strong> to deliver our emails.
          </li>
          <li>
            <strong>Google</strong> (Places API) for Lead Finder searches.
          </li>
          <li>
            <strong>Pexels</strong> to supply stock photos. It receives only the photo search terms, never your personal
            details.
          </li>
        </ul>
        <p>
          We may also disclose information if the law requires it, to protect our users or the public, or as part of a
          merger or sale of the business. If that happens, we&apos;ll tell you and this policy will continue to apply.
        </p>
      </LegalSection>

      <LegalSection id="public" title="6. What's public">
        <p>
          Websites you publish are public at their address. Files you upload are served from long, unguessable links so
          your sites and the AI can use them. Anyone who has one of these links can open the file, so please don&apos;t
          upload anything you want kept private.
        </p>
      </LegalSection>

      <LegalSection id="cookies" title="7. Cookies">
        <p>
          We use a secure sign-in cookie to keep you logged in and a small preference cookie that remembers whether your
          sidebar is open. We don&apos;t use analytics, advertising or cross-site tracking cookies. Whop may set its own
          cookies on its checkout pages.
        </p>
      </LegalSection>

      <LegalSection id="retention" title="8. How long we keep it">
        <p>
          We keep your account and what you create for as long as your account is open. When you delete your account in
          Settings, we permanently delete your account, chats, websites and uploads, and your live sites go offline
          straight away. We keep records of payments and sales for as long as tax and accounting law requires, and
          provider logs expire on their own.
        </p>
      </LegalSection>

      <LegalSection id="rights" title="9. Your rights">
        <p>
          Depending on where you live, you can ask to access, correct, export or delete your personal information, object
          to or restrict how we use it, and withdraw consent you&apos;ve given. You can edit your details and delete your
          account yourself in Settings. For anything else, email <SupportLink /> and we&apos;ll reply within 30 days. You
          can also complain to your local data protection authority.
        </p>
        <p>
          If you&apos;ve bought a website from one of our users, or your business appears in Lead Finder, you have the same
          rights and can contact us the same way.
        </p>
      </LegalSection>

      <LegalSection id="security" title="10. Security">
        <p>
          Data is encrypted in transit and at rest, passwords are hashed, and each site&apos;s data is kept separate. No
          service is perfectly secure, so if we ever learn of a breach that affects you, we&apos;ll tell you promptly.
        </p>
      </LegalSection>

      <LegalSection id="transfers" title="11. International transfers">
        <p>
          Our providers may process data in the United States and other countries. Where required, we rely on safeguards
          such as the European Commission&apos;s Standard Contractual Clauses.
        </p>
      </LegalSection>

      <LegalSection id="children" title="12. Children">
        <p>
          Octacore isn&apos;t for anyone under 16, and we don&apos;t knowingly collect their information. If you think a
          child has given us personal information, contact us and we&apos;ll delete it.
        </p>
      </LegalSection>

      <LegalSection id="changes" title="13. Changes to this policy">
        <p>
          If we make significant changes, we&apos;ll email you or show a notice in the app before they take effect. The date
          at the top of this page shows when this policy was last updated.
        </p>
      </LegalSection>

      <LegalSection id="contact" title="14. Contact">
        <p>
          Questions or requests about your privacy: <SupportLink />.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
