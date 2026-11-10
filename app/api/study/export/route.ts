import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { participants, questionnaireResponses, sessions, taskResults } from "@/lib/db/schema";
import { adminDenied, isAdminRequest } from "@/lib/study/admin";
import { SCENARIOS } from "@/study/scenarios";
import { TAM_ITEMS } from "@/lib/study/tam";
import { SUS_ITEMS } from "@/lib/study/sus";

/**
 * Exports the study data as CSV for SPSS or PSPP.
 *
 * ?dataset=tasks    one row per case scenario attempted
 * ?dataset=sessions one row per participant session, with SUS and TAM scores
 *
 * The session export is the one most analyses start from: it is already in the
 * one-row-per-participant shape that SPSS expects for group comparisons.
 */
const csvCell = (value: unknown): string => {
  if (value == null) return "";
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const toCsv = (headers: string[], rows: unknown[][]): string =>
  [headers.join(","), ...rows.map((r) => r.map(csvCell).join(","))].join("\r\n") + "\r\n";

export async function GET(req: Request) {
  if (!isAdminRequest(req)) return adminDenied();

  const db = getDb();
  if (!db) return Response.json({ error: "Study database is not configured." }, { status: 503 });

  const dataset = new URL(req.url).searchParams.get("dataset") ?? "sessions";
  const allSessions = await db
    .select()
    .from(sessions)
    .leftJoin(participants, eq(sessions.participantId, participants.id));
  const allTasks = await db.select().from(taskResults);
  const allQuestionnaires = await db.select().from(questionnaireResponses);

  if (dataset === "tasks") {
    const headers = [
      "session_id", "participant_id", "group", "experience_years", "platform_version",
      "scenario_id", "scenario_kind", "gene", "diplotype", "drug",
      "expected_action", "answer", "correct", "duration_ms", "duration_s",
      "input_errors", "checks_run", "started_at", "submitted_at",
    ];
    const byId = new Map(allSessions.map((row) => [row.sessions.id, row]));
    const rows = allTasks.map((t) => {
      const s = byId.get(t.sessionId);
      const scenario = SCENARIOS.find((x) => x.id === t.scenarioId);
      return [
        t.sessionId, s?.sessions.participantId, s?.participants?.group, s?.participants?.experienceYears,
        s?.sessions.platformVersion, t.scenarioId, scenario?.kind, scenario?.gene, scenario?.diplotype,
        scenario?.drug, scenario?.expected.action, t.answer, t.correct ? 1 : 0, t.durationMs,
        (t.durationMs / 1000).toFixed(1), t.inputErrors, t.checksRun,
        t.startedAt.toISOString(), t.submittedAt.toISOString(),
      ];
    });
    return csvResponse("rxgenomics_tasks", toCsv(headers, rows));
  }

  const headers = [
    "session_id", "participant_id", "group", "experience_years", "platform_version",
    "scenarios_assigned", "tasks_completed", "tasks_correct", "task_success_rate",
    "median_time_s", "mean_time_s", "total_errors",
    "sus_score", "tam_perceived_usefulness", "tam_perceived_ease_of_use", "tam_intention_to_use",
    "started_at", "completed_at",
    ...SUS_ITEMS.map((_, i) => `sus_q${i + 1}`),
    ...TAM_ITEMS.map((item) => `tam_${item.id.toLowerCase()}`),
  ];

  const rows = allSessions.map(({ sessions: s, participants: p }) => {
    const tasks = allTasks.filter((t) => t.sessionId === s.id);
    const times = tasks.map((t) => t.durationMs / 1000).sort((a, b) => a - b);
    const median = times.length
      ? times.length % 2
        ? times[(times.length - 1) / 2]
        : (times[times.length / 2 - 1] + times[times.length / 2]) / 2
      : null;
    const correct = tasks.filter((t) => t.correct).length;
    const sus = allQuestionnaires.find((q) => q.sessionId === s.id && q.instrument === "SUS");
    const tam = allQuestionnaires.find((q) => q.sessionId === s.id && q.instrument === "TAM");

    return [
      s.id, s.participantId, p?.group, p?.experienceYears, s.platformVersion,
      s.scenarioIds.length, tasks.length, correct,
      tasks.length ? (correct / tasks.length).toFixed(4) : "",
      median?.toFixed(1), times.length ? (times.reduce((a, b) => a + b, 0) / times.length).toFixed(1) : "",
      tasks.reduce((sum, t) => sum + t.inputErrors, 0),
      sus?.score ?? "",
      tam?.subscales?.perceived_usefulness ?? "",
      tam?.subscales?.perceived_ease_of_use ?? "",
      tam?.subscales?.intention_to_use ?? "",
      s.startedAt.toISOString(), s.completedAt?.toISOString() ?? "",
      ...SUS_ITEMS.map((_, i) => sus?.responses?.[`SUS${i + 1}`] ?? ""),
      ...TAM_ITEMS.map((item) => tam?.responses?.[item.id] ?? ""),
    ];
  });

  return csvResponse("rxgenomics_sessions", toCsv(headers, rows));
}

function csvResponse(name: string, body: string): Response {
  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name}_${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
