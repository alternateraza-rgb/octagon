// Mailbox tokens at rest: AES-GCM with a key derived from BETTER_AUTH_SECRET, so a copy of the
// database alone can't send email as anyone.
const encoder = new TextEncoder();

async function key(env: CloudflareEnv) {
  const raw = await crypto.subtle.digest("SHA-256", encoder.encode(`octacore:mailbox:${env.BETTER_AUTH_SECRET}`));
  return crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]);
}

const b64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

export async function seal(env: CloudflareEnv, plain: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await key(env), encoder.encode(plain)));
  return `${b64(iv)}.${b64(data)}`;
}

export async function unseal(env: CloudflareEnv, sealed: string) {
  const [iv, data] = sealed.split(".");
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(iv) }, await key(env), unb64(data));
  return new TextDecoder().decode(plain);
}

// A random token for links (unsubscribe, OAuth state).
export function token(bytes = 24) {
  return b64(crypto.getRandomValues(new Uint8Array(bytes))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
