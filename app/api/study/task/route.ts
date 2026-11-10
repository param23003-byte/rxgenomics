import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { taskResults } from "@/lib/db/schema";
import { SCENARIOS } from "@/study/scenarios";

/**
 * Records one completed case scenario: task success, time per task and errors.
 *
 * Correctness is decided here, on the server, against the frozen expected
 * answer in study/scenarios.ts. The client never sends whether it was right.
 */
export async function POST(req: Request) {
  const db = getDb();
  if (!db) {
    return NextResponse.json({ error: "Study database is not configured." }, { status: 503 });
  }

  const body = await req.json().catch(() => null);
  const scenario = SCENARIOS.find((s) => s.id === body?.scenarioId);
  if (!scenario) return NextResponse.json({ error: "Unknown scenario." }, { status: 400 });
  if (typeof body?.sessionId !== "string") return NextResponse.json({ error: "Missing session." }, { status: 400 });

  const startedAt = new Date(body.startedAt);
  const submittedAt = new Date(body.submittedAt);
  if (Number.isNaN(startedAt.getTime()) || Number.isNaN(submittedAt.getTime()) || submittedAt < startedAt) {
    return NextResponse.json({ error: "Invalid task timings." }, { status: 400 });
  }

  const correct = body.answer === scenario.expected.action;

  await db.insert(taskResults).values({
    sessionId: body.sessionId,
    scenarioId: scenario.id,
    startedAt,
    submittedAt,
    durationMs: submittedAt.getTime() - startedAt.getTime(),
    answer: String(body.answer ?? ""),
    correct,
    inputErrors: Math.max(0, Number(body.inputErrors) || 0),
    checksRun: Math.max(0, Number(body.checksRun) || 0),
  });

  // The participant is not told whether they were right: feedback mid-session
  // would change how they approach the remaining scenarios.
  return NextResponse.json({ recorded: true });
}
