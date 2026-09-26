const INSTRUCTIONS = `You are Octacore's website builder. Turn the user's description into a complete, production-quality single-page website for that business.

Output only one HTML document, starting with <!doctype html>. No markdown fences, no commentary.
- Everything inline: one <style> block, and a <script> only if it earns its place. No external CSS or JS frameworks. Google Fonts <link>s are allowed.
- Real, specific copy written for this business: name, hero, services or menu, about, testimonials, contact, footer. Never lorem ipsum.
- Images: only https://picsum.photos/seed/<one-word-seed>/<width>/<height>, with descriptive alt text.
- Premium, modern design: strong typography, generous whitespace, a restrained palette that fits the business. Responsive from 375px to 1440px with no horizontal scroll.
- Semantic, accessible HTML. Put the business name in <title>.`;

type ResponsesOutput = {
  output?: { type: string; content?: { type: string; text?: string }[] }[];
  error?: { message?: string };
};

export async function generateSiteHtml(env: CloudflareEnv, prompt: string) {
  if (!env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");
  const res = await fetch(`${env.OPENAI_BASE_URL}/responses`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${env.OPENAI_API_KEY}` },
    body: JSON.stringify({
      model: env.OPENAI_MODEL,
      reasoning: { effort: "low" },
      instructions: INSTRUCTIONS,
      input: prompt,
    }),
  });
  const body = (await res.json()) as ResponsesOutput;
  if (!res.ok) throw new Error(body.error?.message ?? `OpenAI request failed (${res.status})`);

  const text = (body.output ?? [])
    .filter((item) => item.type === "message")
    .flatMap((item) => item.content ?? [])
    .filter((part) => part.type === "output_text")
    .map((part) => part.text ?? "")
    .join("");
  // Models occasionally wrap the page in a fence despite the instructions.
  const html = text.replace(/^\s*```(?:html)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
  if (!/<html[\s>]/i.test(html)) throw new Error("The model didn't return a web page");

  const title = html.match(/<title>([^<]*)<\/title>/i)?.[1]?.trim() || null;
  return { html, title };
}
