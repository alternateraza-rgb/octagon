// Sends email through Resend's HTTP API from the verified octacore.app domain.
// `from` overrides the sender name; it must stay on the verified octacore.app domain.
export type Email = { to: string; subject: string; html: string; text: string; from?: string };

const FROM = "Octacore <hello@octacore.app>";

export async function sendEmail(env: CloudflareEnv, email: Email) {
  if (!env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY is not set; email not sent:", email.subject);
    return false;
  }
  // Never throws: a failed send mustn't break sign-up or stop the emails queued after it.
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({ ...email, from: email.from ?? FROM }),
    });
    if (!res.ok) console.error("Resend rejected email", res.status, await res.text().catch(() => ""));
    return res.ok;
  } catch (err) {
    console.error("Email send failed:", email.subject, err);
    return false;
  }
}
