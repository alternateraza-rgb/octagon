// Every build starts with a short note from Octa, before the page itself:
//
//   <!-- octa
//   summary: Built a bold, playful site for Barber Boys with …
//   next: Add online booking | Make the hero darker | Add a price list
//   -->
//   <!doctype html>…
//
// Shared by the browser (to show the note while the page is still being written) and the server.
export type OctaNote = { summary: string; next: string[] };

export function readNote(text: string): OctaNote & { complete: boolean; html: string } {
  const trimmed = text.trimStart();
  if (!trimmed.startsWith("<!--")) {
    // No note (older prompt, or the model skipped it) once it's clearly writing the page.
    const writingPage = trimmed.length > 4 && !"<!--".startsWith(trimmed.slice(0, 4));
    return { summary: "", next: [], complete: writingPage, html: trimmed };
  }
  const end = trimmed.indexOf("-->");
  const body = end === -1 ? trimmed.slice(4) : trimmed.slice(4, end);
  const summary = body.match(/summary:\s*([\s\S]*?)(?:\n\s*next:|$)/i)?.[1]?.trim() ?? "";
  const nextLine = body.match(/next:\s*(.*)/i)?.[1] ?? "";
  const next =
    end === -1
      ? []
      : nextLine
          .split("|")
          .map((s) => s.trim())
          .filter(Boolean)
          .slice(0, 3);
  return { summary, next, complete: end !== -1, html: end === -1 ? "" : trimmed.slice(end + 3).trimStart() };
}
