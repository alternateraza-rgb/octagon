export type InputMessage = { role: "user" | "assistant"; content: string };

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
