export type InputContent =
  | { type: "input_text"; text: string }
  | { type: "input_image"; image_url: string; detail: "auto" }
  | { type: "input_file"; file_url: string };
export type InputMessage = { role: "user" | "assistant"; content: string | InputContent[] };

// Starts a streamed OpenAI Responses call and returns its raw server-sent-event stream.
// The Worker hands this body to the browser untouched: Cloudflare pipes it natively, while
// parsing a full site build's ~4,000 events in the Worker costs more CPU than a request gets.
export async function openaiStream(
  env: CloudflareEnv,
  { model, instructions, input }: { model: string; instructions: string; input: string | InputMessage[] },
) {
  if (!env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");
  const res = await fetch(`${env.OPENAI_BASE_URL}/responses`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${env.OPENAI_API_KEY}` },
    body: JSON.stringify({ model, instructions, input, reasoning: { effort: "low" }, stream: true }),
  });
  if (!res.ok || !res.body) {
    const body = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
    throw new Error(body?.error?.message ?? `OpenAI request failed (${res.status})`);
  }
  return res.body;
}

export function eventStreamResponse(body: ReadableStream<Uint8Array>, headers?: HeadersInit) {
  return new Response(body, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-store, no-transform",
      // Compression would hold events back until the reply is finished.
      "content-encoding": "identity",
      ...headers,
    },
  });
}

// One short, non-streamed completion; returns its text. Used for small helpers like follow-up ideas.
export async function completeText(
  env: CloudflareEnv,
  { model, instructions, input }: { model: string; instructions: string; input: string | InputMessage[] },
) {
  const res = await fetch(`${env.OPENAI_BASE_URL}/responses`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${env.OPENAI_API_KEY}` },
    body: JSON.stringify({ model, instructions, input, reasoning: { effort: "low" } }),
  });
  const body = (await res.json().catch(() => null)) as {
    output?: { type: string; content?: { type: string; text?: string }[] }[];
    error?: { message?: string };
  } | null;
  if (!res.ok || !body) throw new Error(body?.error?.message ?? `OpenAI request failed (${res.status})`);
  return (body.output ?? [])
    .filter((o) => o.type === "message")
    .flatMap((o) => o.content ?? [])
    .map((c) => c.text ?? "")
    .join("");
}
