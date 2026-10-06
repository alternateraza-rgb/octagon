// The last 30 turns, alternating roles, ending with the user.
export function parseMessages(value: unknown) {
  if (!Array.isArray(value)) return null;
  const messages = value
    .filter(
      (m): m is { role: "user" | "assistant"; content: string } =>
        !!m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim().length > 0,
    )
    .slice(-30)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));
  if (!messages.length || messages[messages.length - 1].role !== "user") return null;
  return messages;
}
