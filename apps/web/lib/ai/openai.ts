export type InputMessage = { role: "user" | "assistant"; content: string };

type StreamEvent = {
  type: string;
  delta?: string;
  message?: string;
  response?: { error?: { message?: string } | null };
};

// Streams text from the OpenAI Responses API. Yields text deltas as they arrive.
export async function* streamText(
  env: CloudflareEnv,
  { model, instructions, input, signal }: { model: string; instructions: string; input: string | InputMessage[]; signal?: AbortSignal },
) {
  if (!env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");
  const res = await fetch(`${env.OPENAI_BASE_URL}/responses`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${env.OPENAI_API_KEY}` },
    body: JSON.stringify({ model, instructions, input, reasoning: { effort: "low" }, stream: true }),
    signal,
  });
  if (!res.ok || !res.body) {
    const body = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
    throw new Error(body?.error?.message ?? `OpenAI request failed (${res.status})`);
  }

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += value;
    // Server-sent events are separated by a blank line; we only need the data lines.
    let boundary;
    while ((boundary = buffer.indexOf("\n\n")) !== -1) {
      const chunk = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      for (const line of chunk.split("\n")) {
        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trim();
        if (!data || data === "[DONE]") continue;
        const event = JSON.parse(data) as StreamEvent;
        if (event.type === "response.output_text.delta" && event.delta) yield event.delta;
        else if (event.type === "response.failed") throw new Error(event.response?.error?.message ?? "OpenAI response failed");
        else if (event.type === "error") throw new Error(event.message ?? "OpenAI stream error");
      }
    }
  }
}

// Pipes a generator into a text Response for the browser, and runs `onDone` with the full text
// even if the browser disconnects, so a finished generation is never lost.
export function streamToResponse(
  ctx: { waitUntil(promise: Promise<unknown>): void },
  source: AsyncGenerator<string>,
  { onDone, onError, headers }: {
    onDone: (text: string) => Promise<unknown>;
    onError: (error: unknown) => Promise<unknown>;
    headers?: HeadersInit;
  },
) {
  const { readable, writable } = new TransformStream<string, string>();
  const writer = writable.getWriter();
  let clientGone = false;
  const write = (text: string) => {
    if (clientGone) return;
    writer.write(text).catch(() => (clientGone = true));
  };

  ctx.waitUntil(
    (async () => {
      let text = "";
      try {
        for await (const delta of source) {
          text += delta;
          write(delta);
        }
        await onDone(text);
      } catch (error) {
        console.error("Generation failed", error);
        await onError(error);
        // A marker the client can detect after the partial text.
        write("\n\u0000ERROR");
      } finally {
        writer.close().catch(() => {});
      }
    })(),
  );

  return new Response(readable.pipeThrough(new TextEncoderStream()), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store, no-transform",
      // Compression would hold chunks back until the reply is finished.
      "content-encoding": "identity",
      ...headers,
    },
  });
}
