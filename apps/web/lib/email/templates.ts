// Branded transactional emails. Table layout and inline styles so they hold up in Gmail, Outlook and
// Apple Mail; Geist loads where the client allows web fonts and falls back to the system font.
import type { Email } from "./send";

const ORIGIN = "https://octacore.app";
const FONT = "Geist, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

const escape = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function layout({
  preview,
  title,
  body,
  button,
  after,
  reason,
}: {
  preview: string;
  title: string;
  body: string;
  button?: { label: string; url: string };
  after?: string;
  reason: string;
}) {
  const cta = button
    ? `<tr><td style="padding:32px 0 8px"><a href="${button.url}" style="display:inline-block;background:#c2410c;color:#ffffff;font:600 15px/1 ${FONT};text-decoration:none;padding:16px 28px;border-radius:999px">${button.label} &rarr;</a></td></tr>`
    : "";
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only">
<title>${escape(title)}</title>
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;600&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:#f9f8f6;-webkit-font-smoothing:antialiased">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${escape(preview)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f9f8f6">
<tr><td align="center" style="padding:48px 16px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px">
    <tr><td style="padding:0 8px 24px">
      <a href="${ORIGIN}" style="text-decoration:none;color:#0f0f0f">
        <img src="${ORIGIN}/email/mark.png" width="28" height="28" alt="" style="vertical-align:middle;border:0">
        <span style="vertical-align:middle;margin-left:8px;font:600 20px/1 ${FONT};letter-spacing:-0.02em;color:#0f0f0f">octacore</span>
      </a>
    </td></tr>
    <tr><td style="background:#ffffff;border-radius:24px;padding:44px 40px;border:1px solid rgba(0,0,0,0.06)">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="font:600 30px/1.1 ${FONT};letter-spacing:-0.03em;color:#0f0f0f">${title}</td></tr>
        <tr><td style="padding-top:16px;font:400 16px/1.6 ${FONT};color:#5f5f63">${body}</td></tr>
        ${cta}
        ${after ? `<tr><td style="padding-top:24px;font:400 13px/1.6 ${FONT};color:#86868b">${after}</td></tr>` : ""}
      </table>
    </td></tr>
    <tr><td style="padding:28px 8px 0;font:400 12px/1.6 ${FONT};color:#86868b">
      ${reason}<br>
      <span style="color:#0f0f0f;font-weight:600">Octacore</span> &middot; Build it. Ship it. Sell it. &middot; <a href="${ORIGIN}" style="color:#86868b">octacore.app</a>
    </td></tr>
  </table>
</td></tr>
</table>
</body></html>`;
}

const first = (name: string) => escape(name.split(" ")[0] || "there");

export function resetPasswordEmail({ to, name, url }: { to: string; name: string; url: string }): Email {
  return {
    to,
    subject: "Reset your Octacore password",
    html: layout({
      preview: "Choose a new password — this link works for one hour.",
      title: "Reset your password",
      body: `Hi ${first(name)}, we got a request to reset the password for your Octacore account. Tap the button to choose a new one. The link works for one hour.`,
      button: { label: "Choose a new password", url },
      after: `If the button doesn't work, paste this link into your browser:<br><a href="${url}" style="color:#c2410c;word-break:break-all">${escape(url)}</a>`,
      reason: "Didn't ask for this? You can ignore this email — your password won't change.",
    }),
    text: `Hi ${name.split(" ")[0] || "there"},\n\nReset your Octacore password here (the link works for one hour):\n${url}\n\nDidn't ask for this? Ignore this email and your password won't change.\n\n— Octacore`,
  };
}

export function passwordChangedEmail({ to, name }: { to: string; name: string }): Email {
  return {
    to,
    subject: "Your Octacore password was changed",
    html: layout({
      preview: "Your password was just changed.",
      title: "Password changed",
      body: `Hi ${first(name)}, the password for your Octacore account was just changed, and other devices were signed out. If this was you, you're all set.`,
      button: { label: "Open Octacore", url: `${ORIGIN}/dashboard` },
      after: `Wasn't you? <a href="${ORIGIN}/forgot-password" style="color:#c2410c">Reset your password</a> straight away.`,
      reason: "You're getting this because the password on your account changed.",
    }),
    text: `Hi ${name.split(" ")[0] || "there"},\n\nThe password for your Octacore account was just changed. If this wasn't you, reset it now: ${ORIGIN}/forgot-password\n\n— Octacore`,
  };
}

export function welcomeEmail({ to, name }: { to: string; name: string }): Email {
  return {
    to,
    subject: "Welcome to Octacore",
    html: layout({
      preview: "Build your first website in under a minute.",
      title: "Welcome to Octacore",
      body: `Hi ${first(name)}, great to have you. Describe any business and Octacore designs, builds and hosts its website — then you sell it.<br><br>
<span style="color:#0f0f0f;font-weight:600">A good first step:</span> open Websites, describe a local business you know, and watch it come together.`,
      button: { label: "Build your first site", url: `${ORIGIN}/dashboard/sites` },
      reason: "You're getting this because you created an Octacore account.",
    }),
    text: `Hi ${name.split(" ")[0] || "there"},\n\nWelcome to Octacore. Describe any business and Octacore designs, builds and hosts its website.\n\nBuild your first site: ${ORIGIN}/dashboard/sites\n\n— Octacore`,
  };
}

// Sent with the welcome email: a personal invite from James to a free onboarding call.
const ONBOARDING_URL = "https://calendly.com/jameshailey-octacore/30min";

export function onboardingCallEmail({ to, name }: { to: string; name: string }): Email {
  const agenda = [
    "Set up your account and plan the way you'll use it",
    "Build your first website together, live",
    "Publish it and send your first checkout link",
    "Answer anything you want to know about Octacore",
  ]
    .map((item) => `<span style="color:#c2410c">&#10003;</span>&nbsp; ${item}`)
    .join("<br>");
  const signature = `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:4px">
  <tr>
    <td style="vertical-align:middle;padding-right:14px">
      <div style="width:44px;height:44px;border-radius:999px;background:#c2410c;color:#ffffff;font:600 16px/44px ${FONT};text-align:center;letter-spacing:0.02em">JH</div>
    </td>
    <td style="vertical-align:middle">
      <div style="font:600 15px/1.3 ${FONT};color:#0f0f0f">James Hailey</div>
      <div style="font:400 13px/1.4 ${FONT};color:#86868b">CTO, Octacore</div>
    </td>
  </tr>
</table>`;
  return {
    to,
    from: "James Hailey at Octacore <hello@octacore.app>",
    subject: "Let's build your first site together",
    html: layout({
      preview: "Book a free 30-minute onboarding call with our CTO.",
      title: "Let's build your first site together",
      body: `Hi ${first(name)}, I'm James, CTO at Octacore. Thanks for joining. I'd love to get you set up properly, so I'm opening my calendar for a free 30-minute onboarding call, just you and me.<br><br>
<span style="color:#0f0f0f;font-weight:600">On the call, we'll:</span><br>
<span style="color:#0f0f0f">${agenda}</span><br><br>
No prep needed. If you have a business in mind, bring its name and city and we'll build its site on the call.`,
      button: { label: "Book your onboarding call", url: ONBOARDING_URL },
      after: `${signature}<div style="margin-top:24px">Prefer to explore on your own? <a href="${ORIGIN}/dashboard/sites" style="color:#c2410c">Jump straight into the builder</a>. You can also just reply to this email with any questions.</div>`,
      reason: "You're getting this because you created an Octacore account.",
    }),
    text: `Hi ${name.split(" ")[0] || "there"},\n\nI'm James, CTO at Octacore. Thanks for joining. I'd love to get you set up properly, so I'm opening my calendar for a free 30-minute onboarding call.\n\nOn the call, we'll:\n- Set up your account and plan the way you'll use it\n- Build your first website together, live\n- Publish it and send your first checkout link\n- Answer anything you want to know about Octacore\n\nBook a time: ${ONBOARDING_URL}\n\nNo prep needed. If you have a business in mind, bring its name and city and we'll build its site on the call.\n\nJames Hailey\nCTO, Octacore`,
  };
}

const day = new Intl.DateTimeFormat("en", { month: "long", day: "numeric", timeZone: "UTC" });

export function planActivatedEmail({
  to,
  name,
  plan,
  features,
  yearly = false,
}: {
  to: string;
  name: string;
  plan: string;
  features: string[];
  yearly?: boolean;
}): Email {
  const list = features.map((f) => `<span style="color:#c2410c">&#10003;</span>&nbsp; ${escape(f)}`).join("<br>");
  return {
    to,
    subject: `You're on Octacore ${plan}`,
    html: layout({
      preview: `Your ${plan} plan is active. Here's what's included.`,
      title: `You're on ${escape(plan)}`,
      body: `Hi ${first(name)}, your plan is active${yearly ? ", billed yearly," : ""} and everything is unlocked. Here's what's included each month:<br><br><span style="color:#0f0f0f">${list}</span>`,
      button: { label: "Start building", url: `${ORIGIN}/dashboard/sites` },
      after: `Receipts come from Whop, our payment partner. Manage or cancel your plan anytime in <a href="${ORIGIN}/dashboard/settings#billing" style="color:#c2410c">Settings</a>.`,
      reason: "You're getting this because you subscribed to an Octacore plan.",
    }),
    text: `Hi ${name.split(" ")[0] || "there"},\n\nYour Octacore ${plan} plan is active:\n${features.map((f) => `- ${f}`).join("\n")}\n\nStart building: ${ORIGIN}/dashboard/sites\n\n— Octacore`,
  };
}

export function planEndedEmail({ to, name, pausesAt }: { to: string; name: string; pausesAt: number }): Email {
  const date = day.format(pausesAt);
  return {
    to,
    subject: "Your Octacore plan has ended",
    html: layout({
      preview: `Your live sites stay up until ${date}.`,
      title: "Your plan has ended",
      body: `Hi ${first(name)}, your Octacore plan has ended, so building and editing are paused. Your live websites stay up until <span style="color:#0f0f0f;font-weight:600">${date}</span> — renew before then and your clients won't notice a thing.`,
      button: { label: "Renew your plan", url: `${ORIGIN}/dashboard/settings#billing` },
      after: "Your sites, versions and addresses are kept safe either way.",
      reason: "You're getting this because your Octacore subscription ended.",
    }),
    text: `Hi ${name.split(" ")[0] || "there"},\n\nYour Octacore plan has ended. Your live websites stay up until ${date}. Renew here: ${ORIGIN}/dashboard/settings#billing\n\n— Octacore`,
  };
}

export function sitesPausedEmail({ to, name, count }: { to: string; name: string; count: number }): Email {
  const sites = count === 1 ? "Your website is" : `Your ${count} websites are`;
  return {
    to,
    subject: `${sites} paused`,
    html: layout({
      preview: "Renew your plan to bring them back instantly.",
      title: `${sites} paused`,
      body: `Hi ${first(name)}, it's been 14 days since your Octacore plan ended, so your live sites now show a "paused" page. Everything is kept — renew and they're back online within seconds, at the same addresses.`,
      button: { label: "Renew and go live", url: `${ORIGIN}/dashboard/settings#billing` },
      reason: "You're getting this because your Octacore subscription ended.",
    }),
    text: `Hi ${name.split(" ")[0] || "there"},\n\n${sites} paused because your Octacore plan ended 14 days ago. Renew to bring them back at the same addresses: ${ORIGIN}/dashboard/settings#billing\n\n— Octacore`,
  };
}

// ——— Selling sites ———

const price = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: cents % 100 ? 2 : 0 }).format(cents / 100);
const priceLine = (priceCents: number, monthlyCents: number | null) =>
  monthlyCents ? `${price(priceCents)}, then ${price(monthlyCents)}/month for hosting` : price(priceCents);
const quote = (message: string) =>
  `<span style="display:block;margin-top:20px;padding:16px 18px;border-radius:16px;background:#f9f8f6;color:#0f0f0f;font-style:italic">${escape(message).replace(/\n/g, "<br>")}</span>`;

// To the client: the seller built them a website and here it is.
export function saleInviteEmail({
  to,
  buyerName,
  sellerName,
  siteTitle,
  message,
  priceCents,
  monthlyCents,
  url,
}: {
  to: string;
  buyerName: string;
  sellerName: string;
  siteTitle: string;
  message: string | null;
  priceCents: number;
  monthlyCents: number | null;
  url: string;
}): Email {
  const seller = escape(sellerName);
  return {
    to,
    subject: `${sellerName} built you a new website`,
    html: layout({
      preview: `Take a look at ${siteTitle} — it's ready to go live.`,
      title: `Your new website is ready`,
      body: `Hi ${first(buyerName)}, <span style="color:#0f0f0f;font-weight:600">${seller}</span> designed a website for <span style="color:#0f0f0f;font-weight:600">${escape(siteTitle)}</span>. Take a look — it's live-ready, and it's yours the moment you buy it.${message ? quote(message) : ""}`,
      button: { label: "See your website", url },
      after: `Price: <span style="color:#0f0f0f">${escape(priceLine(priceCents, monthlyCents))}</span>. Payments are handled securely by Whop.`,
      reason: `You're getting this because ${seller} sent you a website through Octacore.`,
    }),
    text: `Hi ${buyerName.split(" ")[0] || "there"},\n\n${sellerName} designed a website for ${siteTitle}.${message ? `\n\n"${message}"` : ""}\n\nSee it: ${url}\nPrice: ${priceLine(priceCents, monthlyCents)}\n\n— Octacore`,
  };
}

// To the seller: their client opened the invite.
export function saleViewedEmail({ to, name, buyerName, siteTitle }: { to: string; name: string; buyerName: string; siteTitle: string }): Email {
  return {
    to,
    subject: `${buyerName} is looking at ${siteTitle}`,
    html: layout({
      preview: "Your client just opened their website. Good time to follow up.",
      title: `${escape(buyerName)} opened the site`,
      body: `Hi ${first(name)}, ${escape(buyerName)} just opened the website you sent for <span style="color:#0f0f0f;font-weight:600">${escape(siteTitle)}</span>. A quick call now is a great way to close.`,
      button: { label: "See your sales", url: `${ORIGIN}/dashboard/sales` },
      reason: "You're getting this because you sent a site to a client through Octacore.",
    }),
    text: `Hi ${name.split(" ")[0] || "there"},\n\n${buyerName} just opened the website you sent for ${siteTitle}.\n\n${ORIGIN}/dashboard/sales\n\n— Octacore`,
  };
}

// To the seller: paid.
export function saleSoldEmail({
  to,
  name,
  buyerName,
  siteTitle,
  earnedCents,
}: {
  to: string;
  name: string;
  buyerName: string;
  siteTitle: string;
  earnedCents: number;
}): Email {
  return {
    to,
    subject: `Sold: ${siteTitle}`,
    html: layout({
      preview: `${buyerName} bought ${siteTitle}. ${price(earnedCents)} is on its way to you.`,
      title: "You made a sale",
      body: `Hi ${first(name)}, ${escape(buyerName)} just bought <span style="color:#0f0f0f;font-weight:600">${escape(siteTitle)}</span>. <span style="color:#0f0f0f;font-weight:600">${price(earnedCents)}</span> is heading to your Whop balance, after Octacore's 10%.<br><br>The site is theirs now, and you can keep editing it for them from your dashboard.`,
      button: { label: "See your sales", url: `${ORIGIN}/dashboard/sales` },
      after: "Whop's processing fees come out of your share. Withdraw anytime from Settings › Payouts.",
      reason: "You're getting this because a client paid for a site you sold through Octacore.",
    }),
    text: `Hi ${name.split(" ")[0] || "there"},\n\n${buyerName} bought ${siteTitle}. ${price(earnedCents)} is heading to your Whop balance after Octacore's 10%.\n\n${ORIGIN}/dashboard/sales\n\n— Octacore`,
  };
}

// To the client, with a one-click sign-in link: the site is theirs.
export function ownerWelcomeEmail({
  to,
  buyerName,
  sellerName,
  siteTitle,
  url,
  needsHosting,
}: {
  to: string;
  buyerName: string;
  sellerName: string;
  siteTitle: string;
  url: string;
  needsHosting: boolean;
}): Email {
  return {
    to,
    subject: `You own ${siteTitle}`,
    html: layout({
      preview: "Your website is yours. Here's how to see it any time.",
      title: `${escape(siteTitle)} is yours`,
      body: `Hi ${first(buyerName)}, thanks for your purchase. Your website is now registered to you. Open your owner page to see it live, manage billing, or ask ${escape(sellerName)} for changes.${
        needsHosting ? `<br><br><span style="color:#0f0f0f;font-weight:600">One step left:</span> start hosting to put the site online.` : ""
      }`,
      button: { label: "Open your website", url },
      after: "This button signs you in — no password needed. It works for 3 days; after that, sign in at octacore.app/owner with this email.",
      reason: "You're getting this because you bought a website built with Octacore.",
    }),
    text: `Hi ${buyerName.split(" ")[0] || "there"},\n\n${siteTitle} is yours. Open your owner page (signs you in): ${url}\n\n— Octacore`,
  };
}

// To an owner who asked to sign in again.
export function ownerSignInEmail({ to, url }: { to: string; url: string }): Email {
  return {
    to,
    subject: "Your Octacore sign-in link",
    html: layout({
      preview: "One click to see your website.",
      title: "Sign in to your website",
      body: "Click below to open your owner page. No password needed.",
      button: { label: "Sign in", url },
      after: "The link works for 3 days. If you didn't ask for it, you can ignore this email.",
      reason: "You're getting this because someone asked to sign in with this email at octacore.app.",
    }),
    text: `Sign in to your website: ${url}\n\nIf you didn't ask for this, ignore this email.\n\n— Octacore`,
  };
}

// To the seller: their client wants something changed.
export function changeRequestEmail({
  to,
  name,
  buyerName,
  buyerEmail,
  siteTitle,
  request,
  siteId,
}: {
  to: string;
  name: string;
  buyerName: string;
  buyerEmail: string;
  siteTitle: string;
  request: string;
  siteId: string;
}): Email {
  return {
    to,
    subject: `Change request for ${siteTitle}`,
    html: layout({
      preview: `${buyerName}: ${request.slice(0, 80)}`,
      title: "Your client asked for a change",
      body: `Hi ${first(name)}, ${escape(buyerName)} (<a href="mailto:${escape(buyerEmail)}" style="color:#c2410c">${escape(buyerEmail)}</a>) asked for a change to <span style="color:#0f0f0f;font-weight:600">${escape(siteTitle)}</span>:${quote(request)}`,
      button: { label: "Open in the builder", url: `${ORIGIN}/dashboard/sites/${siteId}` },
      after: "Reply to your client directly by email.",
      reason: "You're getting this because a client you sold a site to sent a request through Octacore.",
    }),
    text: `Hi ${name.split(" ")[0] || "there"},\n\n${buyerName} (${buyerEmail}) asked for a change to ${siteTitle}:\n\n"${request}"\n\n${ORIGIN}/dashboard/sites/${siteId}\n\n— Octacore`,
  };
}
