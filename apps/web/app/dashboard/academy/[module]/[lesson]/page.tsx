import { notFound } from "next/navigation";
import { LessonView } from "@/components/academy/lesson-view";
import { academyAccess } from "@/lib/academy/access";
import { MODULES, findLesson, isLessonDone } from "@/lib/academy/curriculum";
import { getCompleted, listAcademyLeads } from "@/lib/academy/store";
import { getTaskState } from "@/lib/academy/tasks";
import { voiceEnabled } from "@/lib/academy/voice";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ module: string; lesson: string }> };

export async function generateMetadata({ params }: Params) {
  const { module, lesson } = await params;
  return { title: findLesson(`${module}/${lesson}`)?.lesson.title ?? "Academy" };
}

export default async function LessonPage({ params }: Params) {
  const { module, lesson: slug } = await params;
  const found = findLesson(`${module}/${slug}`);
  const access = await academyAccess();
  if (!access || !found) notFound();
  const { env, user } = access;
  const [completed, tasks, leads] = await Promise.all([
    getCompleted(env.DB, user.id),
    getTaskState(env.DB, user.id),
    listAcademyLeads(env.DB, user.id, env.SITES_DOMAIN),
  ]);
  const { lesson, prev, next } = found;
  return (
    <LessonView
      lesson={lesson}
      module={{ id: found.module.id, title: found.module.title }}
      moduleIndex={MODULES.indexOf(found.module)}
      siblings={found.module.lessons.map((l) => ({ id: l.id, title: l.title, done: isLessonDone(l, completed, tasks) }))}
      prev={prev ? { id: prev.id, title: prev.title } : null}
      next={next ? { id: next.id, title: next.title } : null}
      done={isLessonDone(lesson, completed, tasks)}
      tasks={tasks}
      leads={leads}
      voice={voiceEnabled(env, "coach")}
    />
  );
}
