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
