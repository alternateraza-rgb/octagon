// Relevant stock photos for generated sites. The builder writes images as searches, e.g.
// <img src="/img?q=barber giving a skin fade&w=800&h=600">, and this endpoint redirects to a
// matching Pexels photo (free to use commercially) cropped to size. Search results are cached
// in KV so each distinct query costs one Pexels request.

type Photo = { src: string };
type PexelsResponse = { photos?: { src: { original: string } }[] };

const clamp = (value: string | null, fallback: number) => Math.min(2400, Math.max(64, Number(value) || fallback));

function orientation(w: number, h: number) {
  if (w > h * 1.15) return "landscape";
  if (h > w * 1.15) return "portrait";
  return "square";
}

async function search(env: CloudflareEnv, query: string, shape: string) {
  const key = `img:v1:${shape}:${query}`;
  const cached = await env.SITES.get<Photo[]>(key, { type: "json", cacheTtl: 3600 });
  if (cached) return cached;

  const url = `https://api.pexels.com/v1/search?${new URLSearchParams({ query, orientation: shape, per_page: "15" })}`;
  const res = await fetch(url, { headers: { authorization: env.PEXELS_API_KEY } });
  if (!res.ok) {
    console.error("Pexels search failed", res.status, query);
    return [];
  }
  const photos = ((await res.json()) as PexelsResponse).photos?.map((p) => ({ src: p.src.original })) ?? [];
  // Keep empty results briefly so a typo'd query doesn't hit Pexels on every page view.
  await env.SITES.put(key, JSON.stringify(photos), { expirationTtl: photos.length ? 60 * 60 * 24 * 30 : 60 * 60 * 24 });
  return photos;
}

export async function serveImage(request: Request, env: CloudflareEnv) {
  const params = new URL(request.url).searchParams;
  const query = (params.get("q") ?? "").trim().toLowerCase().replace(/\s+/g, " ").slice(0, 100);
  const w = clamp(params.get("w"), 1200);
  const h = clamp(params.get("h"), 800);
  const n = Math.max(0, Math.floor(Number(params.get("n")) || 0));

  let target = `https://picsum.photos/seed/${encodeURIComponent(query || "octacore")}/${w}/${h}`;
  if (query && env.PEXELS_API_KEY) {
    const photos = await search(env, query, orientation(w, h));
    if (photos.length) {
      const photo = photos[n % photos.length];
      target = `${photo.src}?${new URLSearchParams({ auto: "compress", cs: "tinysrgb", fit: "crop", w: String(w), h: String(h) })}`;
    }
  }
  return new Response(null, {
    status: 302,
    headers: { location: target, "cache-control": "public, max-age=86400", "access-control-allow-origin": "*" },
  });
}
