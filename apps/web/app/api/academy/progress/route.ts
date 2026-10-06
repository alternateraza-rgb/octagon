import { academyAccess, notFound } from "@/lib/academy/access";
import { findLesson } from "@/lib/academy/curriculum";
import { completeLesson } from "@/lib/academy/store";

// Marks a lesson done by hand (lessons with tasks also complete themselves).
export async function POST(request: Request) {
  const access = await academyAccess();
  if (!access) return notFound();
  const { lessonId } = (await request.json().catch(() => ({}))) as { lessonId?: unknown };
  if (typeof lessonId !== "string" || !findLesson(lessonId)) return Response.json({ error: "Lesson not found." }, { status: 404 });
  await completeLesson(access.env.DB, access.user.id, lessonId);
  return Response.json({ ok: true });
}
