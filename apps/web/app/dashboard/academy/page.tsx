import { notFound } from "next/navigation";
import { AcademyHome } from "@/components/academy/academy-home";
import { academyAccess } from "@/lib/academy/access";
import { MODULES, isLessonDone } from "@/lib/academy/curriculum";
import { getCompleted, listCalls } from "@/lib/academy/store";
import { getTaskState } from "@/lib/academy/tasks";

export const metadata = { title: "Academy" };
export const dynamic = "force-dynamic";

export default async function AcademyPage() {
  const access = await academyAccess();
  if (!access) notFound();
  const { env, user } = access;
  const [completed, tasks, calls] = await Promise.all([getCompleted(env.DB, user.id), getTaskState(env.DB, user.id), listCalls(env.DB, user.id, 10)]);
  const modules = MODULES.map((m) => ({
    id: m.id,
    title: m.title,
    tagline: m.tagline,
    lessons: m.lessons.map((l) => ({ id: l.id, title: l.title, summary: l.summary, minutes: l.minutes, done: isLessonDone(l, completed, tasks) })),
  }));
  return <AcademyHome modules={modules} calls={calls.map((c) => ({ id: c.id, prospectName: c.prospectName, score: c.score, createdAt: c.createdAt }))} />;
}
