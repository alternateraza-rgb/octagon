import type { Metadata } from "next";
import { DocLink, LegalPage, LegalSection, SupportLink } from "@/components/marketing/legal";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The agreement between you and Octacore for building, hosting and selling websites.",
  alternates: { canonical: "/terms" },
};

const CONTENTS: [string, string][] = [
  ["agreement", "The agreement"],
  ["accounts", "Your account"],
  ["plans", "Plans, billing and renewals"],
  ["refunds", "Refunds"],
  ["content", "Your content"],
  ["ai", "AI-generated content"],
  ["hosting", "Hosting and your sites"],
  ["selling", "Selling websites to clients"],
  ["owners", "Site owners (clients)"],
  ["agents", "Octa Agents and Lead Finder"],
  ["acceptable-use", "Acceptable use"],
  ["third-parties", "Third-party services"],
  ["ours", "Our intellectual property"],
  ["termination", "Suspension and termination"],
  ["disclaimers", "Disclaimers"],
  ["liability", "Limitation of liability"],
  ["indemnity", "Indemnity"],
  ["changes", "Changes to Octacore and these terms"],
  ["general", "General"],
  ["contact", "Contact"],
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      updated="28 September 2026"
      contents={CONTENTS}
      intro={
        <>
          <p>
            Octacore is an app for building websites by describing them, hosting them, and selling them to businesses.
            These terms are the agreement between you and Octacore (&ldquo;Octacore&rdquo;, &ldquo;we&rdquo;,
            &ldquo;us&rdquo;) for using octacore.app, the websites we host, and everything that comes with them (together,
            &ldquo;the Service&rdquo;).
          </p>
          <p>Please read them carefully. By creating an account or using the Service, you agree to them.</p>
        </>
      }
    >
      <LegalSection id="agreement" title="1. The agreement">
        <p>
          These terms, our <DocLink href="/privacy">Privacy policy</DocLink> and our{" "}
          <DocLink href="/refunds">Refund policy</DocLink> make up the whole agreement between you and Octacore about the
          Service. If you use Octacore on behalf of a business, you confirm you&apos;re authorised to accept these terms
          for it, and &ldquo;you&rdquo; includes that business.
        </p>
      </LegalSection>

      <LegalSection id="accounts" title="2. Your account">
        <ul>
          <li>You must be at least 16, and old enough to form a binding contract where you live.</li>
          <li>Give us accurate details and keep them up to date, especially your email address.</li>
          <li>
            Keep your password safe. You&apos;re responsible for everything done through your account. Tell us straight
            away at <SupportLink /> if you think someone else has accessed it.
          </li>
          <li>
            Accounts are for one person. Don&apos;t share your sign-in or create accounts to get around plan limits,
            suspensions or bans.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="plans" title="3. Plans, billing and renewals">
        <p>
          <strong>Paid plans.</strong> Building and hosting websites requires a paid plan (Starter, Pro or Agency). Each
          plan includes set monthly allowances, such as AI builds and edits, chat messages, live websites, upload storage
          and Lead Finder leads. The current allowances and prices are shown when you choose a plan. To keep the Service
          fair and stable, we may also apply reasonable daily usage limits.
        </p>
        <p>
          <strong>Payments.</strong> Payments are processed by Whop, and you also agree to Whop&apos;s terms when you pay.
          Prices are shown before you buy and may not include taxes, which you&apos;re responsible for where they apply.
        </p>
        <p>
          <strong>Automatic renewal.</strong> Plans renew automatically at the end of each monthly or yearly period, and
          you&apos;ll be charged the plan&apos;s price at that time until you cancel. On yearly plans, allowances reset
          monthly.
        </p>
        <p>
          <strong>Cancelling.</strong> You can cancel any time from Settings › Plan and billing. Your plan stays active to
          the end of the period you&apos;ve paid for and then isn&apos;t renewed.
        </p>
        <p>
          <strong>Changing plans.</strong> A new plan starts straight away and replaces your previous one. Time left on the
          previous plan isn&apos;t credited or refunded.
        </p>
        <p>
          <strong>Failed payments and lapsed plans.</strong> If a payment fails, Whop may retry it. If your plan ends or
          can&apos;t be renewed, paid features stop and your live sites are paused (apart from any whose hosting a client
          pays for) until you renew.
        </p>
        <p>
          <strong>Price changes.</strong> We may change prices. If a change affects a plan you&apos;re on, we&apos;ll tell
          you in advance, and it applies from your next renewal. You can cancel before then if you don&apos;t want to
          continue.
        </p>
      </LegalSection>

      <LegalSection id="refunds" title="4. Refunds">
        <p>
          All purchases are generally non-refundable. If you&apos;re asking for a refund because of an issue with using
          Octacore, contact us directly at <SupportLink />. See the <DocLink href="/refunds">Refund policy</DocLink> for
          details.
        </p>
      </LegalSection>

      <LegalSection id="content" title="5. Your content">
        <p>
          &ldquo;Your content&rdquo; means what you put into Octacore, such as prompts, messages, business details, logos,
          images and files, and the websites the Service creates for you.
        </p>
        <ul>
          <li>
            <strong>You own your content.</strong> We don&apos;t claim ownership of it.
          </li>
          <li>
            <strong>You give us permission to run the Service with it.</strong> That means a worldwide, non-exclusive,
            royalty-free licence to host, store, copy, process, display and publish your content, only as needed to
            provide, secure and improve the Service. This includes sending it to our service providers, such as our AI
            provider. The licence ends when you delete the content or your account, except for copies we must keep by law
            or that are in backups while they expire.
          </li>
          <li>
            <strong>You&apos;re responsible for your content.</strong> You confirm you have the rights to everything you
            upload or ask Octacore to use, including logos, photos, trademarks and business information, and that
            publishing it won&apos;t break any law or anyone else&apos;s rights.
          </li>
          <li>
            <strong>Uploads are reachable by link.</strong> Uploaded files are served from long, unguessable public links so
            your sites can use them. Don&apos;t upload anything that must stay private.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="ai" title="6. AI-generated content">
        <p>
          Octacore uses AI to plan, write and design websites and to answer your messages. AI output can be inaccurate,
          incomplete or similar to content created for other people. Review everything before you publish or sell it,
          especially facts, prices, opening hours, contact details, and anything with legal, medical or financial
          implications. As between you and Octacore, you own the output created for you, subject to these terms and any
          third-party rights in it.
        </p>
        <p>
          Templates and stock photos are provided to use within websites built on Octacore. Stock photos come from Pexels
          and are subject to its licence. They may not be sold on their own or used to suggest that the people or places
          shown endorse a business.
        </p>
      </LegalSection>

      <LegalSection id="hosting" title="7. Hosting and your sites">
        <ul>
          <li>
            Published sites are served from an address on octacore.app, and on any custom domain you connect.
            You&apos;re responsible for owning and configuring any domain you connect.
          </li>
          <li>
            We work to keep sites fast and available, but we don&apos;t guarantee uninterrupted service. Keep your own copies
            of anything important.
          </li>
          <li>
            We may remove or disable any site or content that we reasonably believe breaks these terms or the law, or that
            puts the Service or other people at risk.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="selling" title="8. Selling websites to clients">
        <p>Octacore lets you sell websites you&apos;ve built to businesses (&ldquo;clients&rdquo;). When you do:</p>
        <ul>
          <li>
            <strong>You&apos;re the seller.</strong> The sale is between you and your client. Octacore provides the tools,
            checkout and hand-over, but isn&apos;t a party to your deal. You set the price, any monthly hosting fee, and your
            own terms with your client, and you&apos;re responsible for delivering what you promise.
          </li>
          <li>
            <strong>Payouts.</strong> To get paid, you connect a payout account with Whop and agree to Whop&apos;s terms.
            Clients pay through a Whop checkout, and the money goes to your account.
          </li>
          <li>
            <strong>Platform fee.</strong> Octacore keeps a 10% platform fee on each sale and hosting payment, before
            Whop&apos;s own processing fees. The platform fee is non-refundable.
          </li>
          <li>
            <strong>Refunds and disputes with clients</strong> are yours to handle, from your Whop account. Chargebacks
            and payment disputes are handled under Whop&apos;s terms.
          </li>
          <li>
            <strong>Ownership transfer.</strong> When a client pays (or you mark a site as sold), they&apos;re invited to
            claim the site and become its owner on Octacore. After that, the site is theirs and you may no longer be able to
            edit it or take it back.
          </li>
          <li>
            <strong>Taxes and compliance.</strong> You&apos;re responsible for invoices, taxes and any licences that apply to
            your sales, and for having the right to sell the content in each site.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="owners" title="9. Site owners (clients)">
        <p>
          If you&apos;ve bought a website and claimed it on Octacore, these terms apply to your use of Octacore as the
          site&apos;s owner. Your purchase itself is between you and the seller, who is responsible for what they sold you.
          If the seller offered monthly hosting, your site stays live while that hosting is paid. If you can&apos;t reach
          your seller, contact us at <SupportLink /> and we&apos;ll try to help.
        </p>
      </LegalSection>

      <LegalSection id="agents" title="10. Octa Agents and Lead Finder">
        <p>
          Octa Agents find local businesses using public listing data from Google and can build demo websites for them.
          Some agent features are marked &ldquo;coming soon&rdquo; and may change or be limited while they&apos;re being
          developed.
        </p>
        <ul>
          <li>
            Business information comes from third parties and may be out of date or wrong. Check it before relying on it.
          </li>
          <li>
            If you contact a business, you must follow the laws that apply to marketing and outreach, such as anti-spam,
            telemarketing and data protection laws. Respect opt-outs, and don&apos;t misrepresent who you are or suggest the
            business asked for its demo site.
          </li>
          <li>
            Demo sites use a business&apos;s name and details for pitching only. Don&apos;t publish them as if they were the
            business&apos;s own site or sell one to anyone other than that business.
          </li>
          <li>Use Lead Finder data only for prospecting through Octacore, and not to build or resell lists.</li>
        </ul>
      </LegalSection>

      <LegalSection id="acceptable-use" title="11. Acceptable use">
        <p>You must not use Octacore, or publish anything with it, that:</p>
        <ul>
          <li>Breaks the law or helps anyone else break it.</li>
          <li>Infringes anyone&apos;s intellectual property, privacy or other rights.</li>
          <li>
            Impersonates a person or business, or is designed to deceive, including phishing pages, fake shops, fake
            reviews and scams.
          </li>
          <li>Spreads malware, or collects passwords or payment details under false pretences.</li>
          <li>
            Contains sexual content involving minors, sexual content shared without consent, violent extremism, or content
            that harasses, threatens or promotes hatred against people based on who they are.
          </li>
          <li>
            Sells or promotes illegal goods or services, or products and services that require a licence you don&apos;t
            hold.
          </li>
          <li>Sends spam or unsolicited bulk messages.</li>
        </ul>
        <p>You also must not:</p>
        <ul>
          <li>
            Try to get around plan limits, share accounts, or access the Service by scraping or other automated means we
            haven&apos;t provided.
          </li>
          <li>
            Probe, overload or disrupt the Service or its infrastructure, or access accounts, sites or data that aren&apos;t
            yours.
          </li>
          <li>
            Reverse engineer the Service, or use it or its output to build a competing product, except where the law allows
            it.
          </li>
          <li>Resell access to Octacore itself, rather than the websites you build with it.</li>
        </ul>
        <p>
          To report a site or content that breaks these rules, email <SupportLink />.
        </p>
      </LegalSection>

      <LegalSection id="third-parties" title="12. Third-party services">
        <p>
          The Service relies on third parties, including Cloudflare (hosting), OpenAI (AI), Whop (payments and payouts),
          Resend (email), SerpApi (Octa Agents searches) and Pexels (stock photos). Their services are governed by their own terms,
          and we&apos;re not responsible for them. Features that depend on them may change if they change what they offer.
        </p>
      </LegalSection>

      <LegalSection id="ours" title="13. Our intellectual property">
        <p>
          Octacore, including its software, design, templates, brand and logo, belongs to us and our licensors. As long as
          you follow these terms, we give you a limited, non-exclusive, non-transferable right to use the Service. Our
          templates may be used and customised inside websites you build and sell with Octacore, but not extracted,
          redistributed or sold on their own. If you send us feedback, we may use it freely without owing you anything.
        </p>
      </LegalSection>

      <LegalSection id="termination" title="14. Suspension and termination">
        <p>
          You can stop using Octacore and delete your account at any time in Settings. Deleting your account permanently
          removes your chats, websites and uploads, and your live sites go offline straight away.
        </p>
        <p>
          We may suspend or close your account, or take down sites, if you seriously or repeatedly break these terms, if
          required by law, or to protect the Service, our users or the public. Where it&apos;s reasonable, we&apos;ll tell
          you first and give you a chance to fix the problem. If we close the Service entirely, we&apos;ll give you
          reasonable notice.
        </p>
        <p>
          The sections on content licences for deleted content, selling, disclaimers, limitation of liability, indemnity
          and general terms continue to apply after your account ends.
        </p>
      </LegalSection>

      <LegalSection id="disclaimers" title="15. Disclaimers">
        <p>
          The Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;. To the fullest extent the law allows,
          we make no warranties, express or implied, including of merchantability, fitness for a particular purpose,
          non-infringement, or that the Service or its output will be accurate, error-free or uninterrupted. We don&apos;t
          guarantee that you&apos;ll sell any website or earn any amount. Examples and customer stories aren&apos;t
          promises of results.
        </p>
      </LegalSection>

      <LegalSection id="liability" title="16. Limitation of liability">
        <p>
          To the fullest extent the law allows, Octacore won&apos;t be liable for any indirect, incidental, special,
          consequential or punitive damages, or for lost profits, revenue, data, goodwill or business opportunities.
        </p>
        <p>
          Our total liability for all claims relating to the Service is limited to the greater of the amount you paid
          Octacore in the 12 months before the claim arose and 100 US dollars.
        </p>
        <p>
          Nothing in these terms limits liability that can&apos;t be limited by law, such as liability for fraud, or for
          death or personal injury caused by negligence.
        </p>
      </LegalSection>

      <LegalSection id="indemnity" title="17. Indemnity">
        <p>
          You agree to defend and compensate Octacore against claims, losses and costs (including reasonable legal fees)
          arising from your content, the websites you publish or sell, your dealings with clients or businesses you contact,
          or your breach of these terms or the law.
        </p>
      </LegalSection>

      <LegalSection id="changes" title="18. Changes to Octacore and these terms">
        <p>
          Octacore is changing all the time. We may add, change or remove features. If we make a material change to these
          terms, we&apos;ll tell you by email or in the app before it takes effect. If you keep using the Service after
          that, you accept the new terms. If you don&apos;t agree, you can cancel and stop using Octacore.
        </p>
      </LegalSection>

      <LegalSection id="general" title="19. General">
        <ul>
          <li>
            If any part of these terms can&apos;t be enforced, the rest still applies.
          </li>
          <li>If we don&apos;t enforce a right straight away, we haven&apos;t given it up.</li>
          <li>
            You can&apos;t transfer your rights under these terms without our consent. We may transfer ours as part of a
            merger, acquisition or sale of assets.
          </li>
          <li>We&apos;re not responsible for delays or failures caused by events outside our reasonable control.</li>
          <li>
            If you have a dispute with us, please email <SupportLink /> first so we can try to resolve it informally.
            These terms are governed by the laws of the State of Wyoming, United States, without regard to its
            conflict-of-laws rules and without affecting any mandatory consumer protections where you live.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="contact" title="20. Contact">
        <p>
          Questions about these terms: <SupportLink />.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
