// Outlook through Microsoft Graph: sign-in (OAuth 2.0 with the "common" endpoint, so both personal
// Outlook.com accounts and Microsoft 365 work accounts can connect), sending, and reading the replies
// in a sent email's conversation. Every Graph call asks for immutable IDs, so a message keeps its ID
// after it moves from Drafts to Sent Items.
const AUTH = "https://login.microsoftonline.com/common/oauth2/v2.0";
const GRAPH = "https://graph.microsoft.com/v1.0";
export const MICROSOFT_SCOPES = ["openid", "email", "profile", "offline_access", "User.Read", "Mail.Send", "Mail.ReadWrite"];

export const microsoftEnabled = (env: CloudflareEnv) => !!(env.MICROSOFT_CLIENT_ID && env.MICROSOFT_CLIENT_SECRET);

export class MailboxError extends Error {
  constructor(
    message: string,
    // The tokens no longer work: the user has to connect again.
    readonly reconnect = false,
  ) {
    super(message);
  }
}

export const redirectUri = (origin: string) => `${origin}/api/agents/mailbox/microsoft/callback`;

export function authUrl(env: CloudflareEnv, origin: string, state: string) {
  const params = new URLSearchParams({
    client_id: env.MICROSOFT_CLIENT_ID!,
    response_type: "code",
    redirect_uri: redirectUri(origin),
    response_mode: "query",
    scope: MICROSOFT_SCOPES.join(" "),
    state,
    prompt: "select_account",
  });
  return `${AUTH}/authorize?${params}`;
}

export type Tokens = { accessToken: string; refreshToken: string; expiresAt: number };

async function tokenRequest(env: CloudflareEnv, body: Record<string, string>): Promise<Tokens> {
  const res = await fetch(`${AUTH}/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.MICROSOFT_CLIENT_ID!,
      client_secret: env.MICROSOFT_CLIENT_SECRET!,
      scope: MICROSOFT_SCOPES.join(" "),
      ...body,
    }),
  });
  const json = (await res.json().catch(() => null)) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  } | null;
  if (!res.ok || !json?.access_token || !json.refresh_token) {
    console.error("Microsoft token request failed", res.status, json?.error, json?.error_description?.slice(0, 200));
    const revoked = json?.error === "invalid_grant" || json?.error === "interaction_required";
    throw new MailboxError(revoked ? "Outlook needs to be connected again." : "Couldn't reach Outlook. Try again.", revoked);
  }
  return { accessToken: json.access_token, refreshToken: json.refresh_token, expiresAt: Date.now() + (json.expires_in ?? 3600) * 1000 };
}

export const exchangeCode = (env: CloudflareEnv, origin: string, code: string) =>
  tokenRequest(env, { grant_type: "authorization_code", code, redirect_uri: redirectUri(origin) });

export const refreshTokens = (env: CloudflareEnv, refreshToken: string) =>
  tokenRequest(env, { grant_type: "refresh_token", refresh_token: refreshToken });

async function graph<T>(accessToken: string, path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${GRAPH}${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
      prefer: 'IdType="ImmutableId"',
      ...init.headers,
    },
  });
  if (res.status === 202 || res.status === 204) return undefined as T;
  const json = (await res.json().catch(() => null)) as (T & { error?: { code?: string; message?: string } }) | null;
  if (!res.ok) {
    const code = json?.error?.code ?? "";
    console.error("Graph request failed", res.status, path.split("?")[0], code, json?.error?.message?.slice(0, 200));
    if (res.status === 401) throw new MailboxError("Outlook needs to be connected again.", true);
    if (code === "ErrorAccessDenied" || code === "MailboxNotEnabledForRESTAPI") {
      throw new MailboxError("This Outlook account can't send through Octacore. Try a different account.", true);
    }
    if (code === "ErrorQuotaExceeded" || res.status === 429) throw new MailboxError("Outlook is limiting how fast emails go out. Octa will retry.");
    throw new MailboxError("Outlook didn't accept that email. Octa will retry.");
  }
  return json as T;
}

export async function me(accessToken: string) {
  const user = await graph<{ mail?: string | null; userPrincipalName?: string; displayName?: string }>(
    accessToken,
    "/me?$select=mail,userPrincipalName,displayName",
  );
  return { email: (user.mail || user.userPrincipalName || "").toLowerCase(), name: user.displayName ?? null };
}

// A new email: created as a draft (so its IDs are known), then sent.
export async function sendNew(accessToken: string, mail: { to: string; subject: string; html: string }) {
  const draft = await graph<{ id: string; conversationId: string }>(accessToken, "/me/messages", {
    method: "POST",
    body: JSON.stringify({
      subject: mail.subject,
      body: { contentType: "HTML", content: mail.html },
      toRecipients: [{ emailAddress: { address: mail.to } }],
    }),
  });
  await graph(accessToken, `/me/messages/${encodeURIComponent(draft.id)}/send`, { method: "POST" });
  return draft;
}

// A follow-up in the same thread, above the quoted earlier email.
export async function sendReply(accessToken: string, messageId: string, html: string) {
  await graph(accessToken, `/me/messages/${encodeURIComponent(messageId)}/reply`, {
    method: "POST",
    body: JSON.stringify({ comment: html }),
  });
}

// Who has written in a conversation since a time: a reply from the business, or a bounce.
export async function conversationSince(accessToken: string, conversationId: string, since: number) {
  // Graph rejects conversationId combined with a date filter, so the date is checked here.
  const filter = `conversationId eq '${conversationId.replace(/'/g, "''")}'`;
  const res = await graph<{
    value: { from?: { emailAddress?: { address?: string; name?: string } }; subject?: string; receivedDateTime?: string }[];
  }>(accessToken, `/me/messages?$filter=${encodeURIComponent(filter)}&$select=from,subject,receivedDateTime&$top=50`);
  return res.value
    .filter((m) => !m.receivedDateTime || Date.parse(m.receivedDateTime) >= since)
    .map((m) => ({
    from: (m.from?.emailAddress?.address ?? "").toLowerCase(),
    name: m.from?.emailAddress?.name ?? "",
    subject: m.subject ?? "",
  }));
}
