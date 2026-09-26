// Reads a text stream from our API routes. The server appends "\0ERROR" when generation fails midway.
export async function readTextStream(res: Response, onText: (text: string) => void) {
  const reader = res.body!.pipeThrough(new TextDecoderStream()).getReader();
  let text = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    text += value;
    onText(text.split("\n\u0000ERROR")[0]);
  }
  const failed = text.includes("\u0000ERROR");
  return { text: text.split("\n\u0000ERROR")[0], failed };
}
