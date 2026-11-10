import { desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { participants, questionnaireResponses, sessions, taskResults } from "@/lib/db/schema";
import { adminDenied, isAdminRequest } from "@/lib/study/admin";

/** Facilitator view: one summary row per session, newest first. */
export async function GET(req: Request) {
  if (!isAdminRequest(req)) return adminDenied();

  const db = getDb();
  if (!db) return Response.json({ error: "Study database is not configured." }, { status: 503 });

  const rows = await db
    .select()
    .from(sessions)
    .leftJoin(participants, eq(sessions.participantId, participants.id))
    .orderBy(desc(sessions.startedAt));
  const allTasks = await db.select().from(taskResults);
  const allQuestionnaires = await db.select().from(questionnaireResponses);

  const summaries = rows.map(({ sessions: s, participants: p }) => {
    const tasks = allTasks.filter((t) => t.sessionId === s.id);
    const correct = tasks.filter((t) => t.correct).length;
    const sus = allQuestionnaires.find((q) => q.sessionId === s.id && q.instrument === "SUS");
    const tam = allQuestionnaires.find((q) => q.sessionId === s.id && q.instrument === "TAM");
    return {
      id: s.id,
      participantId: s.participantId,
      group: p?.group ?? null,
      experienceYears: p?.experienceYears ?? null,
      platformVersion: s.platformVersion,
      scenariosAssigned: s.scenarioIds.length,
      tasksCompleted: tasks.length,
      tasksCorrect: correct,
      totalErrors: tasks.reduce((sum, t) => sum + t.inputErrors, 0),
      susScore: sus?.score ?? null,
      tamSubscales: tam?.subscales ?? null,
      startedAt: s.startedAt.toISOString(),
      completedAt: s.completedAt?.toISOString() ?? null,
    };
  });

  const completed = summaries.filter((s) => s.completedAt);
  const susScores = completed.map((s) => s.susScore).filter((n): n is number => n != null);

  return Response.json({
    sessions: summaries,
    totals: {
      sessions: summaries.length,
      completed: completed.length,
      meanSus: susScores.length ? Number((susScores.reduce((a, b) => a + b, 0) / susScores.length).toFixed(1)) : null,
    },
  });
}
