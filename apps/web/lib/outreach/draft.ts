// The emails in a sequence: written by the model from the business's real details, and wrapped in a
// plain footer with the sender's mailing address and an unsubscribe link (CAN-SPAM, CASL).
import { completeText } from "@/lib/ai/openai";
import { getBusiness } from "@/lib/agents/business";
import type { Lead } from "@/lib/agents/store";
import type { OutreachSettings } from "./store";

export type Draft = { subject: string; body: string };

const INSTRUCTIONS = `You write short cold emails from a local web designer to a small business that has great Google reviews but no website.
Write exactly the number of emails asked for: the first email, then follow-ups that are replies in the same thread.
Rules:
- Plain, warm, specific. Sound like one person writing to another, not marketing. No exclamation marks, no emojis, no hype words ("revolutionize", "skyrocket", "game-changer").
- First email: 70–110 words. Mention one specific thing customers praise in their reviews (only if given), that they don't have a website, and the offer. If a website link is given, say you already made them one and include the link on its own line. End with one easy question.
- Follow-ups: 25–50 words each, a gentle nudge with a different angle; never guilt-trip.
- Only use facts given. Never invent prices, results, statistics or reviews.
- Greet with "Hi" and the business name or "there". Sign off with the sender's first name only. Don't add a footer, address or unsubscribe line.
- Subject for the first email: under 7 words, lowercase except names, no clickbait. Follow-ups use "Re: " + the first subject.
Reply with JSON only: {"emails":[{"subject":"...","body":"..."}]}`;

async function liveUrl(env: CloudflareEnv, siteId: string | null) {
  if (!siteId) return null;
  const site = await env.DB.prepare(`select slug, deployedVersionId from site where id = ?`)
    .bind(siteId)
    .first<{ slug: string | null; deployedVersionId: string | null }>();
  return site?.slug && site.deployedVersionId ? `https://${site.slug}.${env.SITES_DOMAIN}` : null;
}

export async function draftEmails(env: CloudflareEnv, lead: Lead, settings: OutreachSettings, count: number): Promise<Draft[]> {
  const business = await getBusiness(env.DB, lead.placeId);
  const praise = [
    ...(business?.reviews ?? []).filter((r) => (r.rating ?? 0) >= 4).map((r) => r.text?.text ?? ""),
    lead.snippet ?? "",
  ]
    .map((t) => t.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .slice(0, 3)
    .map((t) => `- "${t.slice(0, 240)}"`);
  const url = await liveUrl(env, lead.siteId);
  const facts = [
    `Business: ${lead.name}${lead.category ? ` (${lead.category})` : ""}${lead.city ? ` in ${lead.city}` : ""}`,
    lead.rating ? `Google rating: ${lead.rating.toFixed(1)} from ${lead.reviewCount} reviews` : "",
    lead.webPresence === "social" ? "They only have a social media page, no website." : "They have no website.",
    praise.length ? `What customers say:\n${praise.join("\n")}` : "",
    `Offer: ${settings.offer}`,
    url ? `Website already made for them: ${url}` : "",
    `Sender: ${settings.senderName}`,
    `Write ${count} email${count === 1 ? "" : "s"}.`,
  ];
  const text = await completeText(env, { model: env.OPENAI_FAST_MODEL, instructions: INSTRUCTIONS, input: facts.filter(Boolean).join("\n") });
  const json = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
  const parsed = JSON.parse(json) as { emails?: Draft[] };
  const emails = (parsed.emails ?? [])
    .filter((e) => typeof e?.subject === "string" && typeof e?.body === "string" && e.body.trim())
    .slice(0, count)
    .map((e) => ({ subject: e.subject.trim().slice(0, 150), body: e.body.trim().slice(0, 4000) }));
  if (!emails.length) throw new Error("The draft came back empty.");
  return emails;
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

// Plain-looking HTML: paragraphs and links, nothing that reads as a newsletter.
export function emailHtml(body: string, footer: { mailingAddress: string; unsubscribeUrl: string } | null) {
  const paragraphs = esc(body)
    .split(/\n{2,}/)
    .map((p) => p.replace(/\n/g, "<br>").replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1">$1</a>'))
    .map((p) => `<p style="margin:0 0 14px">${p}</p>`)
    .join("");
  const foot = footer
    ? `<p style="margin:24px 0 0;font-size:12px;color:#86868b">${esc(footer.mailingAddress)}<br>` +
      `Not interested? <a href="${esc(footer.unsubscribeUrl)}" style="color:#86868b">Unsubscribe</a></p>`
    : "";
  return `<div style="font-family:-apple-system,Segoe UI,Arial,sans-serif;font-size:15px;line-height:1.5;color:#1d1d1f">${paragraphs}${foot}</div>`;
}

export const unsubscribeUrl = (origin: string, token: string) => `${origin}/u/${token}`;
