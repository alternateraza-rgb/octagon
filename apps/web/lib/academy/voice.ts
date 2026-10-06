// ElevenLabs Agents: the Coach and the practice prospect talk through ElevenLabs. The browser gets a
// short-lived signed URL from here, so the API key never leaves the Worker. Prompts are sent as
// overrides when the session starts (both agents must allow prompt and first-message overrides).
export type VoiceKind = "coach" | "prospect";

const agentId = (env: CloudflareEnv, kind: VoiceKind) =>
  kind === "coach" ? env.ELEVENLABS_COACH_AGENT_ID : env.ELEVENLABS_PROSPECT_AGENT_ID;

export const voiceEnabled = (env: CloudflareEnv, kind: VoiceKind) => !!(env.ELEVENLABS_API_KEY && agentId(env, kind));

export async function signedUrl(env: CloudflareEnv, kind: VoiceKind) {
  const res = await fetch(
    `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${encodeURIComponent(agentId(env, kind)!)}`,
    { headers: { "xi-api-key": env.ELEVENLABS_API_KEY! } },
  );
  const body = (await res.json().catch(() => null)) as { signed_url?: string; detail?: { message?: string } | string } | null;
  if (!res.ok || !body?.signed_url) {
    const detail = typeof body?.detail === "string" ? body.detail : body?.detail?.message;
    throw new Error(detail ?? `ElevenLabs request failed (${res.status})`);
  }
  return body.signed_url;
}
