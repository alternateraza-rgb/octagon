import { readNote } from "./octa-note";
import type { Attachment } from "@/lib/attachments";

const NOTE = `Start your output with a short note to the user, exactly in this form, then the page:
<!-- octa
summary: <1–3 warm, specific sentences in first person about what you built or changed and why it suits the business. No markdown.>
next: <three short follow-up edits they might want, separated by " | ", e.g. Add online booking | Make the hero darker | Add a price list>
-->`;

const RULES = `After the note, output one complete HTML document, starting with <!doctype html>. No markdown fences, no other commentary.
- Everything inline: one <style> block, and a <script> only if it earns its place. No external CSS or JS frameworks. Google Fonts <link>s are allowed.
- Real, specific copy written for this business. Never lorem ipsum.
- Images: use plenty of photos. Apart from files the user uploaded, use only this form: /img?q=<search>&w=<width>&h=<height> (root-relative, exactly as written). <search> is a specific 2–6 word stock-photo search for what that image should show, written for this business and section (e.g. "barber giving skin fade", "barbershop interior leather chairs", "fresh croissants on bakery counter"), URL-encoded. To get different photos for the same search add &n=1, &n=2 and so on. Stock photos can't show real people, celebrities, film characters or brands, so when asked for those use a fitting generic scene instead. Also usable as CSS background-image urls. Always write descriptive alt text.
- Premium, modern design: strong typography, generous whitespace, a restrained palette that fits the business. Responsive from 375px to 1440px with no horizontal scroll.
- Semantic, accessible HTML. Put the business name in <title>.`;

export const CREATE_INSTRUCTIONS = `You are Octacore's website builder. Turn the user's description into a complete, production-quality single-page website for that business: hero, services or menu, about, testimonials, contact and footer.

${NOTE}

${RULES}`;

export const EDIT_INSTRUCTIONS = `You are Octacore's website builder. You will get the current HTML of a website and a change request. Apply the change and return the full updated page. Keep everything the request doesn't mention exactly as it is.

${NOTE}

${RULES}`;

// Tells the model which uploaded files to place in the page, by their exact links.
function uploadsNote(attachments: Attachment[]) {
  if (!attachments.length) return "";
  const lines = attachments.map((a) => `- ${a.url} (${a.name}, ${a.type})`).join("\n");
  return `\n\nThe user uploaded these files. Use them in the page with these exact URLs, in place of stock photos where they fit (a logo belongs in the header and footer; link PDFs rather than embedding them):\n${lines}`;
}

export function createInput(prompt: string, attachments: Attachment[]) {
  return `${prompt}${uploadsNote(attachments)}`;
}

export function editInput(html: string, instruction: string, attachments: Attachment[] = []) {
  return `Change request:\n${instruction}${uploadsNote(attachments)}\n\nCurrent page:\n${html}`;
}

export function cleanHtml(text: string) {
  const note = readNote(text);
  // Models occasionally wrap the page in a fence despite the instructions.
  const html = note.html
    .replace(/^\s*```(?:html)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();
  if (!/<html[\s>]/i.test(html)) throw new Error("The model didn't return a web page");
  const title = html.match(/<title>([^<]*)<\/title>/i)?.[1]?.trim() || null;
  return { html, title, summary: note.summary || null, next: note.next };
}
