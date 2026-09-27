import type { Attachment } from "@/lib/attachments";
import type { InputContent, InputMessage } from "./openai";

// A user turn for the Responses API: text plus the images (the model sees them) and PDFs (it reads
// them). SVGs aren't accepted as image input, so they're only described by their link.
export function userMessage(text: string, attachments: Attachment[]): InputMessage {
  if (!attachments.length) return { role: "user", content: text };
  const files = attachments.flatMap((a): InputContent[] => {
    if (a.type === "application/pdf") return [{ type: "input_file", file_url: a.url }];
    if (a.type === "image/svg+xml") return [];
    return [{ type: "input_image", image_url: a.url, detail: "auto" }];
  });
  return { role: "user", content: [{ type: "input_text", text }, ...files] };
}
