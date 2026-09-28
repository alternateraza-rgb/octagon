// Minimal Cloudflare for SaaS client: the custom hostname calls custom domains need.
const API = "https://api.cloudflare.com/client/v4";

export type CustomHostname = {
  id: string;
  hostname: string;
  // active, pending, moved, blocked, …
  status: string;
  ssl?: {
    status?: string;
    validation_records?: { txt_name?: string; txt_value?: string }[];
    validation_errors?: { message?: string }[];
  } | null;
  ownership_verification?: { type?: string; name?: string; value?: string } | null;
  verification_errors?: string[] | null;
};

export class CloudflareError extends Error {
  constructor(
    message: string,
    // Cloudflare's HTTP status (0 when the request never reached Cloudflare) and its own explanation.
    readonly status = 0,
    readonly cloudflareMessage = "",
  ) {
    super(message);
  }
}

// The human-readable part of a Cloudflare error body: `{ errors: [{ message }] }`.
function readCloudflareMessage(body: string) {
  try {
    const json = JSON.parse(body) as { errors?: { message?: string }[] };
    return (json.errors ?? [])
      .map((e) => e.message)
      .filter(Boolean)
      .join(" ")
      .trim()
      .slice(0, 300);
  } catch {
    return body.trim().slice(0, 300);
  }
}

async function cf<T>(env: CloudflareEnv, path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  if (!env.CF_API_TOKEN || !env.CF_ZONE_ID) throw new CloudflareError("CF_API_TOKEN or CF_ZONE_ID is not set");
  const res = await fetch(`${API}/zones/${env.CF_ZONE_ID}${path}`, {
    method: init.method ?? "GET",
    headers: { authorization: `Bearer ${env.CF_API_TOKEN}`, "content-type": "application/json" },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new CloudflareError(
      `Cloudflare ${init.method ?? "GET"} ${path} failed: ${res.status} ${body}`,
      res.status,
      readCloudflareMessage(body),
    );
  }
  const json = (await res.json()) as { result: T };
  return json.result;
}

// Cloudflare validates the domain over HTTP once its CNAME points at us, then issues its certificate.
export function createCustomHostname(env: CloudflareEnv, hostname: string) {
  return cf<CustomHostname>(env, "/custom_hostnames", {
    method: "POST",
    body: { hostname, ssl: { method: "http", type: "dv", settings: { min_tls_version: "1.2" } } },
  });
}

export function getCustomHostname(env: CloudflareEnv, id: string) {
  return cf<CustomHostname>(env, `/custom_hostnames/${id}`);
}

export async function deleteCustomHostname(env: CloudflareEnv, id: string) {
  try {
    await cf(env, `/custom_hostnames/${id}`, { method: "DELETE" });
  } catch (error) {
    // Already gone is fine.
    if (!(error instanceof CloudflareError && error.status === 404)) throw error;
  }
}
