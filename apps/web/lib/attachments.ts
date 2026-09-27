// Shared by server and browser code (no server-only imports here).
export type Attachment = { id: string; url: string; name: string; type: string };

export function parseAttachments(json: string | null | undefined): Attachment[] {
  if (!json) return [];
  try {
    return JSON.parse(json) as Attachment[];
  } catch {
    return [];
  }
}
