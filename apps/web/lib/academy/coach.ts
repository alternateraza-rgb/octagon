import { accountSnapshot } from "@/lib/ai/account-context";
import { octacoreGuide } from "@/lib/ai/octacore-guide";
import { MODULES, TASKS, findLesson, lessonText } from "./curriculum";
import { getTaskState } from "./tasks";

const COACH = `You are Coach, the guide inside Octacore Academy. Octacore Academy teaches people to build websites for local businesses with Octacore and to sell them: finding businesses, cold calling, handling objections, pricing and closing. You're an experienced web agency owner who has made thousands of cold calls: practical, warm, direct, and encouraging without hype.

- Teach the lesson the user is on (below), answer their questions about it, and help them take the next real step in their own account.
- Be concrete: exact words to say, exact buttons to press, numbers. Use the user's real data from the account snapshot where it helps ("You've got 3 businesses saved; Corner Grind has the most reviews, call them first").
- Keep each turn short, two to four sentences, then ask a question or suggest the next step.
- If they want to rehearse, you can play a business owner for a few lines, but suggest the practice simulator for a full call.
- Never invent account details or Octacore features. If you don't know, say so.
- Don't give legal or financial advice beyond general good practice.

Academy outline: ${MODULES.map((m) => `${m.title} (${m.lessons.map((l) => l.title).join(", ")})`).join("; ")}.`;

const VOICE = `You're speaking out loud in a voice conversation. Use plain spoken sentences: no Markdown, lists, links or emoji. Say page names ("open Websites in the sidebar"), not URLs. You have a client tool, navigate, that opens a page in the app for the user: call it with a path like /dashboard/sites or /dashboard/academy/practice when they ask to go somewhere or agree to your suggestion.`;

const TEXT = `You're replying in a chat panel next to the lesson. Use short Markdown: a few sentences, a short list if it helps, and links to dashboard pages like [Websites](/dashboard/sites).`;

// Coach's full instructions: who Coach is, Octacore itself, the lesson on screen, and the account as it is now.
export async function coachInstructions(
  env: CloudflareEnv,
  user: { id: string; email: string; name: string },
  lessonId: string | null,
  mode: "voice" | "text",
) {
  const found = lessonId ? findLesson(lessonId) : null;
  const tasks = await getTaskState(env.DB, user.id);
  const taskLines = Object.entries(TASKS)
    .map(([id, t]) => `- ${t.label}: ${tasks[id as keyof typeof tasks] ? "done" : "not yet"}`)
    .join("\n");
  const lesson = found
    ? `# The lesson on screen: ${found.module.title} → ${found.lesson.title}\n${lessonText(found.lesson)}${found.next ? `\n\nNext lesson: ${found.next.title}.` : ""}`
    : "# The user is on the Academy home page.";
  let snapshot = "";
  try {
    snapshot = (await accountSnapshot(env, user)).text;
  } catch (error) {
    console.error("Account snapshot failed", error);
  }
  return [COACH, mode === "voice" ? VOICE : TEXT, octacoreGuide(env.SITES_DOMAIN), lesson, `# Academy tasks\n${taskLines}`, snapshot]
    .filter(Boolean)
    .join("\n\n");
}

export function coachGreeting(name: string, lessonId: string | null) {
  const first = name.split(" ")[0] || "there";
  const found = lessonId ? findLesson(lessonId) : null;
  return found
    ? `Hey ${first}, I'm Coach. We're on "${found.lesson.title}". Want me to walk you through it, or do you have a question?`
    : `Hey ${first}, I'm Coach. Where do you want to start: building sites, finding clients, or cold calling?`;
}
