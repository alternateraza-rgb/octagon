// Uploaded images, logos and PDFs. Stored in KV (UPLOADS) and served publicly at /u/<id> under an
// unguessable id, so deployed sites can show them and OpenAI can fetch them. Both endpoints run in
// the Worker entry so file bodies stream straight to and from storage without passing through Next.
import { createAuth } from "@/lib/auth/auth";
import type { Attachment } from "@/lib/attachments";

const TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
  "application/pdf": "pdf",
};
export const UPLOAD_ACCEPT = Object.keys(TYPES).join(",");
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const DAILY_UPLOAD_LIMIT = 100;
// How many files one message or build can carry.
export const MAX_ATTACHMENTS = 8;

const randomId = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(20)), (b) => "abcdefghijkmnpqrstuvwxyz23456789"[b % 32]).join("");

export function routeUploads(request: Request, env: CloudflareEnv) {
  const { pathname } = new URL(request.url);
  if (pathname === "/api/uploads" && request.method === "POST") return upload(request, env);
  const file = pathname.match(/^\/u\/([a-z0-9]+\.[a-z]+)$/);
  if (file && (request.method === "GET" || request.method === "HEAD")) return serve(env, file[1]);
  return null;
}

async function upload(request: Request, env: CloudflareEnv) {
  const session = await createAuth(env).api.getSession({ headers: request.headers });
  if (!session) return Response.json({ error: "Log in to upload files." }, { status: 401 });

  const type = (request.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
  const ext = TYPES[type];
  if (!ext) return Response.json({ error: "Upload a PNG, JPG, WebP, GIF, SVG or PDF." }, { status: 415 });
  const size = Number(request.headers.get("content-length"));
  if (!size || !request.body) return Response.json({ error: "That file is empty." }, { status: 400 });
  if (size > MAX_UPLOAD_BYTES) return Response.json({ error: "Files can be up to 10 MB." }, { status: 413 });

  const since = Date.now() - 24 * 60 * 60 * 1000;
  const count = await env.DB.prepare(`select count(*) as n from upload where userId = ? and createdAt > ?`)
    .bind(session.user.id, since)
    .first<{ n: number }>();
  if ((count?.n ?? 0) >= DAILY_UPLOAD_LIMIT) return Response.json({ error: "You've hit today's upload limit." }, { status: 429 });

  let name = "file";
  try {
    name = decodeURIComponent(request.headers.get("x-file-name") ?? "file");
  } catch {}
  name = name.replace(/[\u0000-\u001f]/g, "").trim().slice(0, 120) || "file";

  const id = `${randomId()}.${ext}`;
  // Links always use the main domain over HTTPS, so they work from every deployed site.
  const { hostname, origin } = new URL(request.url);
  const base = hostname === env.SITES_DOMAIN || hostname.endsWith(`.${env.SITES_DOMAIN}`) ? `https://${env.SITES_DOMAIN}` : origin;
  const url = `${base}/u/${id}`;
  await env.UPLOADS.put(id, request.body, { metadata: { type } });
  await env.DB.prepare(`insert into upload (id, userId, name, type, size, url, createdAt) values (?, ?, ?, ?, ?, ?, ?)`)
    .bind(id, session.user.id, name, type, size, url, Date.now())
    .run();
  return Response.json({ id, url, name, type } satisfies Attachment);
}

async function serve(env: CloudflareEnv, id: string) {
  const { value, metadata } = await env.UPLOADS.getWithMetadata<{ type: string }>(id, { type: "stream", cacheTtl: 86400 });
  if (!value) return new Response("Not found", { status: 404 });
  return new Response(value, {
    headers: {
      "content-type": metadata?.type ?? "application/octet-stream",
      "cache-control": "public, max-age=31536000, immutable",
      "access-control-allow-origin": "*",
      "x-content-type-options": "nosniff",
      // Uploaded SVGs could carry scripts; never let them run as a page.
      "content-security-policy": "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; sandbox",
    },
  });
}

// Turns attachment ids from a request into the caller's own uploads, dropping anything else.
export async function resolveAttachments(db: D1Database, userId: string, ids: unknown): Promise<Attachment[]> {
  if (!Array.isArray(ids)) return [];
  const wanted = [...new Set(ids.filter((id): id is string => typeof id === "string"))].slice(0, MAX_ATTACHMENTS);
  if (!wanted.length) return [];
  const { results } = await db
    .prepare(`select id, url, name, type from upload where userId = ? and id in (${wanted.map(() => "?").join(",")})`)
    .bind(userId, ...wanted)
    .all<Attachment>();
  return wanted.map((id) => results.find((r) => r.id === id)).filter((a): a is Attachment => !!a);
}
