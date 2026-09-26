// Browser side: reads OpenAI's streamed Responses events (relayed by our API) and reports the
// text so far. Throws if the model fails or stops early.
type StreamEvent = {
  type: string;
  delta?: string;
  message?: string;
  response?: { error?: { message?: string } | null; incomplete_details?: { reason?: string } | null };
};

export async function readModelText(res: Response, onText: (text: string) => void) {
  const reader = res.body!.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  let text = "";
  let completed = false;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += value;
    let changed = false;
    let boundary;
    // Server-sent events are separated by a blank line; only the data lines matter.
    while ((boundary = buffer.indexOf("\n\n")) !== -1) {
      const chunk = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      for (const line of chunk.split("\n")) {
        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trim();
        if (!data || data === "[DONE]") continue;
        const event = JSON.parse(data) as StreamEvent;
        if (event.type === "response.output_text.delta" && event.delta) {
          text += event.delta;
          changed = true;
        } else if (event.type === "response.completed") completed = true;
        else if (event.type === "response.failed") throw new Error(event.response?.error?.message ?? "The model failed");
        else if (event.type === "response.incomplete")
          throw new Error(`The model stopped early (${event.response?.incomplete_details?.reason ?? "unknown reason"})`);
        else if (event.type === "error") throw new Error(event.message ?? "The model failed");
      }
    }
    if (changed) onText(text);
  }
  if (!completed) throw new Error("The connection dropped before the reply finished");
  return text;
}
